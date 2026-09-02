// app/api/auth/login/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email et mot de passe requis' },
                { status: 400 }
            )
        }

        // Créer le client Supabase
        const supabase = await createClient()

        // Récupérer l'utilisateur
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)

        if (userError) {
            console.error('User fetch error:', userError)
            return NextResponse.json(
                { error: 'Erreur lors de la recherche de l\'utilisateur' },
                { status: 500 }
            )
        }

        if (!users || users.length === 0) {
            return NextResponse.json(
                { error: 'Email ou mot de passe incorrect' },
                { status: 401 }
            )
        }

        const user = users[0]

        // Vérifier le mot de passe
        try {
            const isValidPassword = await bcrypt.compare(password, user.password)
            if (!isValidPassword) {
                return NextResponse.json(
                    { error: 'Email ou mot de passe incorrect' },
                    { status: 401 }
                )
            }
        } catch (bcryptError) {
            console.error('Bcrypt error:', bcryptError)
            return NextResponse.json(
                { error: 'Erreur lors de la vérification du mot de passe' },
                { status: 500 }
            )
        }

        // Créer une session
        const sessionId = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24)

        const { error: sessionError } = await supabase
            .from('sessions')
            .insert({
                id: sessionId,
                user_id: user.id,
                expires_at: expiresAt.toISOString(),
            })

        if (sessionError) {
            console.error('Session creation error:', sessionError)
            return NextResponse.json(
                { error: 'Erreur lors de la création de la session' },
                { status: 500 }
            )
        }

        // Définir le cookie de session
        const cookieStore = await cookies()
        cookieStore.set('session_id', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/',
        })

        // Mettre à jour last_login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
        })

    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la connexion' },
            { status: 500 }
        )
    }
}