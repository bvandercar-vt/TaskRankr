/**
 * @fileoverview Replit OpenID Connect authentication implementation.
 *
 * Configures Passport.js with OIDC strategy for Replit authentication.
 * Handles session management, token refresh, and user upsert on login.
 */

/** biome-ignore-all lint/style/noNonNullAssertion: added by Replit */
/** biome-ignore-all lint/complexity/useLiteralKeys: added by Replit */
/** biome-ignore-all lint/suspicious/noExplicitAny: added by Replit */
import connectPg from 'connect-pg-simple'
import type { Express, RequestHandler } from 'express'
import session from 'express-session'
import memoize from 'memoizee'
import * as client from 'openid-client'
import { Strategy, type VerifyFunction } from 'openid-client/passport'
import passport from 'passport'

import { authPaths } from '~/shared/routes'
import { authStorage } from './storage'

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
      process.env.REPL_ID!,
    )
  },
  { maxAge: 3600 * 1000 },
)

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000 // 1 week
  const pgStore = connectPg(session)
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: 'sessions',
  })
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  })
}

export type UserSession = {
  claims?: client.IDToken
  expires_at?: number
  refresh_token?: string
  access_token?: string
}

function updateUserSession(
  user: UserSession,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
) {
  user.claims = tokens.claims()
  user.access_token = tokens.access_token
  user.refresh_token = tokens.refresh_token
  user.expires_at = user.claims?.exp
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims['sub'],
    email: claims['email'],
    firstName: claims['first_name'],
    lastName: claims['last_name'],
    profileImageUrl: claims['profile_image_url'],
  })
}

export async function setupAuth(app: Express) {
  app.set('trust proxy', 1)
  app.use(getSession())
  app.use(passport.initialize())
  app.use(passport.session())

  const config = await getOidcConfig()

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback,
  ) => {
    const user = {}
    updateUserSession(user, tokens)
    await upsertUser(tokens.claims())
    verified(null, user)
  }

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>()

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: 'openid email profile offline_access',
          callbackURL: `https://${domain}${authPaths.callback}`,
        },
        verify,
      )
      passport.use(strategy)
      registeredStrategies.add(strategyName)
    }
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user))
  passport.deserializeUser((user: Express.User, cb) => cb(null, user))

  app.get(authPaths.login, (req, res, next) => {
    ensureStrategy(req.hostname)
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: 'login consent',
      scope: ['openid', 'email', 'profile', 'offline_access'],
    })(req, res, next)
  })

  app.get(authPaths.callback, (req, res, next) => {
    ensureStrategy(req.hostname)
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: '/',
      failureRedirect: authPaths.login,
    })(req, res, next)
  })

  app.get(authPaths.logout, (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href,
      )
    })
  })
}

export const isAuthenticated: RequestHandler<
  Record<string, string | number>
> = async (req, res, next) => {
  const user = req.user as UserSession | undefined

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const now = Math.floor(Date.now() / 1000)
  if (now <= user.expires_at) {
    return next()
  }

  const refreshToken = user.refresh_token
  if (!refreshToken) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  try {
    const config = await getOidcConfig()
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken)
    updateUserSession(user, tokenResponse)
    return next()
  } catch (_error) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }
}
