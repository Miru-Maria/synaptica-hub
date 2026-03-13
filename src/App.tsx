import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/Home";
import Legal from "@/pages/Legal";
import DocAudit from "@/pages/DocAudit";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import KASprint from "@/pages/admin/KASprint";
import RAGPipeline from "@/pages/admin/RAGPipeline";
import PromptWorkshop from "@/pages/admin/PromptWorkshop";

const queryClient = new QueryClient();

function ExternalRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/legal" component={Legal} />
      <Route path="/terms" component={Legal} />
      <Route path="/privacy" component={Legal} />
      <Route path="/refund" component={Legal} />
      <Route path="/docaudit" component={DocAudit} />
      <Route path="/synaptica-ka">
        <ExternalRedirect url="https://synaptica-knowledge-architecture-mcp.replit.app/search" />
      </Route>
      <Route path="/docforge">
        <ExternalRedirect url="https://docforge-pdf.replit.app/" />
      </Route>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/ka-sprint" component={KASprint} />
      <Route path="/admin/rag-pipeline" component={RAGPipeline} />
      <Route path="/admin/prompt-workshop" component={PromptWorkshop} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={base}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
