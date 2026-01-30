import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, DM_Serif_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} ${dmSans.variable} ${dmSerif.variable} antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
