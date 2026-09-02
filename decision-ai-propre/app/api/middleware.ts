import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Routes publiques
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password']

// Routes protégées par rôle
const ROLE_ROUTES: Record<string, string[]> = {
    ADMIN: ['/dashboard/admin'],
    ANALYST: ['/dashboard/analyst', '/dashboard/admin'],
    USER: ['/dashboard/user'],
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Vérifier si la route est publique
    if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/_next') || pathname.includes('.')) {
        return NextResponse.next()
    }

    // Routes API protégées
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
        // API routes protégées par middleware
    }

    try {
        const supabase = await createClient()

        // Récupérer la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Récupérer le rôle de l'utilisateur
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (userError || !user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const role = user.role

        // Vérification des accès par rôle
        if (pathname.startsWith('/dashboard/admin') && role !== 'ADMIN') {
            return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url))
        }

        if (pathname.startsWith('/dashboard/analyst') && !['ADMIN', 'ANALYST'].includes(role)) {
            return NextResponse.redirect(new URL('/dashboard/user', request.url))
        }

        if (pathname.startsWith('/dashboard/user') && !['ADMIN', 'ANALYST', 'USER'].includes(role)) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        return NextResponse.next()

    } catch (error) {
        console.error('Middleware error:', error)
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public|api/webhook).*)',
    ],
}