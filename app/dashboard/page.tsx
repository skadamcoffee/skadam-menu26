'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { OrderList } from '@/components/dashboard/order-list'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
      } else {
        // Check if user is admin
        const { data: userData } = await supabase.from('users').select('role').eq('id', authUser.id).single()

        if (userData?.role !== 'admin') {
          router.push('/')
        } else {
          setUser(authUser)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">☕</div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <OrderList />
      </main>
    </div>
  )
}
