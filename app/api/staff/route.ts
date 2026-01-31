import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Environment variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error: Supabase not initialized' }, { status: 500 })
    }

    const { email, password, role, barista_name } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, password, role' }, { status: 400 })
    }

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, barista_name },
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData || !authData.user) {
      return NextResponse.json({ error: "Could not create user in Supabase Auth." }, { status: 500 })
    }

    const userId = authData.user.id

    
    // Commented out the users upsert block as it's not needed and may be causing issues
    const { error: usersDbError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email,
        role,
      })

    if (usersDbError) {
      console.error('Error updating user role in public.users:', usersDbError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Failed to update user role: ${usersDbError.message}` }, { status: 500 })
    }
  
    // Insert into public.staff
    const { error: staffDbError } = await supabaseAdmin.from('staff').insert([
      { 
        id: userId, 
        email, 
        password,
        role,
        barista_name: barista_name || null, 
        is_active: true,
      },
    ])

    if (staffDbError) {
      console.error('Error inserting into public.staff:', staffDbError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Failed to create user in staff table: ${staffDbError.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Staff member added successfully', user: authData })
  } catch (err) {
    console.error('Unexpected error in POST:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error: Supabase not initialized' }, { status: 500 })
    }

    const { userId, role, barista_name, is_active } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing required fields: userId, role' }, { status: 400 })
    }

    // Update staff record
    const { error: staffUpdateError } = await supabaseAdmin
      .from('staff')
      .update({
        role,
        barista_name: barista_name || null,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .match({ id: userId })

    if (staffUpdateError) {
      console.error('Error updating staff in public.staff:', staffUpdateError)
      return NextResponse.json({ error: `Failed to update staff: ${staffUpdateError.message}` }, { status: 500 })
    }

    // Update auth metadata (optional)
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role, barista_name },
    })

    if (authUpdateError) {
      console.error('Error updating auth user metadata:', authUpdateError)
    }

    return NextResponse.json({ message: 'Staff member updated successfully' })
  } catch (err) {
    console.error('Unexpected error in PUT:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error: Supabase not initialized' }, { status: 500 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Delete from staff table
    const { error: staffDeleteError } = await supabaseAdmin.from('staff').delete().match({ id: userId })

    if (staffDeleteError) {
      console.error("Error deleting from staff table:", staffDeleteError)
    }

    // Delete from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Supabase auth error on delete:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (err) {
    console.error('Unexpected error in DELETE:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
