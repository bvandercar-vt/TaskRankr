import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './primitives/overlays/Tooltip'

type SubtaskBlockedTooltipProps = React.PropsWithChildren<{
  blocked: boolean
}>

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
