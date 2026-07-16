import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
const { url, anonKey } = window.TIBLY_SUPABASE;
const supabase = createClient(url, anonKey);
function SignInForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email) return;
    setLoading(true);
    const { error: error2 } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error2) {
      setError(error2.message);
    } else {
      setSent(true);
    }
  };
  if (sent) {
    return /* @__PURE__ */ jsxs("div", { className: "card p-6 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-display text-xl text-ink mb-2", children: "Check your inbox" }),
      /* @__PURE__ */ jsxs("p", { className: "text-ink/70", children: [
        "We sent a magic link to ",
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: email }),
        ". Click it to sign in \u2014 no password needed."
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "card p-6 max-w-md mx-auto", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-xl text-ink mb-2", children: "Sign in / Sign up" }),
    /* @__PURE__ */ jsx("p", { className: "text-ink/70 mb-4", children: "Enter your email and we'll send you a secure link to sign in. No password required." }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "flex flex-col gap-3", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "email",
          required: true,
          placeholder: "you@example.com",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          className: "w-full rounded-md border border-ink/20 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600"
        }
      ),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: loading, className: "btn", children: loading ? "Sending link\u2026" : "Send magic link" }),
      error && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm", children: error })
    ] })
  ] });
}
function ProfileEditor({
  userId,
  onSetupMissing
}) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error: error2 } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      if (!active) return;
      if (error2) {
        onSetupMissing();
      } else if (data) {
        setProfile(data);
        setName(data.display_name ?? "");
        setPhone(data.phone ?? "");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId]);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: error2 } = await supabase.from("profiles").upsert({ user_id: userId, display_name: name, phone });
    setSaving(false);
    if (error2) {
      setError("Could not save your profile right now.");
    } else {
      setSaved(true);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "card p-6 text-ink/60", children: "Loading your profile\u2026" });
  }
  return /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-xl text-ink mb-4", children: "Your Profile" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: save, className: "flex flex-col gap-3 max-w-md", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-sm text-ink/70", children: [
        "Name",
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: name,
            onChange: (e) => setName(e.target.value),
            className: "mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600",
            placeholder: "Your name"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "text-sm text-ink/70", children: [
        "Phone",
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "tel",
            value: phone,
            onChange: (e) => setPhone(e.target.value),
            className: "mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600",
            placeholder: "(555) 555-5555"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: saving, className: "btn self-start", children: saving ? "Saving\u2026" : "Save profile" }),
      saved && /* @__PURE__ */ jsx("p", { className: "text-green-600 text-sm", children: "Saved!" }),
      error && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm", children: error })
    ] })
  ] });
}
function BookingHistory({
  userId,
  onSetupMissing
}) {
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("bookings").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        onSetupMissing();
      } else {
        setBookings(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId]);
  return /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-xl text-ink mb-4", children: "Booking History" }),
    loading ? /* @__PURE__ */ jsx("p", { className: "text-ink/60", children: "Loading your bookings\u2026" }) : !bookings || bookings.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-ink/60", children: "You don't have any bookings yet. Once you request a show with Sydney, it'll show up here." }) : /* @__PURE__ */ jsx("ul", { className: "flex flex-col gap-3", children: bookings.map((b) => /* @__PURE__ */ jsxs(
      "li",
      {
        className: "border border-ink/10 rounded-md p-3 flex flex-col sm:flex-row sm:justify-between gap-1",
        children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-ink", children: b.event_type || "Live performance" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink/60 text-sm", children: b.location || "Location TBD" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm text-ink/70 text-right", children: [
            /* @__PURE__ */ jsx("p", { children: b.event_date || "Date TBD" }),
            /* @__PURE__ */ jsx("p", { className: "capitalize", children: b.status })
          ] })
        ]
      },
      b.id
    )) })
  ] });
}
function App() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);
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
  return /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-4 py-10", children: [
    /* @__PURE__ */ jsxs("header", { className: "mb-8 text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl text-ink mb-2", children: "Your Account \u2014 Sydney Small Live" }),
      /* @__PURE__ */ jsx("p", { className: "text-ink/70", children: "Manage your profile and see your history booking Sydney to sing around NYC." })
    ] }),
    setupMissing && /* @__PURE__ */ jsx("div", { className: "card p-4 mb-6 border border-yellow-400/50 bg-yellow-50", children: /* @__PURE__ */ jsx("p", { className: "text-yellow-800 text-sm", children: "This page isn't fully set up yet. Please check back soon, or contact Sydney directly to book a show." }) }),
    checkingSession ? /* @__PURE__ */ jsx("div", { className: "card p-6 text-center text-ink/60", children: "Checking your session\u2026" }) : !userId ? /* @__PURE__ */ jsx(SignInForm, {}) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "card p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-ink", children: [
          "Signed in as",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: userEmail })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: signOut, className: "btn-secondary", children: "Sign out" })
      ] }),
      /* @__PURE__ */ jsx(
        ProfileEditor,
        {
          userId,
          onSetupMissing: () => setSetupMissing(true)
        }
      ),
      /* @__PURE__ */ jsx(
        BookingHistory,
        {
          userId,
          onSetupMissing: () => setSetupMissing(true)
        }
      )
    ] })
  ] });
}
createRoot(document.getElementById("tibly-app-root")).render(/* @__PURE__ */ jsx(App, {}));
