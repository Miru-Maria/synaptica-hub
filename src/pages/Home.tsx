import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { ServicesAndTools } from "@/components/ServicesAndTools";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="bg-background min-h-screen text-foreground selection:bg-primary/30 selection:text-white">
      <Navbar />
      
      <main>
        <Hero />
        <About />
        <ServicesAndTools />
        <Contact />
      </main>
      
      <Footer />
    </div>
  );
}
