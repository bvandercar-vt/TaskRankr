import { useCallback, useState } from 'react'

export const useRethrow = () => {
  const [, setState] = useState()
  return useCallback(
    (error: unknown) => {
      setState(() => {
        throw error
      })
    },
    [setState],
  )
}
