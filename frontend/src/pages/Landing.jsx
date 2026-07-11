import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import LogoMarquee from "@/components/landing/LogoMarquee";
import Manifesto from "@/components/landing/Manifesto";
import Solution from "@/components/landing/Solution";
import ProductDemo from "@/components/landing/ProductDemo";
import Architecture from "@/components/landing/Architecture";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import Waitlist from "@/components/landing/Waitlist";
import Footer from "@/components/landing/Footer";

export default function Landing() {
  return (
    <main className="bg-bone text-ink overflow-x-hidden">
      <Navbar />
      <Hero />
      <LogoMarquee />
      <Manifesto />
      <Solution />
      <ProductDemo />
      <Architecture />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Waitlist />
      <Footer />
    </main>
  );
}
