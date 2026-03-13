import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/Home";
import Legal from "@/pages/Legal";
import DocAudit from "@/pages/DocAudit";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/legal" component={Legal} />
      <Route path="/terms" component={Legal} />
      <Route path="/privacy" component={Legal} />
      <Route path="/refund" component={Legal} />
      <Route path="/docaudit" component={DocAudit} />
      <Route path="/admin/login" component={AdminLogin} />
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
