import { AuthPaths } from '~/shared/constants'
import type { Task } from '~/shared/schema'

import { ApiPaths } from '../constants'

/**
 * Fetches the current user's tasks, automatically routing to the correct
 * endpoint depending on whether a session cookie is present.
 *
 * - **Logged in** (`connect.sid` cookie exists): calls the real authenticated
 *   endpoint (GET /api/tasks), exercising the full auth middleware stack.
 *   A bug in session validation or the route guard will surface here.
 *
 * - **Guest** (no session cookie): calls the test-only backdoor endpoint
 *   (GET /api/test/tasks), which requires no session. This lets guest-mode
 *   tests query the DB as the test-user identity to assert that locally-created
 *   tasks were NOT persisted to the server. Only reachable when
 *   NODE_ENV !== 'production'.
 */
export const getTasks = () =>
  cy
    .getCookie('connect.sid')
    .then((cookie) =>
      cy
        .request<Task[]>(
          'GET',
          cookie ? ApiPaths.GET_TASKS : AuthPaths.TEST_TASKS,
        )
        .its('body'),
    )
