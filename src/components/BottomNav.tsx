'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Shirt, CalendarDays, Briefcase } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/looks', label: 'Looks', icon: BookOpen },
  { href: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { href: '/calendar', label: 'History', icon: CalendarDays },
  { href: '/capsules', label: 'Trips', icon: Briefcase },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
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
