import { Reveal, Overline } from "./primitives";

const QUOTES = [
  {
    quote:
      "We cut first-pass contract review from days to under an hour. lawOS catches the liability and renewal issues our team used to miss under deadline pressure.",
    name: "Elena Marsh",
    role: "General Counsel, Northwind Corp",
    img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBlcnNvbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MzgwOTQxMnww&ixlib=rb-4.1.0&q=85",
  },
  {
    quote:
      "The obligation and renewal tracking alone paid for itself in the first quarter. Nothing lapses silently anymore — the whole team trusts the system of record.",
    name: "David Okafor",
    role: "VP Legal Operations, Vertex Counsel",
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBlcnNvbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MzgwOTQxMnww&ixlib=rb-4.1.0&q=85",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 lg:py-36 bg-white border-y border-ink/10" data-testid="testimonials-section">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <Overline>In their words</Overline>
          <h2 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight text-ink max-w-3xl">
            Legal leaders who stopped fighting their contracts.
          </h2>
        </Reveal>
        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {QUOTES.map((q, i) => (
            <Reveal key={q.name} delay={i * 0.1}>
              <figure className="h-full rounded-2xl border border-ink/10 bg-bone/40 p-8 lg:p-10 flex flex-col">
                <blockquote className="font-serif text-2xl lg:text-3xl leading-snug text-ink text-balance">
                  “{q.quote}”
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  <img src={q.img} alt={q.name} className="h-12 w-12 rounded-full object-cover grayscale" />
                  <div>
                    <div className="font-semibold text-ink">{q.name}</div>
                    <div className="text-sm text-ink/55">{q.role}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
