import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  FileSearch, Sparkles, ShieldAlert, GitPullRequestArrow, ListChecks,
  CalendarClock, BookOpenCheck, BarChart3, Share2, MessagesSquare,
} from "lucide-react";
import { Reveal, Overline } from "./primitives";

const FEATURES = [
  { icon: FileSearch, title: "Contract Intelligence", body: "Ingest any PDF or DOCX. lawOS structures parties, terms, clauses and metadata into a searchable model.", span: "md:col-span-7", tall: true, img: "https://images.unsplash.com/photo-1483366774565-c783b9f70e2c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxtaW5pbWFsaXN0JTIwbW9kZXJuJTIwb2ZmaWNlJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc4MzgwOTQxMnww&ixlib=rb-4.1.0&q=85" },
  { icon: Sparkles, title: "AI Review", body: "Clause-by-clause analysis against your standards in seconds, with plain-English rationale.", span: "md:col-span-5" },
  { icon: ShieldAlert, title: "Risk Detection", body: "Surface uncapped liability, unfavourable terms and missing protections automatically.", span: "md:col-span-5" },
  { icon: GitPullRequestArrow, title: "Approvals", body: "Route documents to the right reviewers with rules-based, auditable workflows.", span: "md:col-span-7" },
  { icon: ListChecks, title: "Obligations", body: "Extract commitments and deadlines so nothing agreed is ever forgotten.", span: "md:col-span-4" },
  { icon: CalendarClock, title: "Renewals", body: "Track notice windows and get alerted before every auto-renewal fires.", span: "md:col-span-4" },
  { icon: BookOpenCheck, title: "Playbooks", body: "Codify your positions and fallbacks so every negotiation stays on-policy.", span: "md:col-span-4" },
  { icon: BarChart3, title: "Analytics", body: "Cycle times, risk exposure and portfolio health across every agreement.", span: "md:col-span-5" },
  { icon: Share2, title: "Knowledge Graph", body: "See how parties, obligations and clauses connect across your entire book.", span: "md:col-span-7", badge: "Upcoming" },
  { icon: MessagesSquare, title: "Ask AI", body: "Ask questions in natural language and get grounded answers with citations.", span: "md:col-span-12", wide: true, badge: "Upcoming" },
];

function TiltCard({ children, className = "", testid }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className={className}
      data-testid={testid}
    >
      {children}
    </motion.div>
  );
}

export default function Solution() {
  return (
    <section id="solution" className="py-24 lg:py-36 bg-white border-y border-ink/10" data-testid="solution-section">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <Overline>One platform, end to end</Overline>
          <h2 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight text-ink max-w-3xl">
            Everything legal operations needs, in a single intelligent system.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-5" style={{ perspective: 1400 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.06} className={f.span}>
              <TiltCard
                testid={`feature-${f.title.toLowerCase().replace(/\s/g, "-")}`}
                className="h-full rounded-2xl border border-ink/10 bg-bone/50 p-7 hover:border-ink/25 hover:shadow-[0_24px_60px_-30px_rgba(10,10,10,0.3)] transition-[box-shadow,border-color] duration-300"
              >
                <div className="flex items-start justify-between">
                  <span className="grid place-items-center h-11 w-11 rounded-xl bg-ink text-bone">
                    <f.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  {f.badge && (
                    <span className="rounded-full border border-signal/30 bg-signal/10 text-signal text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-5 font-serif text-2xl text-ink">{f.title}</h3>
                <p className="mt-2 text-base text-ink/65 leading-relaxed max-w-md">{f.body}</p>
                {f.img && (
                  <div className="mt-6 overflow-hidden rounded-xl border border-ink/10">
                    <img src={f.img} alt="" className="w-full h-40 object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                  </div>
                )}
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
