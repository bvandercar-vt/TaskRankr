/**
 * @fileoverview ts-rest client configuration and query key definitions
 * 
 * Initializes the ts-rest React Query client for type-safe API communication.
 * Exports the tsr client instance, request body type helper, and centralized
 * QueryKeys object for consistent cache key management across the application.
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
