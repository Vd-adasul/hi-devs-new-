import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Reveal, Overline } from "./primitives";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TEAM_SIZES = ["1–10", "11–50", "51–200", "200+"];

export default function Waitlist() {
  const [form, setForm] = useState({ name: "", email: "", company: "", team_size: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please add your name and work email.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/waitlist`, form);
      setDone(true);
      toast.success("You're on the list. We'll be in touch shortly.");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="py-24 lg:py-36" data-testid="waitlist-section">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="rounded-3xl bg-ink text-bone overflow-hidden grid lg:grid-cols-2">
          <div className="p-10 lg:p-14 relative">
            <div className="absolute inset-0 grid-lines-dark opacity-40" />
            <div className="relative">
              <Overline className="text-signal">Request access</Overline>
              <h2 className="mt-6 font-serif text-4xl lg:text-5xl leading-tight tracking-tight">
                Give your legal team its hours back.</h2>
              <p className="mt-5 text-lg text-bone/60 leading-relaxed max-w-md">
                Join the enterprises modernising legal operations with lawOS. We&apos;ll set you up with
                a tailored walkthrough of the platform.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-bone/70">
                {["White-glove onboarding", "Your playbooks, configured", "SOC 2–aligned security review"].map((x) => (
                  <li key={x} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-signal" /> {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-10 lg:p-14 bg-bone text-ink">
            {done ? (
              <div className="h-full grid place-items-center text-center" data-testid="waitlist-success">
                <div>
                  <CheckCircle2 className="mx-auto h-14 w-14 text-signal" />
                  <h3 className="mt-5 font-serif text-3xl text-ink">You&apos;re on the list.</h3>
                  <p className="mt-2 text-ink/60">Our team will reach out to {form.email}.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4" data-testid="waitlist-form">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name" testid="waitlist-name">
                    <input value={form.name} onChange={update("name")} className={inputCls} placeholder="Jane Doe" data-testid="waitlist-input-name" />
                  </Field>
                  <Field label="Work email" testid="waitlist-email">
                    <input type="email" value={form.email} onChange={update("email")} className={inputCls} placeholder="jane@company.com" data-testid="waitlist-input-email" />
                  </Field>
                </div>
                <Field label="Company">
                  <input value={form.company} onChange={update("company")} className={inputCls} placeholder="Company name" data-testid="waitlist-input-company" />
                </Field>
                <Field label="Team size">
                  <div className="flex flex-wrap gap-2">
                    {TEAM_SIZES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, team_size: t }))}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                          form.team_size === t ? "bg-ink text-bone border-ink" : "border-ink/15 text-ink/70 hover:border-ink/40"
                        }`}
                        data-testid={`waitlist-team-${t}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Anything we should know? (optional)">
                  <textarea value={form.message} onChange={update("message")} rows={3} className={`${inputCls} resize-none`} placeholder="Tell us about your use case" data-testid="waitlist-input-message" />
                </Field>
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-ink text-bone px-6 py-4 text-sm font-semibold hover:bg-signal transition-colors duration-300 disabled:opacity-60"
                  data-testid="waitlist-submit"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Request access <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-4 text-ink placeholder:text-ink/35 focus:border-signal focus:ring-2 focus:ring-signal/20 outline-none transition-colors duration-200";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
