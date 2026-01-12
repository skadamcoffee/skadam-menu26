"use server"

import { supabase } from "@/lib/supabase/server"

export async function addLoyaltyCustomer(email: string, initialStamps: number) {
  try {
    // Insert user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({ email: email.toLowerCase(), role: "customer" })
      .select()
      .single()

    if (userError) throw userError
    if (!userData?.id) throw new Error("User ID not returned")

    const userId = userData.id

    // Insert loyalty
    const { error: loyaltyError } = await supabase
      .from("loyalty")
      .insert({ user_id: userId, stamps: initialStamps, reward_available: initialStamps >= 10 })

    if (loyaltyError) throw loyaltyError

    return { success: true, userId }
  } catch (error) {
    console.error("Error adding customer:", error)
    throw error
  }
}
