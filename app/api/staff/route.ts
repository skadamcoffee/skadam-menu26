import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.SUPABASE_URL!,            // server-only URL
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role key
)

// Add staff
export async function POST(req: Request) {
  try {
    const { email, password, role, barista_name } = await req.json()

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if staff exists
    const { data: existing } = await supabase.from("staff").select("id").eq("email", email).maybeSingle()
    if (existing) return NextResponse.json({ error: "Staff with this email exists" }, { status: 400 })

    // Create auth user
    const { data: auth, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, barista_name },
    })

    if (authError || !auth.user) return NextResponse.json({ error: authError?.message || "Auth failed" }, { status: 400 })

    // Insert into staff table
    const { error: staffError } = await supabase.from("staff").insert([{
      id: auth.user.id,
      email,
      role,
      barista_name: barista_name || null,
      is_active: true,
    }])

    if (staffError) {
      await supabase.auth.admin.deleteUser(auth.user.id)
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Staff member added successfully" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete staff
export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    const { error } = await supabase.from("staff").delete().eq("id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ message: "Staff deleted successfully" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Edit staff
export async function PUT(req: Request) {
  try {
    const { userId, role, barista_name, is_active } = await req.json()
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    const { error } = await supabase.from("staff").update({
      role,
      barista_name: barista_name || null,
      is_active,
    }).eq("id", userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ message: "Staff updated successfully" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
