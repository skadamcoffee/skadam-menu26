'use client'

import { useState, useEffect } from "react"
import  DashboardNav  from "@/components/dashboard/dashboard-nav" // Adjust path to your DashboardNav component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Import icons for tabs (from your DashboardNav code)
import {
  ShoppingCart,
  MessageSquare,
  BarChart3,
  Utensils,
  Palette,
  QrCode,
  Heart,
  Megaphone,
  Ticket,
  Settings,
  Users
} from "lucide-react"

// Define tabs array (centralized for reuse)
const tabs = [
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "menu", label: "Menu", icon: Utensils },
  { id: "customizations", label: "Customizations", icon: Palette },
  { id: "qr", label: "QR Codes", icon: QrCode },
  { id: "loyalty", label: "Loyalty", icon: Heart },
  { id: "promotions", label: "Promotions", icon: Megaphone },
  { id: "promo-codes", label: "Promo Codes", icon: Ticket },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "staff", label: "Staff Management", icon: Users },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("orders") // Default fallback

  // Load activeTab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem("skadam_activeTab")
    if (savedTab && tabs.some(tab => tab.id === savedTab)) {
      setActiveTab(savedTab)
    }
  }, [])

  // Handle tab change and persist to localStorage
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    localStorage.setItem("skadam_activeTab", tab)
  }

  // Render content based on activeTab (placeholder - replace with your actual components)
  const renderTabContent = () => {
    switch (activeTab) {
      case "orders":
        return <OrdersTab />
      case "feedback":
        return <FeedbackTab />
      case "analytics":
        return <AnalyticsTab />
      case "menu":
        return <MenuTab />
      case "customizations":
        return <CustomizationsTab />
      case "qr":
        return <QrTab />
      case "loyalty":
        return <LoyaltyTab />
      case "promotions":
        return <PromotionsTab />
      case "promo-codes":
        return <PromoCodesTab />
      case "settings":
        return <SettingsTab />
      case "staff":
        return <StaffTab />
      default:
        return <OrdersTab />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <DashboardNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {renderTabContent()}
        </div>
      </main>
    </div>
  )
}

// Placeholder Tab Components (Replace with your actual implementations)
function OrdersTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Manage and view orders here.</p>
      </CardContent>
    </Card>
  )
}

function FeedbackTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <p>View customer feedback.</p>
      </CardContent>
    </Card>
  )
}

function AnalyticsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <p>View analytics and reports.</p>
      </CardContent>
    </Card>
  )
}

function MenuTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Edit the menu items.</p>
      </CardContent>
    </Card>
  )
}

function CustomizationsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customizations</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Customize app settings.</p>
      </CardContent>
    </Card>
  )
}

function QrTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Codes</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Generate and manage QR codes.</p>
      </CardContent>
    </Card>
  )
}

function LoyaltyTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loyalty</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Manage loyalty programs.</p>
      </CardContent>
    </Card>
  )
}

function PromotionsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Promotions</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Create and manage promotions.</p>
      </CardContent>
    </Card>
  )
}

function PromoCodesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Promo Codes</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Generate promo codes.</p>
      </CardContent>
    </Card>
  )
}

function SettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Configure app settings.</p>
      </CardContent>
    </Card>
  )
}

function StaffTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Manage staff accounts.</p>
      </CardContent>
    </Card>
  )
}
