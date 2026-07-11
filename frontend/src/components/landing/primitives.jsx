import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { cn } from "@/lib/utils";

// Section-level scroll reveal wrapper
export const Reveal = ({ children, delay = 0, y = 28, className = "", once = true }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once, margin: "-80px" }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

// Masked line-by-line hero reveal
export const MaskLine = ({ children, delay = 0, className = "" }) => (
  <span className="block overflow-hidden">
    <motion.span
      className={cn("block", className)}
      initial={{ y: "110%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.span>
  </span>
);

export const Overline = ({ children, className = "" }) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 text-xs md:text-sm font-sans uppercase tracking-[0.24em] text-signal font-semibold",
      className
    )}
  >
    <span className="h-px w-6 bg-signal/60" />
    {children}
  </span>
);

export const CountUp = ({ to, suffix = "", prefix = "", decimals = 0, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, to, decimals, mv]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};
