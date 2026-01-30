import { Button } from "@/components/primitives/button";
import { CheckCircle, ListTodo, Clock, Star } from "lucide-react";

const Landing = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <header className="p-6 flex justify-between items-center">
      <h1 className="text-xl font-bold" data-testid="text-logo">TaskRankr</h1>
      <a href="/api/login">
        <Button data-testid="button-login-header">Log In</Button>
      </a>
    </header>

    <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-2xl space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold leading-tight" data-testid="heading-hero">
          Track tasks with clarity
        </h2>
        <p className="text-lg text-muted-foreground" data-testid="text-description">
          Rate priority, ease, enjoyment, and time for each task. Sort by any attribute at a glance.
        </p>
        <a href="/api/login" className="mt-4 inline-block">
          <Button size="lg" className="text-lg px-8" data-testid="button-get-started">
            Get Started
          </Button>
        </a>
      </div>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-muted-foreground" data-testid="features-grid">
        <div className="flex flex-col items-center gap-2" data-testid="feature-priority">
          <Star className="w-6 h-6 text-primary" />
          <span>Priority levels</span>
        </div>
        <div className="flex flex-col items-center gap-2" data-testid="feature-tracking">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
          <span>Easy tracking</span>
        </div>
        <div className="flex flex-col items-center gap-2" data-testid="feature-time">
          <Clock className="w-6 h-6 text-blue-500" />
          <span>Time tracking</span>
        </div>
        <div className="flex flex-col items-center gap-2" data-testid="feature-nested">
          <ListTodo className="w-6 h-6 text-amber-500" />
          <span>Nested tasks</span>
        </div>
      </div>
    </main>

    <footer className="p-6 text-center text-sm text-muted-foreground" data-testid="footer">
      <p data-testid="text-footer-brand">TaskRankr</p>
    </footer>
  </div>
);

export default Landing;
