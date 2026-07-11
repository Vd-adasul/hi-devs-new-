import { Clock, GitBranch, CalendarX, ShieldAlert, ReceiptText } from "lucide-react";
import { Reveal, Overline, CountUp } from "./primitives";

const CHAPTERS = [
  {
    n: "01",
    icon: Clock,
    title: "Hours lost to manual review",
    body: "Lawyers read the same boilerplate on every deal. High-value experts spend their day comparing clauses instead of advising the business.",
  },
  {
    n: "02",
    icon: GitBranch,
    title: "Workflows held together by email",
    body: "Approvals live in inboxes and spreadsheets. Nobody knows who signed off, which version is current, or where a contract is stuck.",
  },
  {
    n: "03",
    icon: CalendarX,
    title: "Renewals that slip through",
    body: "Auto-renewals fire silently. Notice windows are missed. Teams discover they're locked into another year only after the money is gone.",
  },
  {
    n: "04",
    icon: ShieldAlert,
    title: "Compliance risk hiding in the fine print",
    body: "Uncapped liability, missing DPAs, unfavourable governing law — buried across thousands of documents with no way to surface them.",
  },
  {
    n: "05",
    icon: ReceiptText,
    title: "Invoice & obligation disputes",
    body: "Payment terms and deliverables agreed months ago are forgotten. Disputes surface late, straining vendor and customer relationships.",
  },
];

export default function Manifesto() {
  return (
    <section className="py-24 lg:py-36" data-testid="problem-section">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Sticky intro */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <Overline>The status quo is expensive</Overline>
              <h2 className="mt-6 font-serif text-4xl sm:text-5xl leading-tight tracking-tight text-ink">
                Legal is the last function still running on paper logic.
              </h2>
              <div className="mt-10 grid grid-cols-2 gap-8">
                <div>
                  <div className="font-serif text-4xl text-ink">
                    <CountUp to={9} suffix="+" />
                  </div>
                  <p className="mt-1 text-sm text-ink/60">hours per contract, reviewed manually</p>
                </div>
                <div>
                  <div className="font-serif text-4xl text-ink">
                    <CountUp to={40} suffix="%" />
                  </div>
                  <p className="mt-1 text-sm text-ink/60">of renewals missed or mispriced</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrolling chapters */}
          <div className="lg:col-span-8 space-y-4">
            {CHAPTERS.map((c, i) => (
              <Reveal key={c.n} delay={i * 0.05}>
                <div className="group grid grid-cols-[auto_1fr] gap-6 md:gap-10 items-start border-b border-ink/10 py-8 hover:bg-white transition-colors duration-300 rounded-lg px-2 md:px-4">
                  <span className="font-serif text-3xl md:text-5xl text-ink/20 group-hover:text-signal transition-colors duration-300 tabular-nums">
                    {c.n}
                  </span>
                  <div>
                    <div className="flex items-center gap-3">
                      <c.icon className="h-5 w-5 text-ink/50" strokeWidth={1.75} />
                      <h3 className="font-serif text-2xl md:text-3xl text-ink">{c.title}</h3>
                    </div>
                    <p className="mt-3 text-base md:text-lg text-ink/65 leading-relaxed max-w-2xl">
                      {c.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
