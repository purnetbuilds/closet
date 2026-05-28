'use client'

import { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Shirt, CalendarDays, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/looks', label: 'Looks', icon: BookOpen },
  { href: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { href: '/calendar', label: 'History', icon: CalendarDays },
  { href: '/capsules', label: 'Trips', icon: Briefcase },
]

const PILL_WIDTH = 24

export function BottomNav() {
  const pathname = usePathname()
  const itemsRef = useRef<Array<HTMLAnchorElement | null>>([])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pillRef = useRef<HTMLSpanElement | null>(null)

  const activeIdx = tabs.findIndex((t) => t.href === pathname)

  const updatePill = useCallback(() => {
    const pill = pillRef.current
    const parent = containerRef.current
    if (!pill || !parent) return
    if (activeIdx < 0) {
      pill.style.opacity = '0'
      return
    }
    const el = itemsRef.current[activeIdx]
    if (!el) return
    const parentRect = parent.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    const left = rect.left - parentRect.left + (rect.width - PILL_WIDTH) / 2
    pill.style.opacity = '1'
    pill.style.transform = `translateX(${left}px)`
    pill.style.width = `${PILL_WIDTH}px`
  }, [activeIdx])

  useEffect(() => {
    updatePill()
    const onResize = () => updatePill()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [updatePill])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/85 pb-safe backdrop-blur-xl">
      <div ref={containerRef} className="relative mx-auto flex max-w-md">
        <span
          ref={pillRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-[3px] rounded-full bg-foreground opacity-0"
          style={{
            width: PILL_WIDTH,
            transform: 'translateX(0px)',
            transition:
              'transform 320ms var(--ease-out-strong), width 320ms var(--ease-out-strong), opacity 200ms',
          }}
        />
        {tabs.map(({ href, label, icon: Icon }, i) => {
          const active = activeIdx === i
          return (
            <Link
              key={href}
              href={href}
              ref={(el) => {
                itemsRef.current[i] = el
              }}
              className={cn(
                'press-sm flex flex-1 flex-col items-center gap-0.5 py-3 text-xs transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className={active ? 'font-medium' : ''}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
