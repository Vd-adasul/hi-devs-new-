import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Menu, X } from "lucide-react";

const NAV = [
  { label: "Platform", href: "#solution" },
  { label: "How it works", href: "#demo" },
  { label: "Architecture", href: "#architecture" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (href) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="fixed top-0 inset-x-0 z-50"
      data-testid="navbar"
    >
      <div
        className={`transition-colors duration-300 ${
          scrolled ? "bg-bone/80 backdrop-blur-xl border-b border-ink/10" : "bg-transparent"
        }`}
      >
        <nav className="mx-auto max-w-7xl px-6 lg:px-10 h-[72px] flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5"
            data-testid="nav-logo"
          >
            <span className="grid place-items-center h-9 w-9 rounded-full bg-ink text-bone">
              <Scale className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="font-serif text-2xl tracking-tight text-ink">lawOS</span>
          </button>

          <div className="hidden md:flex items-center gap-9">
            {NAV.map((n) => (
              <button
                key={n.href}
                onClick={() => go(n.href)}
                className="text-sm font-medium text-ink/70 hover:text-ink transition-colors duration-200"
                data-testid={`nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {n.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => go("#waitlist")}
              className="text-sm font-semibold text-ink/70 hover:text-ink transition-colors duration-200"
              data-testid="nav-signin"
            >
              Sign in
            </button>
            <button
              onClick={() => go("#waitlist")}
              className="rounded-full bg-ink text-bone text-sm font-semibold px-5 py-2.5 hover:bg-ink/90 transition-colors duration-200"
              data-testid="nav-cta"
            >
              Request access
            </button>
          </div>

          <button
            className="md:hidden text-ink"
            onClick={() => setOpen((o) => !o)}
            data-testid="nav-mobile-toggle"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bone border-b border-ink/10 overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {NAV.map((n) => (
                <button
                  key={n.href}
                  onClick={() => go(n.href)}
                  className="text-left text-lg font-medium text-ink/80"
                >
                  {n.label}
                </button>
              ))}
              <button
                onClick={() => go("#waitlist")}
                className="mt-2 rounded-full bg-ink text-bone text-sm font-semibold px-5 py-3"
              >
                Request access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
