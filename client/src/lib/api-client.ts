import { initTsrReactQuery } from '@ts-rest/react-query/v5'

import { contract } from '~/shared/contract'

export const tsr = initTsrReactQuery(contract, {
  baseUrl: '',
  baseHeaders: {},
  credentials: 'include',
})
