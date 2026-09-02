'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateEmail } from '@/lib/utils/validators'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export function ForgotPasswordForm() {
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!validateEmail(email)) {
            setError('Email invalide')
            setLoading(false)
            return
        }

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (resetError) {
                throw new Error(resetError.message)
            }

            setSuccess(true)

        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'envoi de l\'email')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center">
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-white font-semibold text-lg">Email envoyé !</h3>
                    <p className="text-white/60 text-sm mt-1">
                        Si un compte existe avec cet email, vous recevrez un lien
                        <br />
                        pour réinitialiser votre mot de passe.
                    </p>
                </div>
                <a href="/login" className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                    <ArrowLeft size={16} />
                    Retour à la connexion
                </a>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm text-white/40">
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

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
                    'Envoyer le lien'
                )}
            </button>

            <a href="/login" className="flex items-center justify-center gap-2 text-white/40 hover:text-white/60 transition-colors text-sm">
                <ArrowLeft size={16} />
                Retour à la connexion
            </a>
        </form>
    )
}