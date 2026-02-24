import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './primitives/overlays/Tooltip'

interface SubtaskBlockedTooltipProps {
  blocked: boolean
  children: React.ReactNode
}

export const SubtaskBlockedTooltip = ({
  blocked,
  children,
}: SubtaskBlockedTooltipProps) => (
  <Tooltip>
    <TooltipTrigger asChild disabled={!blocked}>
      {children}
    </TooltipTrigger>
    {blocked && (
      <TooltipContent>All subtasks must be completed first</TooltipContent>
    )}
  </Tooltip>
)
