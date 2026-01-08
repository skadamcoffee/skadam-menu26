
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

  // Step 1: Create the user in the auth.users table
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // User will not have to confirm their email
    user_metadata: { role },
  })

  if (authError) {
    console.error('Supabase auth error:', authError)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  if (!authData || !authData.user) {
    return NextResponse.json({ error: "Could not create user in Supabase Auth." }, { status: 500 });
  }

  const userId = authData.user.id;

  // Step 2: Insert the user into the public.users table
  const { error: usersDbError } = await supabaseAdmin.from('users').insert([
    { id: userId, email: email, role: role },
  ])

  if (usersDbError) {
    console.error('Error inserting into public.users:', usersDbError)
    // Cleanup: If this step fails, delete the user from Supabase Auth to prevent orphans
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: `Failed to create user in users table: ${usersDbError.message}` }, { status: 500 })
  }

  // Step 3: Insert the user into the public.staff table
  const { error: staffDbError } = await supabaseAdmin.from('staff').insert([
    // Note: We are NOT inserting a password_hash, as Supabase Auth handles that.
    { user_id: userId, email: email, role: role },
  ])

  if (staffDbError) {
    console.error('Error inserting into public.staff:', staffDbError)
    // Cleanup: If this step fails, delete the user from both Auth and public.users
    await supabaseAdmin.auth.admin.deleteUser(userId)
    await supabaseAdmin.from('users').delete().match({ id: userId })
    return NextResponse.json({ error: `Failed to create user in staff table: ${staffDbError.message}` }, { status: 500 })
  }

  return NextResponse.json(authData)
}

export async function DELETE(request: Request) {
  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  // The database is set up with cascading deletes, 
  // so deleting the user from Supabase Auth should automatically remove them 
  // from the 'users' and 'staff' tables.
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Supabase admin error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'User deleted successfully' })
}
