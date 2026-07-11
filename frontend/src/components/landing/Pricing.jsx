import { Check, ArrowRight } from "lucide-react";
import { Reveal, Overline } from "./primitives";

const PLANS = [
  {
    name: "Team",
    price: "$490",
    period: "/mo",
    desc: "For growing legal teams standardising their review process.",
    features: ["Up to 200 contracts/mo", "AI clause review", "Risk detection", "Obligation tracking", "Email support"],
    cta: "Start free trial",
    featured: false,
  },
  {
    name: "Business",
    price: "$1,900",
    period: "/mo",
    desc: "For in-house departments running end-to-end legal operations.",
    features: ["Unlimited contracts", "Approvals & workflows", "Playbooks & fallbacks", "Renewals & analytics", "SSO + priority support"],
    cta: "Request access",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For regulated enterprises with security & scale requirements.",
    features: ["Knowledge Graph & Ask AI", "Dedicated environment", "Custom integrations", "SOC 2 & data residency", "Named success manager"],
    cta: "Talk to sales",
    featured: false,
  },
];

export default function Pricing() {
  const go = () => document.querySelector("#waitlist")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section id="pricing" className="py-24 lg:py-36" data-testid="pricing-section">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <Overline>Pricing</Overline>
          <h2 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight text-ink max-w-3xl">
            Priced for the value of the hours you get back.
          </h2>
        </Reveal>

        <div className="mt-14 grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <div
                className={`h-full flex flex-col rounded-3xl p-8 border transition-[transform,box-shadow] duration-300 ${
                  p.featured
                    ? "bg-ink text-bone border-ink shadow-[0_40px_100px_-40px_rgba(10,10,10,0.55)] md:-translate-y-4"
                    : "bg-white text-ink border-ink/10 hover:-translate-y-1 hover:shadow-lg"
                }`}
                data-testid={`pricing-${p.name.toLowerCase()}-card`}
              >
                {p.featured && (
                  <span className="self-start rounded-full bg-signal text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 mb-5">
                    Most popular
                  </span>
                )}
                <h3 className="font-serif text-2xl">{p.name}</h3>
                <p className={`mt-2 text-sm ${p.featured ? "text-bone/60" : "text-ink/55"}`}>{p.desc}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="font-serif text-5xl">{p.price}</span>
                  <span className={`mb-1.5 text-sm ${p.featured ? "text-bone/50" : "text-ink/50"}`}>{p.period}</span>
                </div>
                <ul className="mt-7 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? "text-signal" : "text-signal"}`} />
                      <span className={p.featured ? "text-bone/85" : "text-ink/75"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={go}
                  className={`mt-8 group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-colors duration-300 ${
                    p.featured
                      ? "bg-bone text-ink hover:bg-signal hover:text-white"
                      : "bg-ink text-bone hover:bg-signal"
                  }`}
                  data-testid={`pricing-${p.name.toLowerCase()}-cta`}
                >
                  {p.cta}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
