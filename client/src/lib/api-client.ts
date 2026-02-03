import { initClient } from '@ts-rest/core'
import { initTsrReactQuery } from '@ts-rest/react-query/v5'

import { contract } from '~/shared/contract'

export const api = initClient(contract, {
  baseUrl: '',
  baseHeaders: {},
  credentials: 'include',
})

export const tsr = initTsrReactQuery(contract, {
  baseUrl: '',
  baseHeaders: {},
  credentials: 'include',
})
