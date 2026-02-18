import type { SetRequired } from 'type-fest'
import { Link as WouterLink } from 'wouter'

const isExternalHref = (href: string) => /^(https?:|mailto:|tel:|#)/.test(href)

export const Link = ({
  children,
  href,
  className,
}: SetRequired<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) =>
  isExternalHref(href) ? (
    <a
      href={href}
      className={className}
      //   New tab
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ) : (
    <WouterLink to={href} className={className}>
      {children}
    </WouterLink>
  )
