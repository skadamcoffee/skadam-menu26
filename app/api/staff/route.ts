import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This route uses the Supabase Service Role key to perform admin actions.
// Vercel environment variables are required for this to work.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  const { email, password, role } = await request.json()

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // User will not have to confirm their email
    user_metadata: { role },
  })

  if (error) {
    console.error('Supabase admin error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Supabase admin error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'User deleted successfully' })
}
