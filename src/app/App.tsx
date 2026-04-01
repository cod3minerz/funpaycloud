import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { PainPoints } from "./components/PainPoints";
import { Features } from "./components/Features";
import { WhyUs } from "./components/WhyUs";
import { UseCases } from "./components/UseCases";
import { HowItWorks } from "./components/HowItWorks";
import { Testimonials } from "./components/Testimonials";
import { Pricing } from "./components/Pricing";
import { FAQ } from "./components/FAQ";
import { CTASection } from "./components/CTASection";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="dark min-h-screen bg-[#030712] text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1200px 700px at 50% -10%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(900px 500px at 80% 20%, rgba(29,78,216,0.10), transparent 60%)",
        }}
      />
      <div
        className="fixed inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <PainPoints />
          <Features />
          <WhyUs />
          <UseCases />
          <HowItWorks />
          <Testimonials />
          <Pricing />
          <FAQ />
          <CTASection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
