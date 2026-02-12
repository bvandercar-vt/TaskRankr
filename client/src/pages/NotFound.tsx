/**
 * @fileoverview 404 Not Found error page.
 */

import { AlertCircle, Home } from 'lucide-react'
import { Link, useLocation } from 'wouter'

import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { Card, CardContent } from '@/components/primitives/Card'

export default function NotFound() {
  const [location] = useLocation()

  return (
    <div className="min-h-screen w-full flex items-start justify-center pt-[20vh] bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-3 justify-center">
            <AlertCircle className="size-8 text-red-500" />
            <h1 className="text-2xl font-bold text-muted-foreground">
              404 Page Not Found
            </h1>
          </div>
          <p
            className="text-center text-sm text-muted-foreground mb-4"
            data-testid="text-not-found-path"
          >
            <Badge variant="secondary">{location}</Badge>
          </p>
          <div className="flex justify-center">
            <Link href="/">
              <Button data-testid="link-home">
                <Home className="size-4" />
                Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
