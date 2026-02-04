/**
 * @fileoverview @ts-rest client configuration and query key definitions
 *
 * Type-safe API client with centralized QueryKeys for cache management.
 */

import type { QueryKey } from '@tanstack/react-query'
import type { AppRouteMutation, ClientInferRequest } from '@ts-rest/core'
import { initTsrReactQuery } from '@ts-rest/react-query/v5'

import { contract } from '~/shared/contract'

export const tsr = initTsrReactQuery(contract, {
  baseUrl: '',
  baseHeaders: {},
  credentials: 'include',
})

export type ClientInferRequestBody<T extends AppRouteMutation> =
  ClientInferRequest<T>['body']

export const QueryKeys = {
  getSettings: ['settings'],
  getTasks: ['tasks'],
} as const satisfies Record<string, QueryKey>
