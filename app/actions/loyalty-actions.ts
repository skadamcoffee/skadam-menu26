"use server"

import { createClient } from "@/lib/supabase/server" // make sure this is server-side client

export async function fetchLoyaltyData() {
  const supabase = createClient()

  const { data: loyaltyData, error } = await supabase
    .from("loyalty")
    .select("id, user_id, stamps, reward_available, last_stamp_date, created_at")
    .order("stamps", { ascending: false })

  if (error) throw new Error(error.message)

  const userIds = loyaltyData.map((item: any) => item.user_id)
  let emailMap: { [key: string]: string } = {}

  if (userIds.length > 0) {
    const { data: usersData } = await supabase.from("users").select("id, email").in("id", userIds)
    if (usersData) {
      emailMap = Object.fromEntries(usersData.map((u: any) => [u.id, u.email]))
    }
  }

  const formattedData = loyaltyData.map((item: any) => ({
    id: item.id,
    email: emailMap[item.user_id] || "Unknown User",
    stamps: item.stamps,
    reward_available: item.reward_available,
    last_stamp_date: item.last_stamp_date,
    created_at: item.created_at,
  }))

  return formattedData
}

export async function addLoyaltyCustomer(email: string, initialStamps: number) {
  const supabase = createClient()
  const { data, error } = await supabase.from("loyalty").insert({
    user_id: null, // optional: link with user table later
    stamps: initialStamps,
    reward_available: initialStamps >= 10,
    created_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
  return data
}

export async function updateCustomerStamps(customerId: string, newStamps: number, rewardAvailable: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from("loyalty")
    .update({ stamps: newStamps, reward_available: rewardAvailable, updated_at: new Date().toISOString() })
    .eq("id", customerId)

  if (error) throw new Error(error.message)
}

export async function resetCustomerReward(customerId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("loyalty")
    .update({ stamps: 0, reward_available: false, updated_at: new Date().toISOString() })
    .eq("id", customerId)

  if (error) throw new Error(error.message)
}
