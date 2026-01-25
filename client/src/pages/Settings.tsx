import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/primitives/button";
import { Switch } from "@/components/primitives/forms/switch";
import { Link } from "wouter";
import { useSettings } from "@/hooks/use-settings";

const Settings = () => {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
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
        </div>
      </main>
    </div>
  );
};

export default Settings;
