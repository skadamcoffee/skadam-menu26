
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

  // Step 1: Create the user in auth.users.
  // This will trigger the `handle_new_user` function automatically,
  // which creates a corresponding record in `public.users` with the role 'customer'.
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
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

  // Step 2: Update the user's role in public.users.
  // The trigger has already created the user with the 'customer' role. We now update it.
  const { error: usersDbError } = await supabaseAdmin
    .from('users')
    .update({ role: role })
    .match({ id: userId });

  if (usersDbError) {
    console.error('Error updating user role in public.users:', usersDbError)
    // Cleanup: If this fails, the user is in a bad state. Delete them from Auth.
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: `Failed to update user role: ${usersDbError.message}` }, { status: 500 })
  }

  // Step 3: Insert the user into the public.staff table.
  const { error: staffDbError } = await supabaseAdmin.from('staff').insert([
    { user_id: userId, email: email, role: role },
  ])

  if (staffDbError) {
    console.error('Error inserting into public.staff:', staffDbError)
    // Cleanup: If this fails, delete the user from Auth. The public.users record will cascade.
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: `Failed to create user in staff table: ${staffDbError.message}` }, { status: 500 })
  }

  return NextResponse.json(authData)
}

export async function DELETE(request: Request) {
  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  // The database is set up with cascading deletes.
  // Deleting the user from Supabase Auth will automatically remove them
  // from the 'users' table. We need to manually delete from the 'staff' table.
  const { error: staffDeleteError } = await supabaseAdmin.from('staff').delete().match({ user_id: userId });

  if (staffDeleteError) {
      console.error("Error deleting from staff table:", staffDeleteError);
      // Decide if we should proceed if this fails. For now, we'll log it and continue.
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (authError) {
    console.error('Supabase auth error on delete:', authError)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'User deleted successfully' })
}
