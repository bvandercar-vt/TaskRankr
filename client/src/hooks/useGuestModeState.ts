/**
 * @fileoverview Hook to access common guest mode state and actions.
 */

import { useGuestMode } from '@/components/providers/GuestModeProvider'
import { useLocalState } from '@/components/providers/LocalStateProvider'

export const useGuestModeState = () => {
  const guest = useGuestMode()
  const local = useLocalState()

  return {
    ...guest,
    hasDemoData: local.hasDemoData,
    deleteDemoData: local.deleteDemoData,
  }
}
