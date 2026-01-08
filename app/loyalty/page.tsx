import { LoyaltyPage } from "@/components/loyalty/loyalty-page"
import { Suspense } from "react"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoyaltyPage />
    </Suspense>
  )
}
