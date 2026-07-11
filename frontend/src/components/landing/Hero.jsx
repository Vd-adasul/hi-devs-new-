import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShieldCheck, FileText, AlertTriangle } from "lucide-react";
import { MaskLine } from "./primitives";

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "24%"]);
  const cardY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);

  const go = () => document.querySelector("#waitlist")?.scrollIntoView({ behavior: "smooth" });
  const goDemo = () => document.querySelector("#demo")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section ref={ref} className="relative overflow-hidden pt-36 pb-24 lg:pt-44 lg:pb-32">
      {/* Parallax abstract backdrop */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10 opacity-[0.06]">
        <img
          src="https://images.unsplash.com/photo-1545987796-200677ee1011?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGRhdGElMjBjb25uZWN0aW9uJTIwbmV0d29ya3xlbnwwfHx8fDE3ODM4MDk0MTJ8MA&ixlib=rb-4.1.0&q=85"
          alt=""
          className="w-full h-full object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 -z-10 grid-lines opacity-60" />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-1.5 text-xs font-semibold tracking-wide text-ink/70 shadow-sm"
          data-testid="hero-badge"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
          Enterprise Legal AI · SOC 2 aligned
        </motion.div>

        <h1 className="mt-8 font-serif font-medium tracking-tighter leading-[0.95] text-ink text-5xl sm:text-7xl lg:text-[7.5vw]">
          <MaskLine delay={0.25}>Contract intelligence</MaskLine>
          <MaskLine delay={0.38} className="italic text-ink/90">for the modern</MaskLine>
          <MaskLine delay={0.51}>legal enterprise.</MaskLine>
        </h1>

        <div className="mt-10 grid lg:grid-cols-12 gap-8 items-end">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="lg:col-span-6 text-lg md:text-xl font-sans leading-relaxed text-ink/70 max-w-xl"
          >
            lawOS reads every clause, scores risk in seconds, routes approvals, tracks obligations
            and never lets a renewal slip. Your legal team, operating at the speed of software.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.8 }}
            className="lg:col-span-6 flex flex-wrap items-center gap-4 lg:justify-end"
          >
            <button
              onClick={go}
              className="group inline-flex items-center gap-2 rounded-full bg-ink text-bone px-7 py-4 text-sm font-semibold hover:bg-signal transition-colors duration-300"
              data-testid="hero-cta-primary"
            >
              Request access
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <button
              onClick={goDemo}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-7 py-4 text-sm font-semibold text-ink hover:border-ink/40 transition-colors duration-300"
              data-testid="hero-cta-secondary"
            >
              See how it works
            </button>
          </motion.div>
        </div>

        {/* Animated product preview */}
        <motion.div style={{ y: cardY }} className="mt-16 lg:mt-20">
          <HeroPreview />
        </motion.div>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 1, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1200 }}
      className="relative rounded-2xl border border-ink/10 bg-white shadow-[0_40px_120px_-40px_rgba(10,10,10,0.35)] overflow-hidden"
      data-testid="hero-preview"
    >
      <div className="flex items-center gap-2 border-b border-ink/10 px-5 py-3 bg-bone/60">
        <span className="h-3 w-3 rounded-full bg-ink/15" />
        <span className="h-3 w-3 rounded-full bg-ink/15" />
        <span className="h-3 w-3 rounded-full bg-ink/15" />
        <span className="ml-3 text-xs font-medium text-ink/50">lawOS — Master Services Agreement.pdf</span>
      </div>
      <div className="grid md:grid-cols-3 gap-0">
        {/* Document */}
        <div className="md:col-span-2 p-6 md:p-8 border-r border-ink/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink/50 uppercase tracking-widest">
            <FileText className="h-4 w-4" /> Clause review
          </div>
          <div className="mt-5 space-y-3">
            {[
              { w: "w-11/12", risk: false },
              { w: "w-full", risk: false },
              { w: "w-10/12", risk: true, label: "Uncapped liability" },
              { w: "w-full", risk: false },
              { w: "w-9/12", risk: true, label: "Auto-renewal 60d notice" },
              { w: "w-11/12", risk: false },
            ].map((l, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + i * 0.12 }}
                className="flex items-center gap-3"
              >
                <div
                  className={`h-2.5 rounded-full ${l.w} ${
                    l.risk ? "bg-destructive/70" : "bg-ink/10"
                  }`}
                />
                {l.risk && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold px-2 py-0.5">
                    <AlertTriangle className="h-3 w-3" /> {l.label}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        {/* Risk panel */}
        <div className="p-6 md:p-8 bg-bone/40">
          <div className="text-xs font-semibold text-ink/50 uppercase tracking-widest">Risk score</div>
          <div className="mt-4 flex items-end gap-2">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="font-serif text-6xl leading-none text-ink"
            >
              72
            </motion.span>
            <span className="mb-1 text-sm font-semibold text-destructive">High</span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-ink/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "72%" }}
              transition={{ delay: 1.7, duration: 1 }}
              className="h-full bg-gradient-to-r from-signal to-destructive"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="mt-6 rounded-xl border border-signal/20 bg-signal/5 p-4"
          >
            <div className="flex items-center gap-2 text-signal text-xs font-bold uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4" /> AI suggestion
            </div>
            <p className="mt-2 text-sm text-ink/70 leading-relaxed">
              Add a liability cap at 12 months of fees. Insert 90-day renewal notice window.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
