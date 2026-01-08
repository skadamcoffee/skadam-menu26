"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { LogIn, AlertCircle } from "lucide-react"
import bcrypt from "bcryptjs"
import { createClient } from "@/lib/supabase/client"

export default function BaristaLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Fetch staff record by email
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single()

      if (staffError || !staffData) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      // Compare password with hash
      const passwordMatch = await bcrypt.compare(password, staffData.password_hash)

      if (!passwordMatch) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from("staff_sessions")
        .insert([
          {
            staff_id: staffData.id,
            login_time: new Date().toISOString(),
            ip_address: "N/A", // You can enhance this to get actual IP
            user_agent: navigator.userAgent,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (sessionError) throw sessionError

      // Store session in localStorage for client-side reference
      localStorage.setItem(
        "staff_session",
        JSON.stringify({
          staffId: staffData.id,
          sessionId: sessionData.id,
          email: staffData.email,
          role: staffData.role,
        }),
      )

      // Redirect to barista dashboard
      router.push("/barista/dashboard")
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-6xl mb-4">☕</div>
          <h1 className="text-3xl font-bold">SKADAM</h1>
          <p className="text-muted-foreground mt-2">Barista Login</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </motion.div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="your.email@skadam.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                />
              </div>

              {/* Login Button */}
              <Button type="submit" disabled={isLoading} size="lg" className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Card>
        </motion.div>

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
