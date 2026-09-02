'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateEmail, validatePassword, validateFullName } from '@/lib/utils/validators'
import { Eye, EyeOff, CheckCircle, XCircle, Mail, User, Lock } from 'lucide-react'

export function RegisterForm() {
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Validation en temps réel
    const [emailValid, setEmailValid] = useState<boolean | null>(null)
    const [passwordValid, setPasswordValid] = useState<boolean | null>(null)
    const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null)
    const [fullNameValid, setFullNameValid] = useState<boolean | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))

        // Validation en temps réel
        if (name === 'email') {
            setEmailValid(validateEmail(value))
        }
        if (name === 'fullName') {
            setFullNameValid(validateFullName(value))
        }
        if (name === 'password') {
            setPasswordValid(validatePassword(value).isValid)
        }
        if (name === 'password' || name === 'confirmPassword') {
            const match = name === 'password'
                ? value === formData.confirmPassword && value.length > 0
                : value === formData.password && value.length > 0
            setPasswordsMatch(match)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Validation
        if (!validateEmail(formData.email)) {
            setError('Email invalide')
            setLoading(false)
            return
        }

        const passwordValidation = validatePassword(formData.password)
        if (!passwordValidation.isValid) {
            setError(passwordValidation.errors[0])
            setLoading(false)
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            setLoading(false)
            return
        }

        try {
            // Créer l'utilisateur dans Supabase Auth
            // Le role sera automatiquement 'USER' via le trigger
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    },
                    emailRedirectTo: `${window.location.origin}/login?verified=true`,
                },
            })

            if (signUpError) {
                throw new Error(signUpError.message)
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/login?verified=true')
            }, 3000)

        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'inscription')
        } finally {
            setLoading(false)
        }
    }

    const getValidationIcon = (valid: boolean | null, className = 'w-4 h-4') => {
        if (valid === null) return null
        return valid ? (
            <CheckCircle className={`${className} text-green-400`} />
        ) : (
            <XCircle className={`${className} text-red-400`} />
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {success ? (
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-white font-semibold text-lg">Inscription réussie !</h3>
                    <p className="text-white/60 text-sm mt-1">
                        Un email de confirmation vous a été envoyé.
                        <br />
                        Vérifiez votre boîte mail.
                    </p>
                </div>
            ) : (
                <>
                    {/* Nom complet */}
                    <div>
                        <label className="text-xs font-medium text-white/60 block mb-1.5">
                            Nom complet
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" size={18} />
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="w-full bg-white/15 border border-white/20 rounded-lg pl-11 pr-10 py-3.5 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/20"
                                placeholder="Jean Dupont"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {getValidationIcon(fullNameValid)}
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-xs font-medium text-white/60 block mb-1.5">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" size={18} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-white/15 border border-white/20 rounded-lg pl-11 pr-10 py-3.5 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/20"
                                placeholder="vous@example.com"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {getValidationIcon(emailValid)}
                            </div>
                        </div>
                    </div>

                    {/* Mot de passe */}
                    <div>
                        <label className="text-xs font-medium text-white/60 block mb-1.5">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
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
                        {formData.password.length > 0 && (
                            <div className="mt-1.5">
                                {!passwordValid && (
                                    <ul className="text-xs text-red-400 space-y-0.5">
                                        {validatePassword(formData.password).errors.map((err, i) => (
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

                    {/* Confirmation mot de passe */}
                    <div>
                        <label className="text-xs font-medium text-white/60 block mb-1.5">
                            Confirmer le mot de passe
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" size={18} />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full bg-white/15 border border-white/20 rounded-lg pl-11 pr-10 py-3.5 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/20"
                                placeholder="••••••••"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {passwordsMatch !== null && getValidationIcon(passwordsMatch)}
                            </div>
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
                            'Créer mon compte'
                        )}
                    </button>

                    <p className="text-center text-sm text-white/40">
                        Déjà un compte ?{' '}
                        <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                            Se connecter
                        </a>
                    </p>
                </>
            )}
        </form>
    )
}