import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { ServicesAndTools } from "@/components/ServicesAndTools";
import { ServicePackages } from "@/components/ServicePackages";
import { LearningOS } from "@/components/LearningOS";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { CurrencyProvider } from "@/context/currency";

export default function Home() {
  return (
    <CurrencyProvider>
      <div className="bg-background min-h-screen text-foreground selection:bg-primary/30 selection:text-white">
        <Navbar />

        <main>
          <Hero />
          <About />
          <ServicesAndTools />
          <ServicePackages />
          <LearningOS />
          <Contact />
        </main>

        <Footer />
      </div>
    </CurrencyProvider>
  );
}
