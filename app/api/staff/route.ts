import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, role } = await request.json()
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Set to true if you want to send a confirmation email
    user_metadata: { role },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { userId } = await request.json()
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'User deleted successfully' })
}
