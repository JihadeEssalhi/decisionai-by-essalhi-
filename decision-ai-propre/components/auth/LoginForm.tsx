'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateEmail } from '@/lib/utils/validators'
import { getDashboardRoute } from '@/lib/auth/types'
import { Eye, EyeOff, Mail, Lock, CheckCircle } from 'lucide-react'

export function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    useEffect(() => {
        if (searchParams.get('verified')) {
            setSuccessMessage('✅ Email vérifié avec succès ! Vous pouvez vous connecter.')
        }
        if (searchParams.get('reset')) {
            setSuccessMessage('✅ Mot de passe réinitialisé avec succès !')
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccessMessage(null)

        if (!validateEmail(email)) {
            setError('Email invalide')
            setLoading(false)
            return
        }

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                if (signInError.message === 'Invalid login credentials') {
                    throw new Error('Email ou mot de passe incorrect')
                }
                throw new Error(signInError.message)
            }

            if (!data.user) {
                throw new Error('Erreur lors de la connexion')
            }

            // Récupérer le profil utilisateur avec le rôle
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single()

            if (profileError || !profile) {
                throw new Error('Profil utilisateur non trouvé')
            }

            // Rediriger en fonction du rôle
            router.push(getDashboardRoute(profile.role))

        } catch (err: any) {
            setError(err.message || 'Erreur lors de la connexion')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {successMessage && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2.5 text-xs text-green-300 flex items-center gap-2">
                    <CheckCircle size={16} />
                    {successMessage}
                </div>
            )}

            <div>
                <label className="text-xs font-medium text-white/60 block mb-1.5">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" size={18} />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-white/15 border border-white/20 rounded-lg pl-11 pr-4 py-3.5 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/20"
                        placeholder="vous@example.com"
                    />
                </div>
            </div>

            <div>
                <label className="text-xs font-medium text-white/60 block mb-1.5">Mot de passe</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" size={18} />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-white/15 border border-white/20 rounded-lg pl-11 pr-12 py-3.5 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/20"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <a href="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors hover:underline underline-offset-2">
                    Mot de passe oublié ?
                </a>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2.5 text-xs text-red-300">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-semibold text-base rounded-lg py-4 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-600/40"
            >
                {loading ? (
                    <span className="inline-block h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    'Se connecter'
                )}
            </button>

            <p className="text-center text-sm text-white/40">
                Pas encore de compte ?{' '}
                <a href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                    Créer un compte
                </a>
            </p>
        </form>
    )
}