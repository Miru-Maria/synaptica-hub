import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { PhoenixLogo } from "./PhoenixLogo";

export function Navbar() {
  const [, navigate] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinks: { name: string; id: string; href?: string }[] = [
    { name: "About", id: "about" },
    { name: "Services & Lab", id: "services" },
    { name: "Learning OS", id: "learning-os", href: "/learning-os" },
    { name: "Packages", id: "packages" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled ? "bg-background border-white/10 py-3" : "bg-background border-white/5 py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <button 
          className="flex items-center gap-3 cursor-pointer group min-h-[44px]"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <PhoenixLogo size={22} glowIntensity="medium" />
          </div>
          <span className="font-semibold tracking-wide text-sm md:text-base hidden sm:block">
            Synaptica <span className="text-muted-foreground font-normal">Knowledge Systems</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => {
                setMobileMenuOpen(false);
                if (link.href) {
                  navigate(link.href);
                } else {
                  scrollTo(link.id);
                }
              }}
              className="nav-link text-sm font-medium"
            >
              {link.name}
            </button>
          ))}
          <Link href="/blog">
            <span className="nav-link text-sm font-medium cursor-pointer">Blog</span>
          </Link>
          <button
            onClick={() => { setMobileMenuOpen(false); navigate("/work-with-me"); }}
            className="btn-primary py-2 px-5 text-sm"
          >
            Work With Me
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="flex flex-col px-4 py-6 gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (link.href) {
                      navigate(link.href);
                    } else {
                      scrollTo(link.id);
                    }
                  }}
                  className="text-left text-lg font-medium text-foreground min-h-[44px] py-3 border-b border-white/5"
                >
                  {link.name}
                </button>
              ))}
              <Link href="/blog">
                <span
                  className="block text-left text-lg font-medium text-foreground py-2 border-b border-white/5 cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blog
                </span>
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/work-with-me"); }}
                className="btn-primary mt-4 min-h-[44px] py-3"
              >
                Work With Me
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
