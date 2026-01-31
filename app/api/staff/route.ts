import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// ✅ Use service role key ONLY on server-side
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

    // Require barista_name for baristas
    if (role === "barista" && !barista_name?.trim()) {
      return NextResponse.json({ error: "Barista name is required for baristas" }, { status: 400 })
    }

    // Check if user already exists in Auth
    const { data: existingAuth } = await supabase.auth.admin.listUsers()
    const authUser = existingAuth.users.find((u) => u.email === email)
    if (authUser) {
      console.log("POST /api/staff: User with email already exists in Auth", email)
      return NextResponse.json({ error: "User with this email already exists in authentication" }, { status: 400 })
    }

    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      console.log("POST /api/staff: User with email already exists in users table", email)
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // If barista, check staff table too
    if (role === "barista") {
      const { data: existingStaff } = await supabase
        .from("staff")
        .select("id")
        .eq("email", email)
        .maybeSingle()

      if (existingStaff) {
        console.log("POST /api/staff: Barista with email already exists in staff table", email)
        return NextResponse.json({ error: "Barista with this email already exists" }, { status: 400 })
      }
    }

    // Create Supabase Auth user
    const { data: auth, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, barista_name },
    })

    if (authError || !auth.user) {
      console.log("POST /api/staff: Auth creation failed", authError?.message)
      return NextResponse.json({ error: authError?.message || "Auth failed" }, { status: 400 })
    }

    const userId = auth.user.id
    console.log("POST /api/staff: Auth user created", userId)

    // Insert into users table
    const { error: userError } = await supabase.from("users").insert([
      {
        id: userId,
        email,
        role,
      },
    ])

    if (userError) {
      console.log("POST /api/staff: Users insert failed", userError.message)
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Failed to insert into users: ${userError.message}` }, { status: 500 })
    }

    // If barista, insert into staff table
    if (role === "barista") {
      const { error: staffError } = await supabase.from("staff").insert([
        {
          id: userId,
          email,
          role,
          barista_name: barista_name || null,
          is_active: true,
        },
      ])

      if (staffError) {
        console.log("POST /api/staff: Staff insert failed", staffError.message)
        // Rollback
        await supabase.from("users").delete().eq("id", userId)
        await supabase.auth.admin.deleteUser(userId)
        return NextResponse.json({ error: `Failed to insert into staff: ${staffError.message}` }, { status: 500 })
      }
    }

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

    // Require barista_name for baristas
    if (role === "barista" && !barista_name?.trim()) {
      return NextResponse.json({ error: "Barista name is required for baristas" }, { status: 400 })
    }

    // Update users table
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId)

    if (userUpdateError) {
      console.log("PUT /api/staff: Users update failed", userUpdateError.message)
      return NextResponse.json({ error: userUpdateError.message }, { status: 500 })
    }

    // Check if user is currently a barista in staff
    const { data: currentStaff } = await supabase
      .from("staff")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (role === "barista") {
      // If now barista, ensure in staff
      if (!currentStaff) {
        const { error: staffInsertError } = await supabase.from("staff").insert([
          {
            id: userId,
            email: (await supabase.from("users").select("email").eq("id", userId).single()).data?.email,
            role,
            barista_name: barista_name || null,
            is_active: is_active ?? true,
          },
        ])
        if (staffInsertError) {
          console.log("PUT /api/staff: Staff insert failed", staffInsertError.message)
          return NextResponse.json({ error: staffInsertError.message }, { status: 500 })
        }
      } else {
        // Update existing staff entry
        const { error: staffUpdateError } = await supabase
          .from("staff")
          .update({
            role,
            barista_name: barista_name || null,
            is_active,
          })
          .eq("id", userId)

        if (staffUpdateError) {
          console.log("PUT /api/staff: Staff update failed", staffUpdateError.message)
          return NextResponse.json({ error: staffUpdateError.message }, { status: 500 })
        }
      }
    } else {
      // If no longer barista, remove from staff
      if (currentStaff) {
        const { error: staffDeleteError } = await supabase.from("staff").delete().eq("id", userId)
        if (staffDeleteError) {
          console.log("PUT /api/staff: Staff delete failed", staffDeleteError.message)
          return NextResponse.json({ error: staffDeleteError.message }, { status: 500 })
        }
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

    // Delete from staff if exists
    const { error: staffError } = await supabase.from("staff").delete().eq("id", userId)
    if (staffError) {
      console.log("DELETE /api/staff: Staff delete failed", staffError.message)
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    // Delete from users
    const { error: userError } = await supabase.from("users").delete().eq("id", userId)
    if (userError) {
      console.log("DELETE /api/staff: Users delete failed", userError.message)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      console.log("DELETE /api/staff: Auth delete failed", authError.message)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    console.log("DELETE /api/staff: User deleted successfully", userId)
    return NextResponse.json({ message: "Staff member deleted successfully" })
  } catch (err) {
    console.error("DELETE /api/staff: Unexpected error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
