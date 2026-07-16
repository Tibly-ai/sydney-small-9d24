/* TIBLY:SQL
CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date date,
  event_type text,
  location text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "bookings_select_own" ON bookings FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "bookings_insert_own" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
*/

import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

const { url, anonKey } = (window as any).TIBLY_SUPABASE;
const supabase = createClient(url, anonKey);

type Profile = {
  user_id: string;
  display_name: string | null;
  phone: string | null;
};

type Booking = {
  id: string;
  event_date: string | null;
  event_type: string | null;
  location: string | null;
  status: string;
  created_at: string;
};

function SignInForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="card p-6 text-center">
        <h2 className="font-display text-xl text-ink mb-2">Check your inbox</h2>
        <p className="text-ink/70">
          We sent a magic link to <span className="font-medium">{email}</span>.
          Click it to sign in — no password needed.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 max-w-md mx-auto">
      <h2 className="font-display text-xl text-ink mb-2">Sign in / Sign up</h2>
      <p className="text-ink/70 mb-4">
        Enter your email and we'll send you a secure link to sign in. No
        password required.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-ink/20 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600"
        />
        <button type="submit" disabled={loading} className="btn">
          {loading ? "Sending link…" : "Send magic link"}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  );
}

function ProfileEditor({
  userId,
  onSetupMissing,
}: {
  userId: string;
  onSetupMissing: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!active) return;
      if (error) {
        onSetupMissing();
      } else if (data) {
        setProfile(data as Profile);
        setName(data.display_name ?? "");
        setPhone(data.phone ?? "");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, display_name: name, phone });
    setSaving(false);
    if (error) {
      setError("Could not save your profile right now.");
    } else {
      setSaved(true);
    }
  };

  if (loading) {
    return <div className="card p-6 text-ink/60">Loading your profile…</div>;
  }

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl text-ink mb-4">Your Profile</h2>
      <form onSubmit={save} className="flex flex-col gap-3 max-w-md">
        <label className="text-sm text-ink/70">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="Your name"
          />
        </label>
        <label className="text-sm text-ink/70">
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="(555) 555-5555"
          />
        </label>
        <button type="submit" disabled={saving} className="btn self-start">
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <p className="text-green-600 text-sm">Saved!</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  );
}

function BookingHistory({
  userId,
  onSetupMissing,
}: {
  userId: string;
  onSetupMissing: () => void;
}) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        onSetupMissing();
      } else {
        setBookings((data as Booking[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl text-ink mb-4">Booking History</h2>
      {loading ? (
        <p className="text-ink/60">Loading your bookings…</p>
      ) : !bookings || bookings.length === 0 ? (
        <p className="text-ink/60">
          You don't have any bookings yet. Once you request a show with
          Sydney, it'll show up here.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="border border-ink/10 rounded-md p-3 flex flex-col sm:flex-row sm:justify-between gap-1"
            >
              <div>
                <p className="font-medium text-ink">
                  {b.event_type || "Live performance"}
                </p>
                <p className="text-ink/60 text-sm">
                  {b.location || "Location TBD"}
                </p>
              </div>
              <div className="text-sm text-ink/70 text-right">
                <p>{b.event_date || "Date TBD"}</p>
                <p className="capitalize">{b.status}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function App() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [setupMissing, setSetupMissing] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserEmail(data.session?.user.email ?? null);
      setUserId(data.session?.user.id ?? null);
      setCheckingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      setUserId(session?.user.id ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="font-display text-3xl text-ink mb-2">
          Your Account — Sydney Small Live
        </h1>
        <p className="text-ink/70">
          Manage your profile and see your history booking Sydney to sing
          around NYC.
        </p>
      </header>

      {setupMissing && (
        <div className="card p-4 mb-6 border border-yellow-400/50 bg-yellow-50">
          <p className="text-yellow-800 text-sm">
            This page isn't fully set up yet. Please check back soon, or
            contact Sydney directly to book a show.
          </p>
        </div>
      )}

      {checkingSession ? (
        <div className="card p-6 text-center text-ink/60">
          Checking your session…
        </div>
      ) : !userId ? (
        <SignInForm />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="card p-4 flex items-center justify-between">
            <p className="text-ink">
              Signed in as{" "}
              <span className="font-medium">{userEmail}</span>
            </p>
            <button onClick={signOut} className="btn-secondary">
              Sign out
            </button>
          </div>
          <ProfileEditor
            userId={userId}
            onSetupMissing={() => setSetupMissing(true)}
          />
          <BookingHistory
            userId={userId}
            onSetupMissing={() => setSetupMissing(true)}
          />
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("tibly-app-root")!).render(<App />);