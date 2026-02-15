import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, DM_Serif_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })
const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-serif" })

export const metadata: Metadata = {
  title: "SKADAM – Smart Coffee Shop Menu",
  description:
    "Order coffee, explore the menu, and enjoy a modern café experience at SKADAM.",
  icons: {
    icon: "https://res.cloudinary.com/dgequg3ik/image/upload/v1768377494/20260111_030418_0000_tilp13.png",
    apple:
      "https://res.cloudinary.com/dgequg3ik/image/upload/v1768377494/20260111_030418_0000_tilp13.png",
  },
  manifest: "/manifest.json",
  themeColor: "#000000",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.className} ${dmSans.variable} ${dmSerif.variable} antialiased`}
      >
        {children}

        {/* OptiMonk loader - put it at the end of body */}
        <Script
          src="https://onsite.optimonk.com/script.js?account=266470"
          strategy="afterInteractive"
          async
        />

        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
