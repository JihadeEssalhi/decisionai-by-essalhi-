'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validatePassword } from '@/lib/utils/validators'
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react'

export function ResetPasswordForm() {
    const router = useRouter()
    const supabase = createClient()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [passwordValid, setPasswordValid] = useState<boolean | null>(null)
    const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null)

    useEffect(() => {
        // Vérifier que l'utilisateur a un token de réinitialisation valide
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession()
            if (!data.session) {
                setError('Lien de réinitialisation invalide ou expiré.')
            }
        }
        checkSession()
    }, [supabase.auth])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const passwordValidation = validatePassword(password)
        if (!passwordValidation.isValid) {
            setError(passwordValidation.errors[0])
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            setLoading(false)
            return
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            })

            if (updateError) {
                throw new Error(updateError.message)
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/login?reset=true')
            }, 3000)

        } catch (err: any) {
            setError(err.message || 'Erreur lors de la réinitialisation')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center">
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-white font-semibold text-lg">Mot de passe réinitialisé !</h3>
                    <p className="text-white/60 text-sm mt-1">
                        Votre mot de passe a été modifié avec succès.
                        <br />
                        Vous allez être redirigé vers la page de connexion.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2.5 text-xs text-red-300">
                    {error}
                </div>
            )}

            <div>
                <label className="text-xs font-medium text-white/60 block mb-1.5">
                    Nouveau mot de passe
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" size={18} />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setPasswordValid(validatePassword(e.target.value).isValid)
                        }}
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
                {password.length > 0 && (
                    <div className="mt-1.5">
                        {!passwordValid && (
                            <ul className="text-xs text-red-400 space-y-0.5">
                                {validatePassword(password).errors.map((err, i) => (
                                    <li key={i} className="flex items-center gap-1.5">
                                        <XCircle size={12} />
                                        {err}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            <div>
                <label className="text-xs font-medium text-white/60 block mb-1.5">
                    Confirmer le mot de passe
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" size={18} />
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            setPasswordsMatch(e.target.value === password && e.target.value.length > 0)
                        }}
                        required
                        className="w-full bg-white/15 border border-white/20 rounded-lg pl-11 pr-12 py-3.5 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/20"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {passwordsMatch === false && confirmPassword.length > 0 && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1.5">
                        <XCircle size={12} />
                        Les mots de passe ne correspondent pas
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={loading || !passwordValid || !passwordsMatch}
                className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-semibold text-base rounded-lg py-4 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-600/40"
            >
                {loading ? (
                    <span className="inline-block h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    'Réinitialiser le mot de passe'
                )}
            </button>
        </form>
    )
}