import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/primitives/Button'
import { Routes } from '@/lib/constants'

export const BackButton = ({ route = Routes.HOME }: { route?: string }) => (
  <Button variant="ghost" size="icon" data-testid="button-back" href={route}>
    <ArrowLeft className="size-5" />
  </Button>
)

export const BackButtonHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 mb-8">
    <BackButton />
    <h1 className="text-2xl font-bold" data-testid="heading">
      {title}
    </h1>
  </div>
)
