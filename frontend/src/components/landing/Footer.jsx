import { Scale, ArrowUpRight } from "lucide-react";

const COLS = [
  { title: "Platform", links: ["Contract Intelligence", "AI Review", "Risk Detection", "Approvals", "Analytics"] },
  { title: "Company", links: ["About", "Customers", "Careers", "Security", "Contact"] },
  { title: "Resources", links: ["Documentation", "Playbook library", "Changelog", "Status", "Privacy"] },
];

export default function Footer() {
  const go = () => document.querySelector("#waitlist")?.scrollIntoView({ behavior: "smooth" });
  return (
    <footer className="bg-obsidian text-white" data-testid="footer">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-24 pb-12">
        <button onClick={go} className="group block text-left w-full" data-testid="footer-cta">
          <span className="font-serif text-[16vw] lg:text-[11vw] leading-[0.85] tracking-tighter inline-flex items-start">
            Let&apos;s talk
            <ArrowUpRight className="h-[6vw] w-[6vw] mt-2 text-signal group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-300" />
          </span>
        </button>

        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-10 border-t border-white/10 pt-14">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center h-9 w-9 rounded-full bg-white text-obsidian">
                <Scale className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="font-serif text-2xl">lawOS</span>
            </div>
            <p className="mt-4 text-sm text-white/50 max-w-xs leading-relaxed">
              Enterprise contract intelligence for modern legal operations.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">{c.title}</h4>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <button className="text-sm text-white/70 hover:text-white transition-colors duration-200">{l}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/40">
          <span>© {new Date().getFullYear()} lawOS. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> SOC 2 aligned · GDPR ready
          </span>
        </div>
      </div>
    </footer>
  );
}
