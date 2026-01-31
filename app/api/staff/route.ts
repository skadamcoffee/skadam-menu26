import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { email, password, role, barista_name } = await req.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 1️⃣ Check if staff already exists
    const { data: existing } = await supabase
      .from("staff")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "Staff with this email already exists" },
        { status: 400 }
      )
    }

    // 2️⃣ Create auth user
    const { data: auth, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, barista_name },
      })

    if (authError || !auth.user) {
      return NextResponse.json(
        { error: authError?.message || "Auth failed" },
        { status: 400 }
      )
    }

    const userId = auth.user.id

    // 3️⃣ Insert into staff table
    const { error: staffError } = await supabase.from("staff").insert({
      id: userId,
      email,
      role,
      barista_name: barista_name || null,
      is_active: true,
    })

    if (staffError) {
      // rollback auth user
      await supabase.auth.admin.deleteUser(userId)

      return NextResponse.json(
        { error: staffError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Staff member added successfully",
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
