import { PhoenixLogo } from "./PhoenixLogo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background/80 py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-3">
            <div className="opacity-60">
              <PhoenixLogo size={28} glowIntensity="low" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground tracking-wide">Synaptica <span className="font-normal text-muted-foreground">Knowledge Systems</span></h4>
              <p className="text-xs text-muted-foreground">Designing the intelligence layer of the modern organization</p>
            </div>
          </div>

          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="https://mirunacristiana-paun-ai-portfolio.replit.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Portfolio</a>
            <a href="https://github.com/Miru-Maria" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
            <a href="https://www.linkedin.com/in/miruna-c-paun-97286471/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">LinkedIn</a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/60">
          <p>© 2026 Miruna Paun · Synaptica Knowledge Systems · All rights reserved</p>
          <div className="flex items-center gap-4">
            <a href="/legal#terms" className="hover:text-primary transition-colors">Terms</a>
            <a href="/legal#privacy" className="hover:text-primary transition-colors">Privacy</a>
            <a href="/legal#refund" className="hover:text-primary transition-colors">Refunds</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
