import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/primitives/overlays/toaster";
import { TooltipProvider } from "@/components/primitives/overlays/tooltip";
import { TaskDialogProvider } from "@/components/TaskDialogProvider";
import Home from "@/pages/Home";
import Completed from "@/pages/Completed";
import NotFound from "@/pages/not-found";

const Router = () => (
  <Switch>
    <Route path="/" component={Home} />
    <Route path="/completed" component={Completed} />
    <Route component={NotFound} />
  </Switch>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TaskDialogProvider>
        <Toaster />
        <Router />
      </TaskDialogProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
