/**
 * @fileoverview Reusable search input with icon, used in headers and dialogs
 */

import { Search } from 'lucide-react'

import { Input } from '@/components/primitives/forms/Input'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  onBlur?: () => void
  className?: string
  'data-testid'?: string
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  autoFocus,
  onBlur,
  className,
  'data-testid': testId = 'search-input',
}: SearchInputProps) => (
  <div
    className={cn(
      'flex items-center bg-secondary/30 rounded-full border border-white/5 px-4 h-10',
      className,
    )}
  >
    <Search className="size-4 shrink-0 text-primary" />
    <Input
      placeholder={placeholder}
      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 ml-3 text-sm placeholder:text-muted-foreground/50"
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      data-testid={testId}
    />
  </div>
)
