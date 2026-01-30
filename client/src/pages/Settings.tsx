import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/primitives/button";
import { Switch } from "@/components/primitives/forms/switch";
import { Link } from "wouter";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";

const Settings = () => {
  const { settings, updateSetting } = useSettings();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold" data-testid="heading-settings">Settings</h1>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-white/10">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Automatically Pin new tasks</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, new tasks will be pinned to the top of your list automatically.
              </p>
            </div>
            <Switch
              checked={settings.autoPinNewTasks}
              onCheckedChange={(checked: boolean) => updateSetting("autoPinNewTasks", checked)}
              data-testid="switch-auto-pin"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-white/10">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Enable In Progress Time</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track and display time spent working on tasks.
              </p>
            </div>
            <Switch
              checked={settings.enableInProgressTime}
              onCheckedChange={(checked: boolean) => updateSetting("enableInProgressTime", checked)}
              data-testid="switch-enable-time"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-white/10">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Always sort pinned by Priority</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pinned tasks are always sorted by priority first, then by your selected sort.
              </p>
            </div>
            <Switch
              checked={settings.alwaysSortPinnedByPriority}
              onCheckedChange={(checked: boolean) => updateSetting("alwaysSortPinnedByPriority", checked)}
              data-testid="switch-sort-pinned-priority"
            />
          </div>
        </div>

        <div className="mt-8 p-4 bg-card rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground" data-testid="text-user-name">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                {user?.email}
              </p>
            </div>
            <a href="/api/logout">
              <Button variant="outline" className="gap-2" data-testid="button-logout">
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </a>
          </div>
        </div>

        <div className="mt-16 text-center text-muted-foreground">
          <p className="text-sm font-medium" data-testid="text-app-name">TaskVana</p>
          <p className="text-xs mt-1" data-testid="text-app-description">
            Track tasks with priority, ease, enjoyment, and time ratings.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Settings;
