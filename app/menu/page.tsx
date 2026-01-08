import { MenuPage } from "@/components/menu/menu-page"
import { CartProvider } from "@/components/cart/cart-context"
import { Suspense } from "react"

export default function Page() {
  return (
    <CartProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <MenuPage />
      </Suspense>
    </CartProvider>
  )
}
