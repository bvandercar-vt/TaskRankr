import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/primitives/overlays/toaster";
import { TooltipProvider } from "@/components/primitives/overlays/tooltip";
import { TaskDialogProvider } from "@/components/TaskDialogProvider";
import { useAuth } from "@/hooks/use-auth";
import Home from "@/pages/Home";
import Completed from "@/pages/Completed";
import Settings from "@/pages/Settings";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

const Router = () => (
  <Switch>
    <Route path="/" component={Home} />
    <Route path="/completed" component={Completed} />
    <Route path="/settings" component={Settings} />
    <Route component={NotFound} />
  </Switch>
);

const AuthenticatedApp = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <TaskDialogProvider>
      <Router />
    </TaskDialogProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthenticatedApp />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
