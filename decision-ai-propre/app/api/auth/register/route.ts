// app/api/auth/register/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { email, password, fullName } = await request.json()

        if (!email || !password || !fullName) {
            return NextResponse.json(
                { error: 'Tous les champs sont requis' },
                { status: 400 }
            )
        }

        // ✅ AJOUTER `await` ici car createClient() est async
        const supabase = await createClient()

        // Vérifier si l'utilisateur existe déjà
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 = no rows found, c'est normal
            console.error('Check error:', checkError)
        }

        if (existingUser) {
            return NextResponse.json(
                { error: 'Cet email est déjà utilisé' },
                { status: 400 }
            )
        }

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10)

        // Créer l'utilisateur avec rôle USER par défaut
        const { data: user, error: insertError } = await supabase
            .from('users')
            .insert({
                email,
                password: hashedPassword,
                full_name: fullName,
                role: 'USER',
                created_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (insertError) {
            console.error('Supabase insert error:', insertError)
            return NextResponse.json(
                { error: 'Erreur lors de l\'inscription' },
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
            console.error('Session error:', sessionError)
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
        }, { status: 201 })

    } catch (error) {
        console.error('Register error:', error)
        return NextResponse.json(
            { error: 'Erreur lors de l\'inscription' },
            { status: 500 }
        )
    }
}