import { ArrowLeft } from 'lucide-react'
import { Link } from 'wouter'

import { Button } from '@/components/primitives/Button'
import { IconSize, Routes } from '@/lib/constants'

export const BackButton = ({ route = Routes.HOME }: { route?: string }) => (
  <Link href={route}>
    <Button variant="ghost" size="icon" data-testid="button-back">
      <ArrowLeft className={IconSize.HW5} />
    </Button>
  </Link>
)
