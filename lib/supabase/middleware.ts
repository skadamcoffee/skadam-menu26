import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ========= Dashboard/Admin Protection =========
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  }

  // ========= Barista Protection =========
  // This rule must protect the /barista dashboard but EXCLUDE the /barista/login page.
  if (
    request.nextUrl.pathname.startsWith("/barista") &&
    request.nextUrl.pathname !== "/barista/login"
  ) {
    // If no user is logged in, redirect to the barista login page.
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/barista/login"
      return NextResponse.redirect(url)
    }

    // If a user is logged in, check their role.
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    // If the user is not a barista or an admin, redirect them to the home page.
    if (userData?.role !== "barista" && userData?.role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
