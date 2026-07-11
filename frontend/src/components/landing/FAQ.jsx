import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal, Overline } from "./primitives";

const FAQS = [
  { q: "How does lawOS review contracts?", a: "Contracts are parsed, structured and analysed clause-by-clause against your playbook using a retrieval-grounded AI engine. Every finding links back to the exact source text, so nothing is hallucinated." },
  { q: "Is my data secure?", a: "lawOS is built for legal-grade trust: encryption in transit and at rest, guardrailed AI outputs via Enkrypt AI, role-based access and audit logs. Enterprise plans support SSO, SOC 2 alignment and data residency." },
  { q: "Which features are available today?", a: "Contract Intelligence, AI Review, Risk Detection, Approvals, Obligations, Renewals, Playbooks and Analytics are available. Knowledge Graph and Ask AI are on the near-term roadmap and clearly marked as upcoming." },
  { q: "Can it handle our existing contract backlog?", a: "Yes. You can bulk-import historical agreements. lawOS extracts obligations, renewal dates and risk so your entire portfolio becomes searchable and actionable from day one." },
  { q: "How long does implementation take?", a: "Most teams are reviewing live contracts within days. Playbooks can be configured to mirror your existing standards, and our team assists with onboarding on Business and Enterprise plans." },
  { q: "Do you integrate with our stack?", a: "We support common CLM, storage and identity systems, with custom integrations available on Enterprise. Talk to us about your specific tooling." },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24 lg:py-36 bg-white border-y border-ink/10" data-testid="faq-section">
      <div className="mx-auto max-w-4xl px-6 lg:px-10">
        <Reveal>
          <Overline>Questions</Overline>
          <h2 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight text-ink">
            Everything you might ask.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="mt-12" data-testid="faq-accordion">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-ink/10">
                <AccordionTrigger
                  className="py-6 text-left font-serif text-xl md:text-2xl text-ink hover:no-underline hover:text-signal transition-colors"
                  data-testid={`faq-trigger-${i}`}
                >
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-base text-ink/65 leading-relaxed pb-6 max-w-2xl">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
