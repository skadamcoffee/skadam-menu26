'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { NotificationBadge } from '@/components/notifications/notification-badge'

const tabs = [
  { id: 'dashboard', href: '/dashboard', label: 'Orders' },
  { id: 'feedback', href: '/dashboard/feedback', label: 'Feedback' },
  { id: 'analytics', href: '/dashboard/analytics', label: 'Analytics', disabled: true },
  { id: 'menu', href: '/dashboard/menu', label: 'Menu', disabled: true },
  { id: 'qr', href: '/dashboard/qr', label: 'QR Codes', disabled: true },
  { id: 'loyalty', href: '/dashboard/loyalty', label: 'Loyalty', disabled: true },
  { id: 'promotions', href: '/dashboard/promotions', label: 'Promotions', disabled: true },
  { id: 'promo-codes', href: '/dashboard/promo-codes', label: 'Promo Codes', disabled: true },
  { id: 'settings', href: '/dashboard/settings', label: 'Settings', disabled: true },
  { id: 'staff', href: '/dashboard/staff', label: 'Staff', disabled: true },
]

export function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // This will find the most specific active tab.
  // e.g. /dashboard/feedback will match 'feedback', not 'dashboard'
  const activeTab = tabs
    .slice()
    .reverse()
    .find((tab) => pathname.startsWith(tab.href))?.id

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard">
            <h1 className="text-xl font-bold text-primary">SKADAM Admin</h1>
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBadge />

            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 hover:bg-muted rounded">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className={`flex gap-2 ${isOpen ? 'block' : 'hidden'} md:flex flex-col md:flex-row flex-wrap`}>
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.disabled ? '#' : tab.href}
              onClick={() => setIsOpen(false)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              } ${
                tab.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-muted'
              }`}>
              
                {tab.label}
              
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
