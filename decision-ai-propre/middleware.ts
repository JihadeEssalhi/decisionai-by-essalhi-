import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: any) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const {
        data: { session },
    } = await supabase.auth.getSession()

    const url = request.nextUrl.clone()
    const pathname = url.pathname

    // Pages publiques
    const isPublicPage = pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/reset-password')

    // Pages onboarding - ✅ Rediriger vers /onboarding/form
    const isOnboardingPage = pathname.startsWith('/onboarding')

    // Pages dashboard
    const isDashboardPage = pathname.startsWith('/dashboard')

    // Routes API et assets
    if (pathname.startsWith('/api') ||
        pathname.startsWith('/_next/static') ||
        pathname.startsWith('/_next/image') ||
        pathname === '/favicon.ico') {
        return response
    }

    // =====================================================
    // 1. UTILISATEUR NON CONNECTÉ
    // =====================================================
    if (!session) {
        if (isDashboardPage || isOnboardingPage) {
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
        return response
    }

    // =====================================================
    // 2. UTILISATEUR CONNECTÉ
    // =====================================================

    // Rediriger les pages auth
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        try {
            const { data: company } = await supabase
                .from('companies')
                .select('onboarding_status, profile_completed, name, sector, business_description')
                .eq('user_id', session.user.id)
                .maybeSingle()

            const isComplete = company &&
                company.onboarding_status === 'completed' &&
                company.profile_completed === true &&
                company.name &&
                company.sector &&
                company.business_description

            // ✅ Redirection vers le formulaire au lieu du chat
            if (!isComplete) {
                url.pathname = '/onboarding/form'
                return NextResponse.redirect(url)
            }

            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        } catch (error) {
            console.error('Middleware auth redirect error:', error)
            url.pathname = '/onboarding/form'
            return NextResponse.redirect(url)
        }
    }

    // =====================================================
    // 3. PROTECTION ONBOARDING
    // =====================================================
    if (isOnboardingPage) {
        try {
            const { data: company } = await supabase
                .from('companies')
                .select('onboarding_status, profile_completed, name, sector, business_description')
                .eq('user_id', session.user.id)
                .maybeSingle()

            const isComplete = company &&
                company.onboarding_status === 'completed' &&
                company.profile_completed === true &&
                company.name &&
                company.sector &&
                company.business_description

            if (isComplete) {
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
            return response
        } catch (error) {
            console.error('Middleware onboarding error:', error)
            return response
        }
    }

    // =====================================================
    // 4. PROTECTION DASHBOARD
    // =====================================================
    if (isDashboardPage) {
        try {
            const { data: company } = await supabase
                .from('companies')
                .select('onboarding_status, profile_completed, name, sector, business_description')
                .eq('user_id', session.user.id)
                .maybeSingle()

            const isComplete = company &&
                company.onboarding_status === 'completed' &&
                company.profile_completed === true &&
                company.name &&
                company.sector &&
                company.business_description

            // ✅ Redirection vers le formulaire au lieu du chat
            if (!isComplete) {
                console.log('🔴 Middleware: Onboarding non complété, redirection vers /onboarding/form')
                url.pathname = '/onboarding/form'
                return NextResponse.redirect(url)
            }

            return response
        } catch (error) {
            console.error('Middleware dashboard error:', error)
            url.pathname = '/onboarding/form'
            return NextResponse.redirect(url)
        }
    }

    // =====================================================
    // 5. PAGE D'ACCUEIL
    // =====================================================
    if (pathname === '/') {
        try {
            const { data: company } = await supabase
                .from('companies')
                .select('onboarding_status, profile_completed, name, sector, business_description')
                .eq('user_id', session.user.id)
                .maybeSingle()

            const isComplete = company &&
                company.onboarding_status === 'completed' &&
                company.profile_completed === true &&
                company.name &&
                company.sector &&
                company.business_description

            // ✅ Redirection vers le formulaire au lieu du chat
            if (!isComplete) {
                url.pathname = '/onboarding/form'
            } else {
                url.pathname = '/dashboard'
            }
            return NextResponse.redirect(url)
        } catch (error) {
            console.error('Middleware home redirect error:', error)
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}