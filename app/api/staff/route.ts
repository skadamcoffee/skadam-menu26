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
      console.error('Supabase not initialized')  
      return NextResponse.json({ error: 'Server configuration error: Supabase not initialized' }, { status: 500 })  
    }  
  
    const body = await request.json()  
    console.log('Received request body:', body)  
  
    const { email, password, role, barista_name } = body  
  
    if (!email || !password || !role) {  
      console.error('Missing fields:', { email: !!email, password: !!password, role: !!role })  
      return NextResponse.json({ error: 'Missing required fields: email, password, role' }, { status: 400 })  
    }  
  
    // Check for existing staff to avoid duplicate email errors  
    const { data: existingStaff, error: checkError } = await supabaseAdmin  
      .from('staff')  
      .select('id')  
      .eq('email', email)  
      .single()  
  
    if (checkError && checkError.code !== 'PGRST116') {  // PGRST116 is "no rows returned", which is fine  
      console.error('Error checking for existing staff:', checkError)  
      return NextResponse.json({ error: 'Failed to check existing staff' }, { status: 500 })  
    }  
  
    if (existingStaff) {  
      console.error('Staff with email already exists:', email)  
      return NextResponse.json({ error: 'Staff with this email already exists' }, { status: 400 })  
    }  
  
    // Step 1: Create user in auth.users  
    console.log('Creating auth user...')  
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({  
      email,  
      password,  
      email_confirm: true,  
      user_metadata: { role, barista_name },  
    })  
  
    if (authError) {  
      console.error('Auth creation error:', authError)  
      return NextResponse.json({ error: authError.message }, { status: 400 })  
    }  
  
    if (!authData || !authData.user) {  
      console.error('No auth user data returned')  
      return NextResponse.json({ error: "Could not create user in Supabase Auth." }, { status: 500 })  
    }  
  
    const userId = authData.user.id  
    console.log('Auth user created with ID:', userId)  
  
    // Step 2: Insert into public.users table (required for middleware authentication)  
    console.log('Inserting into users table...')  
    const { error: usersDbError } = await supabaseAdmin.from('users').insert([  
      {   
        id: userId,   
        email,  
        role,  
      },  
    ])  
  
    if (usersDbError) {  
      console.error('Users insert error:', usersDbError)  
      await supabaseAdmin.auth.admin.deleteUser(userId)  // Rollback  
      return NextResponse.json({ error: `Failed to create user in users table: ${usersDbError.message}` }, { status: 500 })  
    }  
  
    // Step 3: Insert into public.staff table  
    console.log('Inserting into staff table...')  
    const { error: staffDbError } = await supabaseAdmin.from('staff').insert([  
      {   
        id: userId,   
        email,  
        role,  
        barista_name: barista_name || null,   
        is_active: true,  
      },  
    ])  
  
    if (staffDbError) {  
      console.error('Staff insert error:', staffDbError)  
      await supabaseAdmin.auth.admin.deleteUser(userId)  // Rollback auth user on failure  
      return NextResponse.json({ error: `Failed to create user in staff table: ${staffDbError.message}` }, { status: 500 })  
    }  
  
    console.log('Staff member added successfully')  
    return NextResponse.json({ message: 'Staff member added successfully', user: authData })  
  } catch (err) {  
    console.error('Unexpected error in POST:', err)  
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })  
  }  
}  
  
export async function PUT(request: Request) {  
  try {  
    if (!supabaseAdmin) {  
      console.error('Supabase not initialized')  
      return NextResponse.json({ error: 'Server configuration error: Supabase not initialized' }, { status: 500 })  
    }  
  
    const body = await request.json()  
    console.log('Received PUT request body:', body)  
  
    const { userId, role, barista_name, is_active } = body  
  
    if (!userId || !role) {  
      console.error('Missing fields in PUT:', { userId: !!userId, role: !!role })  
      return NextResponse.json({ error: 'Missing required fields: userId, role' }, { status: 400 })  
    }  
  
    // Update staff record  
    console.log('Updating staff record...')  
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
  
    // Update users table record (required for middleware authentication)  
    console.log('Updating users table...')  
    const { error: usersUpdateError } = await supabaseAdmin  
      .from('users')  
      .update({ role })  
      .match({ id: userId })  
  
    if (usersUpdateError) {  
      console.error('Error updating users table:', usersUpdateError)  
      return NextResponse.json({ error: `Failed to update user role: ${usersUpdateError.message}` }, { status: 500 })  
    }  
  
    // Update auth metadata (optional)  
    console.log('Updating auth user metadata...')  
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {  
      user_metadata: { role, barista_name },  
    })  
  
    if (authUpdateError) {  
      console.error('Error updating auth user metadata:', authUpdateError)  
      // Don't fail the whole request for this optional update  
    }  
  
    console.log('Staff member updated successfully')  
    return NextResponse.json({ message: 'Staff member updated successfully' })  
  } catch (err) {  
    console.error('Unexpected error in PUT:', err)  
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })  
  }  
}  
  
export async function DELETE(request: Request) {  
  try {  
    if (!supabaseAdmin) {  
      console.error('Supabase not initialized')  
      return NextResponse.json({ error: 'Server configuration error: Supabase not initialized' }, { status: 500 })  
    }  
  
    const body = await request.json()  
    console.log('Received DELETE request body:', body)  
  
    const { userId } = body  
  
    if (!userId) {  
      console.error('Missing userId in DELETE')  
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })  
    }  
      
    // Delete from staff table  
    console.log('Deleting from staff table...')  
    const { error: staffDeleteError } = await supabaseAdmin.from('staff').delete().match({ id: userId })  
  
    if (staffDeleteError) {  
      console.error("Error deleting from staff table:", staffDeleteError)  
      return NextResponse.json({ error: `Failed to delete from staff table: ${staffDeleteError.message}` }, { status: 500 })  
    }  
  
    // Delete from users table  
    console.log('Deleting from users table...')  
    const { error: usersDeleteError } = await supabaseAdmin.from('users').delete().match({ id: userId })  
  
    if (usersDeleteError) {  
      console.error("Error deleting from users table:", usersDeleteError)  
      // Continue with auth deletion even if users table deletion fails  
    }  
  
    // Delete from auth  
    console.log('Deleting auth user...')  
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)  
  
    if (authError) {  
      console.error('Supabase auth error on delete:', authError)  
      return NextResponse.json({ error: authError.message }, { status: 400 })  
    }  
  
    console.log('User deleted successfully')  
    return NextResponse.json({ message: 'User deleted successfully' })  
  } catch (err) {  
    console.error('Unexpected error in DELETE:', err)  
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })  
  }  
}
