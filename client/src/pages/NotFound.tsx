/**
 * @fileoverview 404 Not Found error page.
 */

import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/primitives/Button";
import { Card, CardContent } from "@/components/primitives/Card";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-muted-foreground">
              404 Page Not Found
            </h1>
          </div>
          <div className="flex justify-center">
            <Link href="/">
              <Button data-testid="link-home">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
