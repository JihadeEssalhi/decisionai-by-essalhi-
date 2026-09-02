'use client'

import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    User, Edit, Save, LogOut, X, Loader2, CheckCircle, AlertCircle,
    Camera, Shield as ShieldIcon, Key, Fingerprint, Moon, Sun,
    Award, Trophy, Star, Building2, Settings as SettingsIcon,
    ShieldAlert, ChevronRight, UserIcon, Crown as CrownIcon,
    Upload, Image as ImageIcon
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface UserProfile {
    id: string
    email: string
    full_name: string
    avatar_url?: string
    phone?: string
    whatsapp?: string
    birth_date?: string
    preferred_language: string
    timezone: string
    role?: string
    department?: string
    company_name?: string
    email_verified: boolean
    phone_verified: boolean
    two_factor_enabled: boolean
    theme: 'light' | 'dark'
    currency: string
    date_format: string
    report_detail_level: 'summary' | 'detailed'
    gamification_score: number
    gamification_level: number
    created_at: string
    updated_at: string
}

// ============================================================
// COMPOSANTS
// ============================================================

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'warning' | 'info'; onClose: () => void }) => {
    const colors: Record<'success' | 'error' | 'warning' | 'info', string> = {
        success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        error: 'bg-red-500/10 border-red-500/30 text-red-400',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    }

    return (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl backdrop-blur-xl border ${colors[type]}`}>
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <p className="text-sm font-medium">{message}</p>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition">
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}

// ============================================================
// COMPOSANT D'UPLOAD DE PHOTO
// ============================================================

const AvatarUpload = ({
    currentAvatar,
    onUpload,
    isUploading,
    userId,
    onToast
}: {
    currentAvatar?: string;
    onUpload: (url: string) => void;
    isUploading: boolean;
    userId: string;
    onToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            onToast('warning', '⚠️ Veuillez sélectionner une image')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            onToast('warning', '⚠️ L\'image ne doit pas dépasser 5MB')
            return
        }

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const publicUrl = urlData.publicUrl

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId)

            if (updateError) throw updateError

            onUpload(publicUrl)
            onToast('success', '✅ Photo de profil mise à jour !')

        } catch (err: any) {
            console.error('Erreur upload:', err)
            onToast('error', `❌ ${err.message || 'Erreur lors de l\'upload'}`)
        }
    }

    return (
        <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                {currentAvatar ? (
                    <img
                        src={currentAvatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <User size={40} className="text-white/60" />
                )}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-white" />
                        <span className="text-[8px] text-white/60 mt-1">Upload...</span>
                    </div>
                )}
            </div>

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-500 hover:bg-blue-600 transition border-2 border-[#03030b] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Camera size={14} className="text-white" />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                />
            </button>
        </div>
    )
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ProfilePage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [user, setUser] = useState<any>(null)
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)

    const [editForm, setEditForm] = useState({
        full_name: '',
        phone: '',
        whatsapp: '',
        birth_date: '',
        preferred_language: 'fr',
        timezone: 'Africa/Casablanca',
        role: '',
        department: '',
        company_name: '',
        theme: 'dark' as 'light' | 'dark',
        currency: 'MAD',
        date_format: 'DD/MM/YYYY',
        report_detail_level: 'detailed' as 'summary' | 'detailed'
    })

    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        new_password: '',
        confirm_password: ''
    })
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [show2FAModal, setShow2FAModal] = useState(false)

    // ============================================================
    // FONCTION TOAST
    // ============================================================
    const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 5000)
    }

    // ============================================================
    // RÉCUPÉRATION DES DONNÉES RÉELLES
    // ============================================================
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }
                setUser(user)

                // ✅ Récupérer le profil depuis la base de données
                const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profileError && profileError.code !== 'PGRST116') {
                    throw new Error(profileError.message)
                }

                if (profileData) {
                    // ✅ Profil existant - toutes les données viennent de la base
                    setProfile(profileData)
                    setEditForm({
                        full_name: profileData.full_name || '',
                        phone: profileData.phone || '',
                        whatsapp: profileData.whatsapp || '',
                        birth_date: profileData.birth_date || '',
                        preferred_language: profileData.preferred_language || 'fr',
                        timezone: profileData.timezone || 'Africa/Casablanca',
                        role: profileData.role || '',          // ✅ Rôle réel
                        department: profileData.department || '', // ✅ Département réel
                        company_name: profileData.company_name || '',
                        theme: profileData.theme || 'dark',
                        currency: profileData.currency || 'MAD',
                        date_format: profileData.date_format || 'DD/MM/YYYY',
                        report_detail_level: profileData.report_detail_level || 'detailed'
                    })
                } else {
                    // ✅ Créer un nouveau profil avec les données de l'utilisateur
                    const newProfile = {
                        id: user.id,
                        email: user.email || '',
                        full_name: user.user_metadata?.full_name || '',
                        preferred_language: 'fr',
                        timezone: 'Africa/Casablanca',
                        theme: 'dark',
                        currency: 'MAD',
                        date_format: 'DD/MM/YYYY',
                        report_detail_level: 'detailed',
                        gamification_score: 0,
                        gamification_level: 1,
                        email_verified: user.email_confirmed_at ? true : false,
                        phone_verified: false,
                        two_factor_enabled: false,
                        created_at: user.created_at || new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }

                    const { error: insertError } = await supabase
                        .from('user_profiles')
                        .insert(newProfile)

                    if (insertError) {
                        if (insertError.code === '23505') {
                            const { data: retryData } = await supabase
                                .from('user_profiles')
                                .select('*')
                                .eq('id', user.id)
                                .single()

                            if (retryData) {
                                setProfile(retryData)
                                setEditForm({
                                    full_name: retryData.full_name || '',
                                    phone: retryData.phone || '',
                                    whatsapp: retryData.whatsapp || '',
                                    birth_date: retryData.birth_date || '',
                                    preferred_language: retryData.preferred_language || 'fr',
                                    timezone: retryData.timezone || 'Africa/Casablanca',
                                    role: retryData.role || '',
                                    department: retryData.department || '',
                                    company_name: retryData.company_name || '',
                                    theme: retryData.theme || 'dark',
                                    currency: retryData.currency || 'MAD',
                                    date_format: retryData.date_format || 'DD/MM/YYYY',
                                    report_detail_level: retryData.report_detail_level || 'detailed'
                                })
                                setLoading(false)
                                return
                            }
                        }
                        throw new Error(insertError.message)
                    }

                    setProfile(newProfile as UserProfile)
                }

            } catch (err: any) {
                console.error('Erreur:', err)
                showToast('error', `❌ ${err.message || 'Erreur de chargement'}`)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // ============================================================
    // SAUVEGARDER LE PROFIL
    // ============================================================
    const saveProfile = async () => {
        if (!profile) return

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    full_name: editForm.full_name,
                    phone: editForm.phone,
                    whatsapp: editForm.whatsapp,
                    birth_date: editForm.birth_date,
                    preferred_language: editForm.preferred_language,
                    timezone: editForm.timezone,
                    role: editForm.role,
                    department: editForm.department,
                    company_name: editForm.company_name,
                    theme: editForm.theme,
                    currency: editForm.currency,
                    date_format: editForm.date_format,
                    report_detail_level: editForm.report_detail_level,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id)

            if (error) throw new Error(error.message)

            setProfile(prev => prev ? { ...prev, ...editForm } : null)
            setIsEditing(false)
            showToast('success', '✅ Profil mis à jour avec succès !')

        } catch (err: any) {
            console.error('Erreur sauvegarde:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la sauvegarde'}`)
        }
    }

    // ============================================================
    // CHANGER LE MOT DE PASSE
    // ============================================================
    const changePassword = async () => {
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            showToast('warning', '⚠️ Les mots de passe ne correspondent pas')
            return
        }

        if (passwordForm.new_password.length < 6) {
            showToast('warning', '⚠️ Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        setIsUpdatingPassword(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordForm.new_password
            })

            if (error) throw new Error(error.message)

            setShowPasswordModal(false)
            setPasswordForm({ new_password: '', confirm_password: '' })
            showToast('success', '✅ Mot de passe modifié avec succès !')

        } catch (err: any) {
            console.error('Erreur changement mot de passe:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors du changement de mot de passe'}`)
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    // ============================================================
    // TOGGLE 2FA
    // ============================================================
    const toggle2FA = async () => {
        if (!profile) return

        try {
            const newValue = !profile.two_factor_enabled
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    two_factor_enabled: newValue,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id)

            if (error) throw new Error(error.message)

            setProfile(prev => prev ? { ...prev, two_factor_enabled: newValue } : null)
            setShow2FAModal(false)
            showToast('success', `✅ 2FA ${newValue ? 'activé' : 'désactivé'} avec succès !`)

        } catch (err: any) {
            console.error('Erreur 2FA:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la mise à jour'}`)
        }
    }

    // ============================================================
    // HANDLE UPLOAD
    // ============================================================
    const handleAvatarUpload = (url: string) => {
        if (profile) {
            setProfile({ ...profile, avatar_url: url })
        }
    }

    // ============================================================
    // RENDU
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-400 mx-auto" />
                    <p className="text-white/40 mt-4">Chargement du profil...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#03030b] text-white p-6">

            {/* ============================================================
            TOAST
            ============================================================ */}
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            {/* ============================================================
            EN-TÊTE
            ============================================================ */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <User size={24} className="text-blue-400" />
                        Profil
                    </h1>
                    <p className="text-sm text-white/40">
                        Gérez vos informations personnelles et préférences
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20"
                        >
                            <Edit size={16} />
                            Modifier le profil
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={saveProfile}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                            >
                                <Save size={16} />
                                Enregistrer
                            </button>
                        </>
                    )}
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut()
                            router.push('/login')
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm"
                    >
                        <LogOut size={16} />
                        Déconnexion
                    </button>
                </div>
            </div>

            {/* ============================================================
            PHOTO + INFO PRINCIPALES
            ============================================================ */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">

                    {profile && (
                        <AvatarUpload
                            currentAvatar={profile.avatar_url}
                            onUpload={handleAvatarUpload}
                            isUploading={isUploading}
                            userId={profile.id}
                            onToast={showToast}
                        />
                    )}

                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">
                            {profile?.full_name || 'Utilisateur'}
                        </h2>
                        {/* ✅ Rôle et département réels depuis la base de données */}
                        <p className="text-sm text-white/40">
                            {profile?.role || 'Aucun rôle'} · {profile?.department || 'Aucun département'}
                        </p>
                        <p className="text-sm text-white/40">{profile?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${profile?.email_verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {profile?.email_verified ? '✅ Email vérifié' : '⏳ En attente'}
                            </span>
                            <span className="text-xs text-white/30">•</span>
                            <span className="text-xs text-white/30">
                                Membre depuis {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                }) : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
            GRILLE DES INFORMATIONS
            ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* INFORMATIONS PERSONNELLES */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                        <User size={16} className="text-blue-400" />
                        Informations personnelles
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-white/30">Nom complet</p>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-0.5"
                                />
                            ) : (
                                <p className="text-sm text-white/70">{profile?.full_name || 'Non renseigné'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-white/30">Email</p>
                            <p className="text-sm text-white/70">{profile?.email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-white/30">Téléphone</p>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="+2126XXXXXXXX"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-0.5"
                                />
                            ) : (
                                <p className="text-sm text-white/70">{profile?.phone || 'Non renseigné'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-white/30">WhatsApp</p>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={editForm.whatsapp}
                                    onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                                    placeholder="+2126XXXXXXXX"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-0.5"
                                />
                            ) : (
                                <p className="text-sm text-white/70">{profile?.whatsapp || 'Non configuré'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-white/30">Date de naissance</p>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={editForm.birth_date}
                                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-0.5"
                                />
                            ) : (
                                <p className="text-sm text-white/70">{profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('fr-FR') : 'Non renseigné'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* INFORMATIONS PROFESSIONNELLES */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                        <Building2 size={16} className="text-emerald-400" />
                        Informations professionnelles
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-white/30">Poste / Fonction</p>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    placeholder="Ex: Directeur Financier"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-0.5"
                                />
                            ) : (
                                <p className="text-sm text-white/70">{profile?.role || 'Non renseigné'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-white/30">Département / Service</p>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.department}
                                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                    placeholder="Ex: Finance"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-0.5"
                                />
                            ) : (
                                <p className="text-sm text-white/70">{profile?.department || 'Non renseigné'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-white/30">Entreprise</p>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.company_name}
                                    onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                                    placeholder="Nom de votre entreprise"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-0.5"
                                />
                            ) : (
                                <p className="text-sm text-white/70">{profile?.company_name || 'Non renseigné'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* SÉCURITÉ DU COMPTE */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                        <ShieldIcon size={16} className="text-violet-400" />
                        Sécurité du compte
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                        >
                            <div className="flex items-center gap-3">
                                <Key size={16} className="text-blue-400" />
                                <span className="text-sm text-white/70">Modifier le mot de passe</span>
                            </div>
                            <ChevronRight size={16} className="text-white/30" />
                        </button>
                        <button
                            onClick={() => setShow2FAModal(true)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                        >
                            <div className="flex items-center gap-3">
                                <Fingerprint size={16} className="text-violet-400" />
                                <span className="text-sm text-white/70">Authentification à deux facteurs</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${profile?.two_factor_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                    {profile?.two_factor_enabled ? 'Activé' : 'Désactivé'}
                                </span>
                                <ChevronRight size={16} className="text-white/30" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* PRÉFÉRENCES */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                        <SettingsIcon size={16} className="text-amber-400" />
                        Préférences
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-white/30">Thème</p>
                            {isEditing ? (
                                <div className="flex gap-2 mt-0.5">
                                    <button
                                        onClick={() => setEditForm({ ...editForm, theme: 'dark' })}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${editForm.theme === 'dark' ? 'border-blue-500 bg-blue-500/20' : 'border-white/10'}`}
                                    >
                                        <Moon size={14} /> Sombre
                                    </button>
                                    <button
                                        onClick={() => setEditForm({ ...editForm, theme: 'light' })}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${editForm.theme === 'light' ? 'border-blue-500 bg-blue-500/20' : 'border-white/10'}`}
                                    >
                                        <Sun size={14} /> Clair
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-white/70">{profile?.theme === 'dark' ? 'Sombre' : 'Clair'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-white/30">Devise par défaut</p>
                            {isEditing ? (
                                <select
                                    value={editForm.currency}
                                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-0.5"
                                >
                                    <option value="MAD">MAD - Dirham Marocain</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="USD">USD - Dollar</option>
                                </select>
                            ) : (
                                <p className="text-sm text-white/70">{profile?.currency || 'MAD'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-white/30">Format de date</p>
                            {isEditing ? (
                                <select
                                    value={editForm.date_format}
                                    onChange={(e) => setEditForm({ ...editForm, date_format: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-0.5"
                                >
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                </select>
                            ) : (
                                <p className="text-sm text-white/70">{profile?.date_format || 'DD/MM/YYYY'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-white/30">Niveau de détail des rapports IA</p>
                            {isEditing ? (
                                <select
                                    value={editForm.report_detail_level}
                                    onChange={(e) => setEditForm({ ...editForm, report_detail_level: e.target.value as any })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-0.5"
                                >
                                    <option value="summary">📊 Résumé</option>
                                    <option value="detailed">📋 Détaillé</option>
                                </select>
                            ) : (
                                <p className="text-sm text-white/70">{profile?.report_detail_level === 'detailed' ? 'Détaillé' : 'Résumé'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* GAMIFICATION */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                        <Award size={16} className="text-yellow-400" />
                        Gamification
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                            <div>
                                <p className="text-xs text-white/30">Niveau</p>
                                <p className="text-lg font-bold text-white">Niveau {profile?.gamification_level || 1}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-white/30">Score</p>
                                <p className="text-lg font-bold text-yellow-400">{profile?.gamification_score || 0} pts</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONFIDENTIALITÉ */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-red-400" />
                        Confidentialité et données
                    </h3>
                    <div className="space-y-2">
                        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
                            <span className="text-sm text-white/70">📥 Exporter mes données</span>
                            <ChevronRight size={16} className="text-white/30" />
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
                            <span className="text-sm text-white/70">🔒 Gérer les permissions</span>
                            <ChevronRight size={16} className="text-white/30" />
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition border border-red-500/20">
                            <span className="text-sm text-red-400">🗑️ Supprimer mon compte</span>
                            <ChevronRight size={16} className="text-red-400/50" />
                        </button>
                    </div>
                </div>

            </div>

            {/* ============================================================
            MODAL CHANGER LE MOT DE PASSE
            ============================================================ */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Key size={20} className="text-blue-400" />
                                Modifier le mot de passe
                            </h2>
                            <button onClick={() => setShowPasswordModal(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-white/60">Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    placeholder="Au moins 6 caractères"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-white/60">Confirmer le mot de passe</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirm_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    placeholder="Confirmez votre mot de passe"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 px-4 py-2 text-sm text-white/60 hover:text-white transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={changePassword}
                                disabled={isUpdatingPassword}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                            >
                                {isUpdatingPassword ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Modification...
                                    </>
                                ) : (
                                    'Modifier'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
            MODAL 2FA
            ============================================================ */}
            {show2FAModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Fingerprint size={20} className="text-violet-400" />
                                Authentification à deux facteurs
                            </h2>
                            <button onClick={() => setShow2FAModal(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                                <p className="text-sm text-white/70">
                                    L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.
                                </p>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                <span className="text-sm text-white/70">État actuel</span>
                                <span className={`text-sm font-medium ${profile?.two_factor_enabled ? 'text-emerald-400' : 'text-gray-400'}`}>
                                    {profile?.two_factor_enabled ? '✅ Activé' : '⛔ Désactivé'}
                                </span>
                            </div>
                            <button
                                onClick={toggle2FA}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:opacity-90 transition"
                            >
                                {profile?.two_factor_enabled ? 'Désactiver' : 'Activer'} l'authentification à deux facteurs
                            </button>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setShow2FAModal(false)}
                                className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}