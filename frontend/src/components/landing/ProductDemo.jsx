import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, ScanText, Gauge, Lightbulb, GitPullRequestArrow, ListChecks, BellRing,
} from "lucide-react";
import { Reveal, Overline } from "./primitives";

const STEPS = [
  { icon: Upload, label: "Upload contract", detail: "Drag in a PDF or DOCX. Parsing begins instantly." },
  { icon: ScanText, label: "AI reviews clauses", detail: "Every clause is read and matched to your playbook." },
  { icon: Gauge, label: "Risk score updates", detail: "A live score quantifies exposure as review runs." },
  { icon: Lightbulb, label: "Suggestion appears", detail: "Redlines and fallback language proposed in-line." },
  { icon: GitPullRequestArrow, label: "Approval workflow", detail: "Routed to the right approvers automatically." },
  { icon: ListChecks, label: "Obligation extraction", detail: "Commitments and deadlines captured to a tracker." },
  { icon: BellRing, label: "Renewal reminder", detail: "Notice windows scheduled so nothing lapses." },
];

export default function ProductDemo() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="demo" className="py-24 lg:py-36" data-testid="product-demo">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <Overline>The lawOS workflow</Overline>
          <h2 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight text-ink max-w-3xl">
            From signed PDF to tracked obligation — watch it happen.
          </h2>
        </Reveal>

        <div className="mt-14 grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Stepper */}
          <div className="lg:col-span-5 space-y-1">
            {STEPS.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.label}
                  onClick={() => setActive(i)}
                  className="w-full text-left relative pl-14 py-4 group"
                  data-testid={`demo-step-${i}`}
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full border transition-colors duration-300 ${
                      on ? "bg-ink text-bone border-ink" : "bg-white text-ink/50 border-ink/15"
                    }`}
                  >
                    <s.icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className="absolute left-5 top-[calc(50%+20px)] h-[calc(100%-8px)] w-px bg-ink/10" />
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`font-serif text-xl transition-colors duration-300 ${on ? "text-ink" : "text-ink/50"}`}>
                      {s.label}
                    </span>
                  </div>
                  <AnimatePresence>
                    {on && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-ink/60 overflow-hidden"
                      >
                        {s.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          {/* Live panel */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-[0_40px_100px_-50px_rgba(10,10,10,0.4)] overflow-hidden min-h-[420px]">
              <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3 bg-bone/50">
                <span className="text-xs font-semibold text-ink/50">lawOS · Live review</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-signal">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" /> Processing
                </span>
              </div>
              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <DemoPanel step={active} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bar({ w, danger }) {
  return <div className={`h-2.5 rounded-full ${w} ${danger ? "bg-destructive/60" : "bg-ink/10"}`} />;
}

function DemoPanel({ step }) {
  if (step === 0)
    return (
      <div className="grid place-items-center h-72 rounded-xl border-2 border-dashed border-ink/15">
        <div className="text-center">
          <Upload className="mx-auto h-10 w-10 text-ink/40" />
          <p className="mt-4 font-serif text-2xl text-ink">MSA_Acme_2025.pdf</p>
          <p className="text-sm text-ink/50">14 pages · uploading…</p>
          <div className="mt-4 mx-auto w-48 h-1.5 rounded-full bg-ink/10 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.6 }} className="h-full bg-signal" />
          </div>
        </div>
      </div>
    );
  if (step === 1)
    return (
      <div className="space-y-4">
        {["w-full", "w-11/12", "w-10/12", "w-full", "w-9/12", "w-11/12"].map((w, i) => (
          <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}>
            <Bar w={w} />
          </motion.div>
        ))}
        <p className="pt-2 text-sm text-ink/60">Scanning 48 clauses against “Standard SaaS Playbook”…</p>
      </div>
    );
  if (step === 2)
    return (
      <div className="text-center py-6">
        <p className="text-xs uppercase tracking-widest text-ink/50 font-semibold">Portfolio risk score</p>
        <div className="mt-3 font-serif text-7xl text-ink">72<span className="text-3xl text-destructive align-top">/100</span></div>
        <div className="mt-5 mx-auto max-w-md h-2.5 rounded-full bg-ink/10 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: "72%" }} transition={{ duration: 1.2 }} className="h-full bg-gradient-to-r from-signal to-destructive" />
        </div>
        <div className="mt-6 flex justify-center gap-3 text-sm">
          <span className="rounded-full bg-destructive/10 text-destructive font-semibold px-3 py-1">2 high</span>
          <span className="rounded-full bg-ink/5 text-ink/60 font-semibold px-3 py-1">5 medium</span>
        </div>
      </div>
    );
  if (step === 3)
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-destructive">Clause 9.2 · Limitation of liability</p>
          <p className="mt-1 text-sm text-ink/60 line-through">Liability shall be unlimited for all claims…</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-signal/25 bg-signal/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-signal">Suggested redline</p>
          <p className="mt-1 text-sm text-ink/80">…liability shall be capped at 12 months of fees paid.</p>
        </motion.div>
      </div>
    );
  if (step === 4)
    return (
      <div className="space-y-3">
        {[
          { r: "Legal reviewer", s: "Approved" },
          { r: "Finance", s: "Approved" },
          { r: "General Counsel", s: "Pending" },
        ].map((x, i) => (
          <motion.div key={x.r} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }} className="flex items-center justify-between rounded-xl border border-ink/10 p-4">
            <span className="font-medium text-ink">{x.r}</span>
            <span className={`text-sm font-semibold ${x.s === "Approved" ? "text-signal" : "text-ink/40"}`}>{x.s}</span>
          </motion.div>
        ))}
      </div>
    );
  if (step === 5)
    return (
      <div className="space-y-3">
        {[
          "Deliver onboarding within 30 days of signature",
          "Provide 99.9% uptime SLA, reported monthly",
          "Data deletion within 60 days of termination",
        ].map((o, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.18 }} className="flex items-start gap-3 rounded-xl border border-ink/10 p-4">
            <ListChecks className="mt-0.5 h-5 w-5 text-signal shrink-0" />
            <span className="text-sm text-ink/80">{o}</span>
          </motion.div>
        ))}
      </div>
    );
  return (
    <div className="grid place-items-center h-72">
      <div className="text-center">
        <span className="grid place-items-center mx-auto h-16 w-16 rounded-full bg-signal/10 text-signal">
          <BellRing className="h-7 w-7" />
        </span>
        <p className="mt-5 font-serif text-2xl text-ink">Renewal in 90 days</p>
        <p className="text-sm text-ink/60">Notice window opens 12 Mar 2026 · owner alerted</p>
      </div>
    </div>
  );
}
