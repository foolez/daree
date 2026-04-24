import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/create",
  "/record",
  "/challenge",
  "/profile"
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  let supabase;
  try {
    const { url, anon } = getPublicSupabaseEnv();
    supabase = createServerClient(url, anon, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        }
      }
    });
  } catch (err) {
    console.error("[middleware] Supabase config", err);
    return new NextResponse("Service configuration error", { status: 503 });
  }

  let user: { id: string } | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      user = data.user;
    }
  } catch (e) {
    console.error("[middleware] getUser", e);
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/|_vercel/|favicon|sw\\.js).*)"]
};
