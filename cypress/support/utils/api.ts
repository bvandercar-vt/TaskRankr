import { TestPaths } from '~/shared/constants'
import type { Task } from '~/shared/schema'
import { ApiPaths } from '../constants'

/**
 * Fetches tasks, routing to the correct endpoint based on session state.
 *
 * Logged in (session cookie present) → GET /api/tasks (real auth middleware).
 * Guest (no cookie) → GET /api/test/tasks (unauthenticated backdoor), used to
 * assert that guest-created tasks are not persisted to the server.
 */
export const getTasks = () =>
  cy
    .getCookie('connect.sid')
    .then((cookie) =>
      cy
        .request<Task[]>(
          'GET',
          cookie ? ApiPaths.GET_TASKS : TestPaths.TEST_TASKS,
        )
        .its('body'),
    )
