import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/Home";
import LearningOSPage from "@/pages/LearningOS";
import Legal from "@/pages/Legal";
import DocAudit from "@/pages/DocAudit";
import WorkWithMe from "@/pages/WorkWithMe";
import Results from "@/pages/Results";
import Blog from "@/pages/Blog";
import BlogArticle from "@/pages/BlogArticle";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import KASprint from "@/pages/admin/KASprint";
import RAGPipeline from "@/pages/admin/RAGPipeline";
import RAGGuide from "@/pages/admin/RAGGuide";
import PromptWorkshop from "@/pages/admin/PromptWorkshop";
import MonthlyRetainer from "@/pages/admin/MonthlyRetainer";
import UXTester from "@/pages/admin/UXTester";
import ToolTester from "@/pages/admin/ToolTester";
import DocScopePage from "@/pages/admin/DocScope";
import DocForgePage from "@/pages/admin/DocForge";
import SEOScopePage from "@/pages/admin/SEOScope";
import DiffLensPage from "@/pages/admin/DiffLensAdmin";
import KnowledgeArchPage from "@/pages/admin/KnowledgeArch";
import ChatWidget from "@/components/ChatWidget";

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function ExternalRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);
  return null;
}

function Router() {
  return (
    <>
    <ScrollToTop />
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/learning-os" component={LearningOSPage} />
      <Route path="/legal" component={Legal} />
      <Route path="/terms" component={Legal} />
      <Route path="/privacy" component={Legal} />
      <Route path="/refund" component={Legal} />
      <Route path="/work-with-me" component={WorkWithMe} />
      <Route path="/results" component={Results} />
      <Route path="/blog/:slug" component={BlogArticle} />
      <Route path="/blog" component={Blog} />
      <Route path="/docaudit" component={DocAudit} />
      <Route path="/synaptica-ka">
        <ExternalRedirect url="https://synaptica-knowledge-architecture-mcp.replit.app/search" />
      </Route>
      <Route path="/docforge">
        <ExternalRedirect url="https://docforge-pdf.replit.app/" />
      </Route>
      <Route path="/difflens">
        <ExternalRedirect url="https://diff-lens.replit.app/" />
      </Route>
      <Route path="/docscope">
        <ExternalRedirect url="https://intel-engine-scope.replit.app/" />
      </Route>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/ka-sprint" component={KASprint} />
      <Route path="/admin/rag-pipeline" component={RAGPipeline} />
      <Route path="/admin/rag-guide" component={RAGGuide} />
      <Route path="/admin/prompt-workshop" component={PromptWorkshop} />
      <Route path="/admin/monthly-retainer" component={MonthlyRetainer} />
      <Route path="/admin/ux-tester" component={UXTester} />
      <Route path="/admin/tool-tester" component={ToolTester} />
      <Route path="/admin/docscope" component={DocScopePage} />
      <Route path="/admin/docforge" component={DocForgePage} />
      <Route path="/admin/seoscope" component={SEOScopePage} />
      <Route path="/admin/difflens" component={DiffLensPage} />
      <Route path="/admin/knowledge-arch" component={KnowledgeArchPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={base}>
        <Router />
        <ChatWidget />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
