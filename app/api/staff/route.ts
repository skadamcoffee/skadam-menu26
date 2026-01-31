import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ------------------ ADD STAFF ------------------
export async function POST(req: Request) {
  try {
    const { email, password, role, barista_name } = await req.json()

    console.log("POST /api/staff: Received data", { email, role, barista_name: barista_name ? "provided" : "null" })

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields: email, password, role" }, { status: 400 })
    }

    if (role === "barista" && !barista_name?.trim()) {
      return NextResponse.json({ error: "Barista name is required for baristas" }, { status: 400 })
    }

    // Check Auth
    const { data: existingAuth } = await supabase.auth.admin.listUsers()
    const authUser = existingAuth.users.find((u) => u.email === email)
    if (authUser) {
      return NextResponse.json({ error: "User with this email already exists in authentication" }, { status: 400 })
    }

    // Check users
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).maybeSingle()
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Check staff if barista
    if (role === "barista") {
      const { data: existingStaff } = await supabase.from("staff").select("id").eq("email", email).maybeSingle()
      if (existingStaff) {
        return NextResponse.json({ error: "Barista with this email already exists" }, { status: 400 })
      }
    }

    // Create Auth user
    const { data: auth, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { role, barista_name },
    })

    if (authError || !auth.user) {
      console.log("POST /api/staff: Auth creation failed", authError?.message)
      return NextResponse.json({ error: authError?.message || "Auth failed" }, { status: 400 })
    }

    const userId = auth.user.id
    console.log("POST /api/staff: Auth user created", userId)

    // Insert into users
    const { error: userError } = await supabase.from("users").insert([{ id: userId, email, role }])
    if (userError) {
      console.log("POST /api/staff: Users insert failed", userError.message)
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Failed to insert into users: ${userError.message}` }, { status: 500 })
    }

    // Insert into staff if barista
    if (role === "barista") {
      const { error: staffError } = await supabase.from("staff").insert([{
        id: userId,
        email,
        role,
        barista_name: barista_name || null,
        is_active: true,
      }])
      if (staffError) {
        console.log("POST /api/staff: Staff insert failed", staffError.message)
        await supabase.from("users").delete().eq("id", userId)
        await supabase.auth.admin.deleteUser(userId)
        return NextResponse.json({ error: `Failed to insert into staff: ${staffError.message}` }, { status: 500 })
      }
    }

    // Optional: Insert into loyalty (only if applicable, e.g., for all users or baristas)
    // Since email is already in loyalty, skip if not needed, or insert if required
    // Example: If loyalty is auto-handled by triggers, remove this
    // const { error: loyaltyError } = await supabase.from("loyalty").insert([{
    //   user_id: userId,
    //   email,  // Email is provided
    // }])
    // if (loyaltyError) {
    //   console.log("POST /api/staff: Loyalty insert failed (optional)", loyaltyError.message)
    // }

    console.log("POST /api/staff: User added successfully", userId)
    return NextResponse.json({ message: "Staff member added successfully" })
  } catch (err) {
    console.error("POST /api/staff: Unexpected error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ------------------ EDIT STAFF ------------------
export async function PUT(req: Request) {
  try {
    const { userId, role, barista_name, is_active } = await req.json()

    console.log("PUT /api/staff: Received data", { userId, role, barista_name: barista_name ? "provided" : "null" })

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    if (role === "barista" && !barista_name?.trim()) {
      return NextResponse.json({ error: "Barista name is required for baristas" }, { status: 400 })
    }

    // Update users
    const { error: userUpdateError } = await supabase.from("users").update({ role }).eq("id", userId)
    if (userUpdateError) {
      console.log("PUT /api/staff: Users update failed", userUpdateError.message)
      return NextResponse.json({ error: userUpdateError.message }, { status: 500 })
    }

    // Handle staff
    const { data: currentStaff } = await supabase.from("staff").select("id").eq("id", userId).maybeSingle()
    if (role === "barista") {
      if (!currentStaff) {
        const { error: staffInsertError } = await supabase.from("staff").insert([{
          id: userId,
          email: (await supabase.from("users").select("email").eq("id", userId).single()).data?.email,
          role,
          barista_name: barista_name || null,
          is_active: is_active ?? true,
        }])
        if (staffInsertError) {
          return NextResponse.json({ error: staffInsertError.message }, { status: 500 })
        }
      } else {
        const { error: staffUpdateError } = await supabase.from("staff").update({
          role,
          barista_name: barista_name || null,
          is_active,
        }).eq("id", userId)
        if (staffUpdateError) {
          return NextResponse.json({ error: staffUpdateError.message }, { status: 500 })
        }
      }
    } else if (currentStaff) {
      const { error: staffDeleteError } = await supabase.from("staff").delete().eq("id", userId)
      if (staffDeleteError) {
        return NextResponse.json({ error: staffDeleteError.message }, { status: 500 })
      }
    }

    // Update auth metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role, barista_name },
    })

    console.log("PUT /api/staff: User updated successfully", userId)
    return NextResponse.json({ message: "Staff member updated successfully" })
  } catch (err) {
    console.error("PUT /api/staff: Unexpected error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ------------------ DELETE STAFF ------------------
export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json()
    console.log("DELETE /api/staff: Received userId", userId)

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Delete from staff, users, auth
    await supabase.from("staff").delete().eq("id", userId)
    await supabase.from("users").delete().eq("id", userId)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    console.log("DELETE /api/staff: User deleted successfully", userId)
    return NextResponse.json({ message: "Staff member deleted successfully" })
  } catch (err) {
    console.error("DELETE /api/staff: Unexpected error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
