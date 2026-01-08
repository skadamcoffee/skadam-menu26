import { OrderTracking } from "@/components/order/order-tracking"
import { Suspense } from "react"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderTracking orderId={id} />
    </Suspense>
  )
}
