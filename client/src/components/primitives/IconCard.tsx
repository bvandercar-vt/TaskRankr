/**
 * @fileoverview Card with a circular icon/number and title + description.
 */

import { Card, CardContent } from "@/components/primitives/Card";
import { cn } from "@/lib/utils";

export const IconCard = ({
  icon,
  title,
  description,
  testId,
  small,
  className,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  testId: string;
  small?: boolean;
  className?: string;
}) => (
  <Card
    className={cn("bg-card/50 border-white/10", className)}
    data-testid={testId}
  >
    <CardContent className="p-4 flex items-start gap-4">
      <div
        className={cn(
          "shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary",
          small ? "w-8 h-8 text-sm font-bold" : "w-10 h-10",
        )}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);
