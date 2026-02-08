import { ArrowLeft } from 'lucide-react'
import { Link } from 'wouter'

import { Button } from '@/components/primitives/Button'
import { IconSizeStyle, Routes } from '@/lib/constants'

export const BackButton = () => (
  <Link href={Routes.HOME}>
    <Button variant="ghost" size="icon" data-testid="button-back">
      <ArrowLeft className={IconSizeStyle.HW5} />
    </Button>
  </Link>
)
