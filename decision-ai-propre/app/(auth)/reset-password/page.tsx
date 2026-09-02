"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/utils/validators";

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = createClient();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
    const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

    const backgroundImages = [
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&q=80',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80',
    ];

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Vérifier que l'utilisateur a un token de réinitialisation valide
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                setError('Lien de réinitialisation invalide ou expiré.');
            }
        };
        checkSession();
    }, [supabase.auth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.errors[0]);
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) {
                throw new Error(updateError.message);
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/login?reset=true');
            }, 3000);

        } catch (err: any) {
            setError(err.message || 'Erreur lors de la réinitialisation');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#03030b] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/10 border border-white/15 rounded-2xl p-8 md:p-10 backdrop-blur-xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 animate-pulse" />
                        <div className="text-center mt-2">
                            <div className="h-6 w-32 bg-white/20 rounded animate-pulse mx-auto" />
                            <div className="h-3 w-24 bg-white/10 rounded animate-pulse mx-auto mt-1" />
                        </div>
                    </div>
                    <div className="space-y-5">
                        <div>
                            <div className="h-4 w-12 bg-white/20 rounded animate-pulse mb-1.5" />
                            <div className="h-12 w-full bg-white/20 rounded animate-pulse" />
                        </div>
                        <div>
                            <div className="h-4 w-20 bg-white/20 rounded animate-pulse mb-1.5" />
                            <div className="h-12 w-full bg-white/20 rounded animate-pulse" />
                        </div>
                        <div className="h-12 w-full bg-gradient-to-r from-blue-500 to-violet-600 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">

            {/* Diaporama */}
            {backgroundImages.map((img, index) => (
                <div
                    key={index}
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
                    style={{
                        backgroundImage: `url('${img}')`,
                        opacity: index === currentImage ? 1 : 0,
                    }}
                />
            ))}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#03030b]/70 via-[#0a0a1a]/60 to-[#1a1a3e]/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#03030b]/30 via-transparent to-[#03030b]/30" />

            {/* Glows */}
            <div className="absolute top-[-30%] left-[-10%] w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-30%] right-[-10%] w-[700px] h-[700px] bg-violet-600/20 rounded-full blur-[120px]" />

            {/* Grille */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
            }} />

            {/* Indicateurs */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {backgroundImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentImage(index)}
                        className={`transition-all duration-300 rounded-full ${index === currentImage
                                ? 'w-8 h-1.5 bg-blue-400'
                                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'
                            }`}
                    />
                ))}
            </div>

            {/* Carte */}
            <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 md:p-10 shadow-2xl shadow-violet-600/40">

                {/* Bouton Retour */}
                <div className="absolute top-4 left-4">
                    <Link
                        href="/login"
                        className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors group text-sm"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span>Retour</span>
                    </Link>
                </div>

                {/* Logo */}
                <div className="flex flex-col items-center mb-6 mt-4">
                    <Link href="/" className="flex flex-col items-center gap-2 group">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
                            <img
                                src="/dai-logo.png"
                                alt="DAI Logo"
                                className="relative h-14 w-auto object-contain"
                            />
                        </div>
                    </Link>
                    <div className="text-center mt-1">
                        <span className="text-lg font-bold text-white tracking-tight">DecisionAI</span>
                        <span className="block text-[9px] font-medium text-blue-400 tracking-[0.3em] uppercase mt-0.5">BY ESSALHI</span>
                    </div>
                </div>

                {/* Titre */}
                <div className="text-center mb-3">
                    <span className="text-xs text-white/50 font-medium tracking-[0.2em] uppercase">— Nouveau mot de passe —</span>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Réinitialisation</h1>
                    <p className="text-sm text-white/60 mt-1">Choisissez un nouveau mot de passe</p>
                </div>

                {/* Formulaire */}
                {success ? (
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
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2.5 text-xs text-red-300">
                                {error}
                            </div>
                        )}

                        {/* Nouveau mot de passe */}
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
                                        setPassword(e.target.value);
                                        setPasswordValid(validatePassword(e.target.value).isValid);
                                    }}
                                    required
                                    className="w-full bg-white/15 border border-white/20 rounded-lg pl-11 pr-12 py-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/20"
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

                        {/* Confirmation mot de passe */}
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
                                        setConfirmPassword(e.target.value);
                                        setPasswordsMatch(e.target.value === password && e.target.value.length > 0);
                                    }}
                                    required
                                    className="w-full bg-white/15 border border-white/20 rounded-lg pl-11 pr-12 py-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/20"
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
                            {passwordsMatch === true && confirmPassword.length > 0 && (
                                <p className="text-xs text-green-400 mt-1 flex items-center gap-1.5">
                                    <CheckCircle size={12} />
                                    Les mots de passe correspondent
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !passwordValid || !passwordsMatch}
                            className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-semibold text-base rounded-lg py-4 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-600/40 hover:shadow-blue-600/60 group"
                        >
                            {loading ? (
                                <span className="inline-block h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Réinitialiser le mot de passe'
                            )}
                        </button>

                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 text-white/40 hover:text-white/60 transition-colors text-sm"
                        >
                            <ArrowLeft size={16} />
                            Retour à la connexion
                        </Link>
                    </form>
                )}

                {/* Footer */}
                <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-center gap-4 text-[10px] text-white/40">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-1 h-1 rounded-full bg-green-400/70" />
                        Sécurisé
                    </span>
                    <span className="w-px h-3 bg-white/10" />
                    <span>SSL Chiffré</span>
                    <span className="w-px h-3 bg-white/10" />
                    <span>2.0</span>
                </div>
            </div>
        </div>
    );
}