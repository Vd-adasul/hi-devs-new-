/**
 * LawyerOS wordmark — editorial luxe.
 *
 *   Lawyer   slate-100, light-weight serif italic (Cormorant Garamond)
 *   OS       brass, semibold serif — the "operating system" carries the tech gravitas
 *
 * `kind="full"` shows "LawyerOS"; `kind="mark"` shows just "L·OS" for
 * the collapsed sidebar.
 */
import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

const SIZE: Record<Size, string> = {
  sm:    'text-base',
  md:    'text-lg',
  lg:    'text-xl',
  xl:    'text-2xl',
  '2xl': 'text-[26px]',
  '3xl': 'text-[34px]',
}

export function Wordmark({
  size = 'md',
  kind = 'full',
  className,
}: {
  size?:      Size
  kind?:      'full' | 'mark'
  className?: string
}) {
  if (kind === 'mark') {
    return (
      <span
        aria-label="LawyerOS"
        className={cn(
          'inline-flex items-center gap-[2px] font-serif tracking-tight select-none leading-none',
          SIZE[size],
          className,
        )}
      >
        <span className="font-medium text-slate-100 italic">L</span>
        <span className="text-brass-400" aria-hidden>·</span>
        <span className="font-semibold text-brass-400">OS</span>
      </span>
    )
  }

  return (
    <span
      aria-label="LawyerOS"
      className={cn(
        'inline-flex items-baseline font-serif tracking-tight select-none leading-none',
        SIZE[size],
        className,
      )}
    >
      <span className="font-normal text-slate-100 italic">Lawyer</span>
      <span className="font-semibold text-brass-gradient ml-[1px]">OS</span>
    </span>
  )
}
