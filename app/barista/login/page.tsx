'use client'

import type React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { LogIn, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BaristaLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Use Supabase's built-in signInWithPassword method
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoading(false)

    if (error) {
      console.error('Supabase login error:', error.message)
      setError('Invalid email or password. Please try again.')
    } else {
      // On successful login, Supabase handles the session.
      // Redirect the user to the protected barista dashboard.
      router.push('/barista')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-6xl mx-auto mb-4 w-fit animate-bounce">☕</div>
          <h1 className="text-3xl font-bold">SKDAM Staff Login</h1>
          <p className="text-muted-foreground">Welcome back, ready to brew?</p>
        </motion.div>

        <Card className="p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-base"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-base"
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="bg-red-500/10 text-red-500 text-sm p-3 rounded-md flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Login Button */}
            <Button type="submit" disabled={isLoading} size="lg" className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <motion.p
          className="text-center text-xs text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          For staff access only. If you don't have credentials, contact your manager.
        </motion.p>
      </motion.div>
    </div>
  )
}
