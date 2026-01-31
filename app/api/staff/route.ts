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

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if staff already exists
    const { data: existing } = await supabase
      .from("staff")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Staff with this email already exists" }, { status: 400 })
    }

    // Create Supabase Auth user
    const { data: auth, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, barista_name },
    })

    if (authError || !auth.user) {
      return NextResponse.json({ error: authError?.message || "Auth failed" }, { status: 400 })
    }

    const userId = auth.user.id

    // Insert into staff table ✅ wrap in array
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
      // Rollback user creation if insert fails
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Staff member added successfully" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ------------------ EDIT STAFF ------------------
export async function PUT(req: Request) {
  try {
    const { userId, role, barista_name, is_active } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("staff")
      .update({
        role,
        barista_name: barista_name || null,
        is_active,
      })
      .eq("id", userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Also update role in auth metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role, barista_name },
    })

    return NextResponse.json({ message: "Staff member updated successfully" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ------------------ DELETE STAFF ------------------
export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Delete from staff table
    const { error: staffError } = await supabase.from("staff").delete().eq("id", userId)
    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Staff member deleted successfully" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
