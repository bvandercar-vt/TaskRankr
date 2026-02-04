import { useGuestMode } from '@/components/GuestProvider'
import { useLocalState } from '@/components/LocalStateProvider'

export const useGuestModeState = () => {
  const guest = useGuestMode()
  const local = useLocalState()

  return {
    ...guest,
    hasDemoData: local.hasDemoData,
    deleteDemoData: local.deleteDemoData,
  }
}
