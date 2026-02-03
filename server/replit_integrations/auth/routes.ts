/** biome-ignore-all lint/style/noNonNullAssertion: added by Replit */
/** biome-ignore-all lint/suspicious/noExplicitAny: added by Replit */
import type { Express } from 'express'

import { authPaths } from '~/shared/routes'
import { isAuthenticated } from './replitAuth'
import { authStorage } from './storage'

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get(authPaths.user, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await authStorage.getUser(userId)
      res.json(user)
    } catch (error) {
      console.error('Error fetching user:', error)
      res.status(500).json({ message: 'Failed to fetch user' })
    }
  })
}
