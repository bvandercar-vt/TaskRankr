import { useRef, useState } from "react";
import { ArrowLeft, LogOut, Download, Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/primitives/button";
import { Switch } from "@/components/primitives/forms/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { useSettings, type AppSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/use-tasks";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getPriorityStyle, getEaseStyle, getEnjoymentStyle, getTimeStyle } from "@/lib/taskStyles";
import { cn } from "@/lib/utils";

type AttributeKey = "priority" | "ease" | "enjoyment" | "time";
const ATTRIBUTES: { key: AttributeKey; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "ease", label: "Ease" },
  { key: "enjoyment", label: "Enjoyment" },
  { key: "time", label: "Time" },
];

const Settings = () => {
  const { settings, updateSetting } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: tasks } = useTasks();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [sortInfoExpanded, setSortInfoExpanded] = useState(false);
  const hasNoTasks = !tasks || tasks.length === 0;

  const handleExport = () => {
    window.location.href = '/api/tasks/export';
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      await apiRequest('POST', '/api/tasks/import', { tasks: data.tasks || data });
      
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Tasks imported successfully" });
    } catch (err) {
      toast({ title: "Failed to import tasks", variant: "destructive" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
          <h3 className="font-semibold text-foreground mb-4">Attribute Settings</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Control which attributes appear in forms and task cards.
          </p>
          <table className="w-full" data-testid="table-attribute-settings">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 font-medium text-sm text-muted-foreground">Attribute</th>
                <th className="text-center py-2 font-medium text-sm text-muted-foreground">Visible</th>
                <th className="text-center py-2 font-medium text-sm text-muted-foreground">Required</th>
              </tr>
            </thead>
            <tbody>
              {ATTRIBUTES.map(({ key, label }) => {
                const visibleKey = `${key}Visible` as keyof AppSettings;
                const requiredKey = `${key}Required` as keyof AppSettings;
                const isVisible = settings[visibleKey] as boolean;
                const isRequired = settings[requiredKey] as boolean;
                
                return (
                  <tr key={key} className="border-b border-white/5">
                    <td className="py-3 text-foreground">{label}</td>
                    <td className="py-3 text-center">
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={(checked: boolean | "indeterminate") => {
                          const newVisible = !!checked;
                          updateSetting(visibleKey as any, newVisible);
                          if (!newVisible && isRequired) {
                            updateSetting(requiredKey as any, false);
                          }
                        }}
                        data-testid={`checkbox-${key}-visible`}
                      />
                    </td>
                    <td className="py-3 text-center">
                      <Checkbox
                        checked={isRequired}
                        onCheckedChange={(checked: boolean | "indeterminate") => updateSetting(requiredKey as any, !!checked)}
                        disabled={!isVisible}
                        className={!isVisible ? "opacity-50" : ""}
                        data-testid={`checkbox-${key}-required`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-4 bg-card rounded-lg border border-white/10">
          <button
            onClick={() => setSortInfoExpanded(!sortInfoExpanded)}
            className="w-full flex items-center justify-center gap-2 cursor-pointer"
            data-testid="button-sort-info-toggle"
          >
            <h3 className="font-semibold text-foreground">Sort Info</h3>
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                sortInfoExpanded && "rotate-180"
              )} 
            />
          </button>
          {sortInfoExpanded && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-3 text-center">
                When tasks have the same value, they are sorted by secondary attributes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-secondary/20 rounded-md sm:col-span-2">
                  <p className="font-medium text-foreground mb-1">Date</p>
                  <ol className="text-xs list-decimal list-inside">
                    <li className="text-muted-foreground">Date created (newest first)</li>
                  </ol>
                </div>
                <div className="p-3 bg-secondary/20 rounded-md">
                  <p className="font-medium text-foreground mb-1">Priority</p>
                  <ol className="text-xs list-decimal list-inside space-y-0.5">
                    <li className="text-muted-foreground">Priority (<span className={cn("font-medium", getPriorityStyle("highest"))}>highest</span> first)</li>
                    <li className="text-muted-foreground">Ease (<span className={cn("font-medium", getEaseStyle("easiest"))}>easiest</span> first)</li>
                    <li className="text-muted-foreground">Enjoyment (<span className={cn("font-medium", getEnjoymentStyle("highest"))}>highest</span> first)</li>
                  </ol>
                </div>
                <div className="p-3 bg-secondary/20 rounded-md">
                  <p className="font-medium text-foreground mb-1">Ease</p>
                  <ol className="text-xs list-decimal list-inside space-y-0.5">
                    <li className="text-muted-foreground">Ease (<span className={cn("font-medium", getEaseStyle("easiest"))}>easiest</span> first)</li>
                    <li className="text-muted-foreground">Priority (<span className={cn("font-medium", getPriorityStyle("highest"))}>highest</span> first)</li>
                    <li className="text-muted-foreground">Enjoyment (<span className={cn("font-medium", getEnjoymentStyle("highest"))}>highest</span> first)</li>
                  </ol>
                </div>
                <div className="p-3 bg-secondary/20 rounded-md">
                  <p className="font-medium text-foreground mb-1">Enjoyment</p>
                  <ol className="text-xs list-decimal list-inside space-y-0.5">
                    <li className="text-muted-foreground">Enjoyment (<span className={cn("font-medium", getEnjoymentStyle("highest"))}>highest</span> first)</li>
                    <li className="text-muted-foreground">Priority (<span className={cn("font-medium", getPriorityStyle("highest"))}>highest</span> first)</li>
                    <li className="text-muted-foreground">Ease (<span className={cn("font-medium", getEaseStyle("easiest"))}>easiest</span> first)</li>
                  </ol>
                </div>
                <div className="p-3 bg-secondary/20 rounded-md">
                  <p className="font-medium text-foreground mb-1">Time</p>
                  <ol className="text-xs list-decimal list-inside space-y-0.5">
                    <li className="text-muted-foreground">Time (<span className={cn("font-medium", getTimeStyle("lowest"))}>lowest</span> first)</li>
                    <li className="text-muted-foreground">Priority (<span className={cn("font-medium", getPriorityStyle("highest"))}>highest</span> first)</li>
                    <li className="text-muted-foreground">Ease (<span className={cn("font-medium", getEaseStyle("easiest"))}>easiest</span> first)</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-card rounded-lg border border-white/10">
          <h3 className="font-semibold text-foreground mb-3 text-center">Data</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleExport}
              disabled={hasNoTasks}
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
              Export Tasks
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleImportClick}
              disabled={isImporting}
              data-testid="button-import"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? "Importing..." : "Import Tasks"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-import-file"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Export your tasks as JSON or import from a previously exported file.
          </p>
        </div>

        <div className="mt-4 p-4 bg-card rounded-lg border border-white/10">
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
          <p className="text-sm font-medium" data-testid="text-app-name">TaskRankr</p>
          <p className="text-xs mt-1" data-testid="text-app-description">
            Track tasks with priority, ease, enjoyment, and time ratings.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Settings;
