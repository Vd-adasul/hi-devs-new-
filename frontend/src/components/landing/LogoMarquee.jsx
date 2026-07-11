import Marquee from "react-fast-marquee";

const LOGOS = [
  "Meridian Legal", "Halston & Crane", "Northwind Corp", "Vertex Counsel",
  "Bishop & Rowe", "Alaric Group", "Sterling Ops", "Kingsley Partners",
];

export default function LogoMarquee() {
  return (
    <section className="py-14 border-y border-ink/10 bg-white/50" data-testid="trusted-by">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-ink/40 mb-8">
        Trusted by legal & compliance teams at scale
      </p>
      <Marquee gradient gradientColor="#FDFDFC" gradientWidth={120} speed={38} pauseOnHover>
        {LOGOS.map((l) => (
          <span
            key={l}
            className="mx-10 font-serif text-2xl md:text-3xl text-ink/30 hover:text-ink/60 transition-colors duration-300 whitespace-nowrap"
          >
            {l}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
