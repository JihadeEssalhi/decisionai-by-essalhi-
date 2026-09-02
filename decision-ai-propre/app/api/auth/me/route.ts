// app/api/auth/me/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    try {
        // Récupérer les cookies
        const cookieStore = await cookies()
        const sessionId = cookieStore.get('session_id')?.value

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            )
        }

        // Créer le client Supabase
        const supabase = await createClient()

        // Récupérer la session avec vérification
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('user_id, expires_at')
            .eq('id', sessionId)
            .single()

        if (sessionError) {
            console.error('Session error:', sessionError)
            return NextResponse.json(
                { error: 'Session invalide' },
                { status: 401 }
            )
        }

        if (!session) {
            return NextResponse.json(
                { error: 'Session non trouvée' },
                { status: 401 }
            )
        }

        // Vérifier l'expiration de la session
        const expiresAt = new Date(session.expires_at)
        const now = new Date()

        if (expiresAt < now) {
            return NextResponse.json(
                { error: 'Session expirée' },
                { status: 401 }
            )
        }

        // Récupérer l'utilisateur
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, full_name, role, created_at, last_login')
            .eq('id', session.user_id)
            .single()

        if (userError) {
            console.error('User error:', userError)
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 401 }
            )
        }

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 401 }
            )
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                created_at: user.created_at,
                last_login: user.last_login,
            }
        })

    } catch (error) {
        console.error('Me error:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des données' },
            { status: 500 }
        )
    }
}