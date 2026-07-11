import { motion } from "framer-motion";
import { FileText, ScanLine, Boxes, Database, Share2, Bot, Sparkles, ShieldCheck, MessageSquareQuote } from "lucide-react";
import { Overline } from "./primitives";

const NODES = [
  { icon: FileText, label: "PDF", sub: "Source contract" },
  { icon: ScanLine, label: "Extraction", sub: "OCR + layout parse" },
  { icon: Boxes, label: "Embeddings", sub: "Vector encoding" },
  { icon: Database, label: "Qdrant", sub: "Vector store" },
  { icon: Share2, label: "Knowledge Graph", sub: "Entity relations", upcoming: true },
  { icon: Bot, label: "Mastra Agents", sub: "Orchestration" },
  { icon: Sparkles, label: "Gemini", sub: "Reasoning model" },
  { icon: ShieldCheck, label: "Enkrypt AI", sub: "Guardrails & safety" },
  { icon: MessageSquareQuote, label: "Answer", sub: "Cited response" },
];

export default function Architecture() {
  return (
    <section id="architecture" className="relative py-24 lg:py-36 bg-obsidian text-white overflow-hidden" data-testid="architecture-section">
      <div className="absolute inset-0 grid-lines-dark opacity-70" />
      <img
        src="https://images.unsplash.com/photo-1644088379091-d574269d422f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhdGElMjBjb25uZWN0aW9uJTIwbmV0d29ya3xlbnwwfHx8fDE3ODM4MDk0MTJ8MA&ixlib=rb-4.1.0&q=85"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.10]"
      />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <Overline className="text-signal">Under the hood</Overline>
          <h2 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            A grounded AI engine built for legal-grade trust.
          </h2>
          <p className="mt-5 text-lg text-white/60 leading-relaxed">
            Every answer is retrieval-grounded and safety-checked. No hallucinated clauses — just
            traceable reasoning over your own documents.
          </p>
        </div>

        {/* Pipeline */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {NODES.map((n, i) => (
            <div key={n.label} className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-md p-5 hover:bg-white/[0.1] transition-colors duration-300"
                data-testid={`arch-node-${n.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <div className="flex items-center justify-between">
                  <span className="grid place-items-center h-10 w-10 rounded-xl bg-signal/20 text-signal">
                    <n.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="font-mono text-xs text-white/30">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <p className="font-serif text-xl">{n.label}</p>
                  {n.upcoming && (
                    <span className="rounded-full border border-signal/40 text-signal text-[9px] font-bold uppercase px-2 py-0.5">Soon</span>
                  )}
                </div>
                <p className="text-sm text-white/50">{n.sub}</p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Self-drawing flow line */}
        <div className="mt-14">
          <svg viewBox="0 0 1200 40" className="w-full h-10" fill="none" preserveAspectRatio="none">
            <motion.path
              d="M0 20 H1200"
              stroke="#2563EB"
              strokeWidth="2"
              strokeDasharray="2 8"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>
          <p className="text-center text-sm text-white/40">
            Retrieval-augmented · guardrailed · fully auditable
          </p>
        </div>
      </div>
    </section>
  );
}
