/**
 * @fileoverview @ts-rest client configuration and QueryKey definitions
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
