"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail, CheckCircle, ArrowLeft, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/utils/validators";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [emailValid, setEmailValid] = useState<boolean | null>(null);

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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('verified')) {
            setSuccessMessage('✅ Email vérifié avec succès ! Vous pouvez vous connecter.');
        }
        if (params.get('reset')) {
            setSuccessMessage('✅ Mot de passe réinitialisé avec succès !');
        }
    }, []);

    const getOrCreateUserProfile = async (userId: string, userEmail: string, userMetadata: any) => {
        try {
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (profile) {
                console.log('✅ Profil trouvé:', profile);
                return profile;
            }

            console.log('⚠️ Profil non trouvé, création en cours...');

            const fullName = userMetadata?.full_name || userEmail?.split('@')[0] || 'Utilisateur';

            const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert({
                    id: userId,
                    email: userEmail,
                    full_name: fullName,
                    role: 'USER',
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (createError) {
                console.error('❌ Erreur création profil:', createError);
                throw new Error('Erreur lors de la création du profil: ' + createError.message);
            }

            console.log('✅ Profil créé avec succès:', newProfile);
            return newProfile;

        } catch (error) {
            console.error('❌ Erreur getOrCreateUserProfile:', error);
            throw error;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (!validateEmail(email)) {
            setError('Email invalide');
            setLoading(false);
            return;
        }

        try {
            console.log('🔐 Tentative de connexion pour:', email);

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (signInError) {
                console.error('❌ Erreur signIn:', signInError);

                if (signInError.message === 'Invalid login credentials') {
                    throw new Error('Email ou mot de passe incorrect. Vérifiez vos identifiants.');
                }
                if (signInError.message === 'Email not confirmed') {
                    throw new Error('Veuillez confirmer votre email avant de vous connecter.');
                }
                throw new Error(signInError.message);
            }

            if (!data.user) {
                throw new Error('Erreur lors de la connexion');
            }

            console.log('✅ Utilisateur connecté:', data.user.id);

            if (!data.user.email_confirmed_at) {
                throw new Error('Veuillez confirmer votre email avant de vous connecter.');
            }

            const profile = await getOrCreateUserProfile(
                data.user.id,
                data.user.email!,
                data.user.user_metadata
            );

            console.log('✅ Profil récupéré:', profile);

            // ✅ REDIRIGER VERS LE FORMULAIRE D'ONBOARDING
            const { data: company } = await supabase
                .from('companies')
                .select('onboarding_status, profile_completed, data_sources_connected')
                .eq('user_id', data.user.id)
                .maybeSingle();

            // ✅ Redirection vers le formulaire au lieu du chat
            if (!company || company.onboarding_status !== 'completed') {
                console.log('📍 Redirection vers le formulaire d\'onboarding');
                window.location.href = '/onboarding/form';
                return;
            }

            console.log('📍 Redirection vers le dashboard');
            window.location.href = '/dashboard';

        } catch (err: any) {
            console.error('❌ Erreur login:', err);
            setError(err.message || 'Erreur lors de la connexion');
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

            <div className="absolute inset-0 bg-gradient-to-br from-[#03030b]/70 via-[#0a0a1a]/60 to-[#1a1a3e]/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#03030b]/30 via-transparent to-[#03030b]/30" />

            <div className="absolute top-[-30%] left-[-10%] w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-30%] right-[-10%] w-[700px] h-[700px] bg-violet-600/20 rounded-full blur-[120px]" />

            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
            }} />

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

            <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 md:p-10 shadow-2xl shadow-violet-600/40">

                <div className="absolute top-4 left-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors group text-sm"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span>Retour</span>
                    </Link>
                </div>

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

                <div className="text-center mb-3">
                    <span className="text-xs text-white/50 font-medium tracking-[0.2em] uppercase">— Bienvenue —</span>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Connexion</h1>
                    <p className="text-sm text-white/60 mt-1">Accédez à votre espace DecisionAI</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">

                    {successMessage && (
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2.5 text-xs text-green-300 flex items-center gap-2">
                            <CheckCircle size={16} />
                            {successMessage}
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-medium text-white/60 block mb-1.5">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setEmailValid(validateEmail(e.target.value));
                                }}
                                required
                                className="w-full bg-white/15 border border-white/20 rounded-lg pl-11 pr-14 py-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/20"
                                placeholder="vous@example.com"
                            />
                            {email && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {emailValid ? (
                                        <CheckCircle size={20} className="text-blue-400" />
                                    ) : (
                                        <XCircle size={20} className="text-red-400" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-white/60 block mb-1.5">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-white/15 border border-white/20 rounded-lg pl-11 pr-12 py-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/20"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors p-1.5 rounded-full hover:bg-blue-400/15 active:bg-blue-400/25"
                            >
                                {showPassword ? <EyeOff size={22} className="text-blue-400" /> : <Eye size={22} className="text-blue-400" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link
                            href="/forgot-password"
                            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors hover:underline underline-offset-2"
                        >
                            Mot de passe oublié ?
                        </Link>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2.5 text-xs text-red-300 animate-in fade-in slide-in-from-top-2 duration-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !emailValid}
                        className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-semibold text-base rounded-lg py-4 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-600/40 hover:shadow-blue-600/60 group"
                    >
                        {loading ? (
                            <span className="inline-block h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Se connecter</span>
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-white/50">
                    Pas encore de compte ?{" "}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium inline-flex items-center gap-1 group">
                        Créer un compte
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </p>

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