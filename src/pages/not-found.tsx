import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center">
      <div className="glass p-12 rounded-3xl max-w-md w-full border border-white/10">
        <h1 className="text-6xl font-bold text-primary mb-4 glow-primary">404</h1>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Knowledge Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you are looking for has been moved or does not exist in this architecture.
        </p>
        <Link href="/" className="btn-secondary inline-flex items-center gap-2 w-full justify-center">
          <ArrowLeft className="w-4 h-4" />
          Return to Hub
        </Link>
      </div>
    </div>
  );
}
