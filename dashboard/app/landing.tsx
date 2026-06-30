import ArchitectureDiagram from "./components/landing/ArchitectureDiagram";
import CtaSection from "./components/landing/CtaSection";
import Hero from "./components/landing/Hero";
import HowItWorks from "./components/landing/HowItWorks";
import Nav from "./components/landing/Nav";
import ProblemSection from "./components/landing/ProblemSection";
import StorySection from "./components/landing/StorySection";

export default function Landing() {
  return (
    <div className="overflow-x-hidden bg-bg text-text">
      <Nav />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <StorySection />
      <ArchitectureDiagram />
      <CtaSection />
    </div>
  );
}
