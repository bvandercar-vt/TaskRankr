import { AuthPaths } from '~/shared/constants'
import type { Task } from '~/shared/schema'

import { ApiPaths } from '../constants'

/**
 * Fetches the current user's tasks from the real, authenticated API endpoint
 * (GET /api/tasks). Because Cypress automatically replays the session cookie
 * set by cy.loginAsTestUser(), this exercises the full auth middleware stack —
 * a bug in session validation or the route guard would surface here.
 *
 * Use this helper in logged-in tests only.
 */
export const getTasks = () =>
  cy.request<Task[]>('GET', ApiPaths.GET_TASKS).its('body')

/**
 * Fetches the test user's tasks via the test-only backdoor endpoint
 * (GET /api/test/tasks), which requires no session cookie.
 *
 * WHY THIS EXISTS
 * ---------------
 * Guest-mode tests deliberately do not log in. After a guest creates a task
 * in the UI, we want to assert that nothing was written to the server's
 * database. We cannot call the real GET /api/tasks for that check because it
 * requires authentication. This endpoint lets us query the DB as the test-user
 * identity from an unauthenticated context, so we can assert the expected
 * absence of data.
 *
 * Use this helper in guest-mode tests only. It is only reachable when
 * NODE_ENV !== 'production'.
 */
export const getTestUserTasks = () =>
  cy.request<Task[]>('GET', AuthPaths.TEST_TASKS).its('body')
