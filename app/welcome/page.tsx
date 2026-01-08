import { WelcomeLanding } from "@/components/welcome/welcome-landing"
import { Suspense } from "react"

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-6xl animate-bounce">☕</div>
        </div>
      }
    >
      <WelcomeLanding />
    </Suspense>
  )
}
