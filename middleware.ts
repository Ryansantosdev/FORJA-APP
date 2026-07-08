import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase ainda não configurado: manda tudo para /login,
  // que exibe as instruções de configuração.
  if (!url || !anonKey) {
    if (request.nextUrl.pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verificação LOCAL da sessão (lê o cookie, sem chamada de rede) para não
  // atrasar cada navegação. Isso é proteção de UX: a segurança real está nas
  // policies RLS do banco — sem sessão válida, nenhuma query retorna dados.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isLogin = request.nextUrl.pathname === "/login";
  const isOnboarding = request.nextUrl.pathname === "/onboarding";

  if (!session && !isLogin && !isOnboarding) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // tudo, exceto assets estáticos e rotas de API (protegidas individualmente)
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)",
  ],
};
