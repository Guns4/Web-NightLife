import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth Callback Route
 * Handles OAuth and Email OTP verification callbacks from Supabase
 */

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user to check role
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        // Redirect owners to their dashboard
        if (profile && (profile.role === "owner" || profile.role === "admin")) {
          return NextResponse.redirect(`${origin}/dashboard/owner`);
        }
      }

      // Redirect to home or requested page
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
