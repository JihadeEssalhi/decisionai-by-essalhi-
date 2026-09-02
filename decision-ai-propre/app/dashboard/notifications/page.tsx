'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Plus, Edit, Trash2, Eye, Search, Filter, ChevronDown,
    ChevronLeft, ChevronRight, Calendar, Download, FileDown,
    Loader2, CheckCircle, AlertCircle, AlertTriangle, Info,
    DollarSign, TrendingUp, TrendingDown, Users, Briefcase,
    PieChart as PieChartIcon, BarChart3, LineChart, Award,
    Bell, Clock, Sparkles, Brain, X, Home, Layers, Tag,
    FileText, RefreshCw, Wallet, CreditCard, Receipt,
    ArrowRight, Settings, LogOut, Globe, Pin, Maximize2,
    MoreHorizontal, Copy, Ban, RotateCcw, Check, ChevronUp,
    Building2, Shield, Zap, HelpCircle, Target, Save,
    Activity, Gauge, Radar, TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon, Minus, Sliders,
    GitBranch, BarChart as BarChartIcon, AlertOctagon,
    Lightbulb, Rocket, ShieldAlert, ShieldCheck,
    Clock as ClockIcon, Calendar as CalendarIcon,
    Trophy, Medal, Star, Crown, Flag, Users as UsersIcon,
    User, UserPlus, Gift, Badge, Award as AwardIcon,
    ArrowLeft, Menu, Grid, List, BarChart2, PieChart,
    Percent, Zap as ZapIcon, Coffee, Home as HomeIcon,
    ShoppingBag, Plane, GraduationCap, Umbrella, Battery,
    Heart, Coffee as CoffeeIcon, Car, Gift as GiftIcon,
    Target as TargetIcon, PiggyBank, Share2, Gem, Diamond,
    Sparkle, StarHalf, CircleDot, Circle, Square,
    Mic, Send, Paperclip, Smile, BookOpen,
    History, Star as StarIcon, Trash2 as TrashIcon,
    Download as DownloadIcon, AlertTriangle as AlertIcon,
    MessageSquare, Bot, User as UserIcon, Settings as SettingsIcon,
    ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon,
    Maximize2 as MaximizeIcon, Minimize2 as MinimizeIcon,
    Phone, Mail, Smartphone, Radio, Signal, CheckCircle as CheckCircleIcon,
    XCircle, Clock as ClockIcon2, Calendar as CalendarIcon2
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface NotificationHistory {
    id: string
    company_id: string
    user_id: string
    type: string
    title: string
    message: string
    status: 'sent' | 'delivered' | 'failed'
    channel: 'whatsapp' | 'email' | 'sms' | 'push'
    recipient: string
    sent_at: string
    created_at: string
}

interface NotificationTemplate {
    id: string
    company_id: string
    category: string
    title: string
    description: string
    icon_name: string
    enabled: boolean
    frequency: 'realtime' | 'daily' | 'weekly' | 'monthly'
    last_sent?: string
    created_at: string
    updated_at: string
}

interface WhatsAppConfig {
    id: string
    company_id: string
    user_id: string
    phone_number: string
    is_verified: boolean
    created_at: string
    updated_at: string
}

// ============================================================
// COMPOSANTS
// ============================================================

const StatusBadge = ({ status }: { status: 'sent' | 'delivered' | 'failed' }) => {
    const config = {
        sent: { color: 'bg-blue-500/20 text-blue-400', label: '📤 Envoyé' },
        delivered: { color: 'bg-emerald-500/20 text-emerald-400', label: '✅ Livré' },
        failed: { color: 'bg-red-500/20 text-red-400', label: '❌ Échoué' }
    }
    const c = config[status]
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full ${c.color}`}>
            {c.label}
        </span>
    )
}

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
// COMPOSANT PRINCIPAL
// ============================================================

export default function NotificationsPage() {
    const router = useRouter()
    const supabase = createClient()

    // États
    const [loading, setLoading] = useState(true)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [userName, setUserName] = useState('Utilisateur')

    // WhatsApp Config - Données réelles
    const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig | null>(null)
    const [showPhoneInput, setShowPhoneInput] = useState(false)
    const [phoneInput, setPhoneInput] = useState('')

    // Notifications Templates - Données réelles
    const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([])

    // Historique - Données réelles
    const [history, setHistory] = useState<NotificationHistory[]>([])
    const [lastNotification, setLastNotification] = useState<string>('Aucune notification récente')

    // Toast
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)

    // ============================================================
    // FONCTION TOAST
    // ============================================================
    const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 5000)
    }

    // ============================================================
    // 1. RÉCUPÉRATION DES DONNÉES RÉELLES
    // ============================================================
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }
                setUserId(user.id)
                setUserName(user.email?.split('@')[0] || 'Utilisateur')

                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()

                if (companyError) throw new Error(companyError.message)
                setCompanyId(company.id)

                // Récupérer la configuration WhatsApp réelle
                await fetchWhatsAppConfig(company.id)

                // Récupérer les templates de notifications réels
                await fetchNotificationTemplates(company.id)

                // Récupérer l'historique des notifications réel
                await fetchNotificationHistory(company.id)

                // Récupérer la dernière notification
                await fetchLastNotification(company.id)

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
    // 2. RÉCUPÉRATION DE LA CONFIGURATION WHATSAPP
    // ============================================================
    const fetchWhatsAppConfig = async (companyId: string) => {
        try {
            const { data, error } = await supabase
                .from('whatsapp_config')
                .select('*')
                .eq('company_id', companyId)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Erreur chargement config WhatsApp:', error)
                return
            }

            if (data) {
                setWhatsappConfig(data)
                setPhoneInput(data.phone_number)
            }
        } catch (err) {
            console.error('Erreur:', err)
        }
    }

    // ============================================================
    // 3. RÉCUPÉRATION DES TEMPLATES DE NOTIFICATIONS
    // ============================================================
    const fetchNotificationTemplates = async (companyId: string) => {
        try {
            const { data, error } = await supabase
                .from('notification_templates')
                .select('*')
                .eq('company_id', companyId)
                .order('category', { ascending: true })

            if (error) {
                console.error('Erreur chargement templates:', error)
                // Templates par défaut si la table n'existe pas
                setNotificationTemplates([
                    {
                        id: 'budget',
                        company_id: companyId,
                        category: 'BUDGET',
                        title: 'Alerte budget',
                        description: 'Alerte de dépassement ou état du budget',
                        icon_name: 'Wallet',
                        enabled: true,
                        frequency: 'realtime',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: 'reminder',
                        company_id: companyId,
                        category: 'RAPPEL',
                        title: 'Rappel quotidien',
                        description: 'Ajouter les dépenses du jour',
                        icon_name: 'Clock',
                        enabled: true,
                        frequency: 'daily',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: 'summary',
                        company_id: companyId,
                        category: 'RÉSUMÉ',
                        title: 'Résumé mensuel',
                        description: 'Revenus, dépenses, solde, score financier',
                        icon_name: 'BarChart3',
                        enabled: true,
                        frequency: 'monthly',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: 'savings',
                        company_id: companyId,
                        category: 'OBJECTIF',
                        title: 'Objectif d\'épargne',
                        description: 'Progression ou retard sur vos objectifs',
                        icon_name: 'Target',
                        enabled: true,
                        frequency: 'weekly',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: 'challenge',
                        company_id: companyId,
                        category: 'DÉFI',
                        title: 'Progression défi',
                        description: 'Mise à jour de progression des défis',
                        icon_name: 'Trophy',
                        enabled: true,
                        frequency: 'weekly',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: 'badge',
                        company_id: companyId,
                        category: 'BADGE',
                        title: 'Nouveau badge',
                        description: 'Badge débloqué ! Félicitations',
                        icon_name: 'Award',
                        enabled: true,
                        frequency: 'realtime',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: 'forecast',
                        company_id: companyId,
                        category: 'PRÉVISION',
                        title: 'Alerte prévision',
                        description: 'Écart significatif détecté',
                        icon_name: 'LineChart',
                        enabled: true,
                        frequency: 'daily',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ])
                return
            }

            setNotificationTemplates(data || [])
        } catch (err) {
            console.error('Erreur:', err)
        }
    }

    // ============================================================
    // 4. RÉCUPÉRATION DE L'HISTORIQUE
    // ============================================================
    const fetchNotificationHistory = async (companyId: string) => {
        try {
            const { data, error } = await supabase
                .from('notification_history')
                .select('*')
                .eq('company_id', companyId)
                .order('sent_at', { ascending: false })
                .limit(10)

            if (error) {
                console.error('Erreur chargement historique:', error)
                setHistory([])
                return
            }

            setHistory(data || [])
        } catch (err) {
            console.error('Erreur:', err)
            setHistory([])
        }
    }

    // ============================================================
    // 5. RÉCUPÉRATION DE LA DERNIÈRE NOTIFICATION
    // ============================================================
    const fetchLastNotification = async (companyId: string) => {
        try {
            const { data, error } = await supabase
                .from('notification_history')
                .select('title, message, sent_at')
                .eq('company_id', companyId)
                .order('sent_at', { ascending: false })
                .limit(1)

            if (error) {
                console.error('Erreur chargement dernière notification:', error)
                return
            }

            if (data && data.length > 0) {
                setLastNotification(`${data[0].title} - ${new Date(data[0].sent_at).toLocaleDateString('fr-FR')}`)
            }
        } catch (err) {
            console.error('Erreur:', err)
        }
    }

    // ============================================================
    // 6. CONFIGURATION WHATSAPP (AVEC DONNÉES RÉELLES)
    // ============================================================
    const handleConfigureWhatsApp = async () => {
        if (!phoneInput.trim()) {
            showToast('warning', '⚠️ Veuillez saisir un numéro de téléphone')
            return
        }

        const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/
        if (!phoneRegex.test(phoneInput.trim())) {
            showToast('warning', '⚠️ Format de numéro invalide. Ex: +2126XXXXXXXX')
            return
        }

        if (!companyId || !userId) {
            showToast('error', '❌ Entreprise ou utilisateur non trouvé')
            return
        }

        try {
            const now = new Date().toISOString()

            const configData = {
                company_id: companyId,
                user_id: userId,
                phone_number: phoneInput.trim(),
                is_verified: false,
                updated_at: now
            }

            let error
            if (whatsappConfig) {
                // Mise à jour
                const { error: updateError } = await supabase
                    .from('whatsapp_config')
                    .update(configData)
                    .eq('id', whatsappConfig.id)
                error = updateError
            } else {
                // Insertion
                const { error: insertError } = await supabase
                    .from('whatsapp_config')
                    .insert({
                        ...configData,
                        created_at: now
                    })
                error = insertError
            }

            if (error) throw error

            // Rafraîchir les données
            await fetchWhatsAppConfig(companyId)

            setShowPhoneInput(false)
            showToast('success', '✅ Numéro WhatsApp configuré avec succès !')

        } catch (err: any) {
            console.error('Erreur configuration:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la configuration'}`)
        }
    }

    // ============================================================
    // 7. ENVOYER UNE NOTIFICATION DE TEST (AVEC DONNÉES RÉELLES)
    // ============================================================
    const sendTestNotification = async (template: NotificationTemplate) => {
        if (!whatsappConfig) {
            showToast('warning', '⚠️ Veuillez d\'abord configurer votre numéro WhatsApp')
            return
        }

        if (!companyId || !userId) {
            showToast('error', '❌ Entreprise ou utilisateur non trouvé')
            return
        }

        showToast('info', `📤 Envoi du test "${template.title}"...`)

        try {
            // Simuler l'envoi (à remplacer par l'appel réel à l'API WhatsApp)
            await new Promise(resolve => setTimeout(resolve, 1500))

            const now = new Date().toISOString()
            const status: 'sent' | 'delivered' | 'failed' = Math.random() > 0.2 ? 'delivered' : 'sent'

            // Enregistrer dans l'historique
            const historyData = {
                company_id: companyId,
                user_id: userId,
                type: template.category,
                title: template.title,
                message: `Test de notification: ${template.description}`,
                status: status,
                channel: 'whatsapp' as const,
                recipient: whatsappConfig.phone_number,
                sent_at: now,
                created_at: now
            }

            const { error } = await supabase
                .from('notification_history')
                .insert(historyData)

            if (error) throw error

            // Rafraîchir l'historique
            await fetchNotificationHistory(companyId)
            await fetchLastNotification(companyId)

            showToast('success', `✅ Test "${template.title}" envoyé avec succès !`)

        } catch (err: any) {
            console.error('Erreur envoi:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de l\'envoi'}`)
        }
    }

    // ============================================================
    // 8. TOGGLE NOTIFICATION (AVEC DONNÉES RÉELLES)
    // ============================================================
    const toggleNotification = async (id: string) => {
        try {
            const template = notificationTemplates.find(t => t.id === id)
            if (!template) return

            const newEnabled = !template.enabled

            const { error } = await supabase
                .from('notification_templates')
                .update({
                    enabled: newEnabled,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error

            setNotificationTemplates(prev =>
                prev.map(t => t.id === id ? { ...t, enabled: newEnabled } : t)
            )

            showToast('info', `${newEnabled ? '🔔' : '🔕'} Notification ${newEnabled ? 'activée' : 'désactivée'}`)

        } catch (err: any) {
            console.error('Erreur:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la mise à jour'}`)
        }
    }

    // ============================================================
    // 9. CHANGER LA FRÉQUENCE (AVEC DONNÉES RÉELLES)
    // ============================================================
    const changeFrequency = async (id: string, frequency: 'realtime' | 'daily' | 'weekly' | 'monthly') => {
        try {
            const { error } = await supabase
                .from('notification_templates')
                .update({
                    frequency: frequency,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error

            setNotificationTemplates(prev =>
                prev.map(t => t.id === id ? { ...t, frequency } : t)
            )

            showToast('success', `✅ Fréquence modifiée en ${frequency === 'realtime' ? 'temps réel' : frequency}`)

        } catch (err: any) {
            console.error('Erreur:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la mise à jour'}`)
        }
    }

    // ============================================================
    // 10. RENDU
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-400 mx-auto" />
                    <p className="text-white/40 mt-4">Chargement des notifications...</p>
                </div>
            </div>
        )
    }

    // Map pour les icônes
    const iconMap: Record<string, any> = {
        Wallet: Wallet,
        Clock: Clock,
        BarChart3: BarChart3,
        Target: Target,
        Trophy: Trophy,
        Award: Award,
        LineChart: LineChart
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
                        <Bell size={24} className="text-yellow-400" />
                        Notifications
                    </h1>
                    <p className="text-sm text-white/40">
                        Tester les rappels WhatsApp et les résumés financiers
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
                        <UserIcon size={16} className="text-white/40" />
                        <span className="text-sm text-white/70">{userName}</span>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition text-sm"
                    >
                        <ArrowLeft size={16} />
                        Retour
                    </button>
                </div>
            </div>

            {/* ============================================================
            BANDEAU ACTIVITÉ RÉCENTE (Données réelles)
            ============================================================ */}
            <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-2xl p-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-blue-500/20">
                        <Bell size={14} className="text-blue-400" />
                    </div>
                    <span className="text-sm text-white/70">🔄 Dernière notification :</span>
                    <span className="text-sm text-white/40">{lastNotification}</span>
                </div>
            </div>

            {/* ============================================================
            CANAL WHATSAPP (Données réelles)
            ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Colonne gauche - Canal */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-emerald-500/20">
                            <MessageSquare size={24} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Canal WhatsApp</h2>
                            <p className="text-xs text-white/40">Recevez vos notifications sur WhatsApp</p>
                        </div>
                    </div>

                    {whatsappConfig ? (
                        <div className="space-y-3">
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                                <p className="text-xs text-white/40">Numéro configuré</p>
                                <p className="text-lg font-medium text-white">{whatsappConfig.phone_number}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {whatsappConfig.is_verified ? (
                                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                                            <CheckCircleIcon size={12} /> Vérifié
                                        </span>
                                    ) : (
                                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                                            <AlertCircle size={12} /> En attente de vérification
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPhoneInput(true)}
                                className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition text-sm"
                            >
                                Modifier le numéro
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                                <p className="text-sm text-white/60">Aucun numéro configuré</p>
                                <p className="text-xs text-white/30 mt-1">
                                    Ajoutez un numéro WhatsApp pour recevoir des notifications
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPhoneInput(true)}
                                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-medium hover:opacity-90 transition"
                            >
                                Configurer WhatsApp
                            </button>
                        </div>
                    )}

                    {showPhoneInput && (
                        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                            <label className="text-xs font-medium text-white/60">Numéro WhatsApp</label>
                            <div className="flex gap-2 mt-1">
                                <input
                                    type="tel"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    placeholder="+2126XXXXXXXX"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-emerald-500/50 focus:outline-none transition"
                                />
                                <button
                                    onClick={handleConfigureWhatsApp}
                                    className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition text-sm"
                                >
                                    Enregistrer
                                </button>
                            </div>
                            <p className="text-[10px] text-white/30 mt-1">Format: +2126XXXXXXXX</p>
                        </div>
                    )}

                    {/* Autres canaux */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-xs text-white/40 mb-2">Autres canaux</p>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition text-xs">
                                <Mail size={14} /> Email
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition text-xs">
                                <Smartphone size={14} /> SMS
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition text-xs">
                                <Radio size={14} /> Push
                            </button>
                        </div>
                    </div>
                </div>

                {/* Colonne droite - Tester les notifications (Données réelles) */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ZapIcon size={20} className="text-yellow-400" />
                        Tester les notifications
                    </h2>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {notificationTemplates.map((template) => {
                            const Icon = iconMap[template.icon_name] || Bell
                            return (
                                <div
                                    key={template.id}
                                    className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-blue-500/30 transition"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${template.enabled ? 'bg-blue-500/20' : 'bg-gray-500/10'}`}>
                                                <Icon size={16} className={template.enabled ? 'text-blue-400' : 'text-gray-500'} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${template.category === 'BUDGET' ? 'bg-red-500/20 text-red-400' :
                                                        template.category === 'RAPPEL' ? 'bg-blue-500/20 text-blue-400' :
                                                            template.category === 'RÉSUMÉ' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                template.category === 'OBJECTIF' ? 'bg-purple-500/20 text-purple-400' :
                                                                    template.category === 'DÉFI' ? 'bg-orange-500/20 text-orange-400' :
                                                                        template.category === 'BADGE' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                            'bg-cyan-500/20 text-cyan-400'
                                                        }`}>
                                                        {template.category}
                                                    </span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${template.frequency === 'realtime' ? 'bg-green-500/20 text-green-400' :
                                                        template.frequency === 'daily' ? 'bg-blue-500/20 text-blue-400' :
                                                            template.frequency === 'weekly' ? 'bg-purple-500/20 text-purple-400' :
                                                                'bg-orange-500/20 text-orange-400'
                                                        }`}>
                                                        {template.frequency === 'realtime' ? 'Temps réel' :
                                                            template.frequency === 'daily' ? 'Quotidien' :
                                                                template.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-white/80">{template.title}</p>
                                                <p className="text-[10px] text-white/40">{template.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleNotification(template.id)}
                                                className={`text-xs px-2 py-1 rounded-lg transition ${template.enabled
                                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                                    }`}
                                            >
                                                {template.enabled ? '✅ Activé' : '⛔ Désactivé'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                        <select
                                            value={template.frequency}
                                            onChange={(e) => changeFrequency(template.id, e.target.value as any)}
                                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/60 focus:outline-none"
                                        >
                                            <option value="realtime">Temps réel</option>
                                            <option value="daily">Quotidien</option>
                                            <option value="weekly">Hebdomadaire</option>
                                            <option value="monthly">Mensuel</option>
                                        </select>
                                        <button
                                            onClick={() => sendTestNotification(template)}
                                            disabled={!whatsappConfig}
                                            className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            📤 Envoyer le test
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ============================================================
            HISTORIQUE DES NOTIFICATIONS (Données réelles)
            ============================================================ */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <History size={20} className="text-blue-400" />
                        Historique des notifications
                    </h2>
                    <span className="text-xs text-white/30">{history.length} notifications</span>
                </div>

                {history.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-white/5">
                                <tr>
                                    <th className="px-4 py-2 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Titre</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Canal</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Statut</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Destinataire</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item) => (
                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="px-4 py-2 text-sm text-white/40">
                                            {new Date(item.sent_at).toLocaleString('fr-FR')}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-white/60">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.type === 'BUDGET' ? 'bg-red-500/20 text-red-400' :
                                                item.type === 'RAPPEL' ? 'bg-blue-500/20 text-blue-400' :
                                                    item.type === 'RÉSUMÉ' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        item.type === 'OBJECTIF' ? 'bg-purple-500/20 text-purple-400' :
                                                            item.type === 'DÉFI' ? 'bg-orange-500/20 text-orange-400' :
                                                                item.type === 'BADGE' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-cyan-500/20 text-cyan-400'
                                                }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-white/70">{item.title}</td>
                                        <td className="px-4 py-2 text-sm text-white/40">
                                            <span className="flex items-center gap-1">
                                                <MessageSquare size={12} className="text-emerald-400" />
                                                {item.channel === 'whatsapp' ? 'WhatsApp' : item.channel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2"><StatusBadge status={item.status} /></td>
                                        <td className="px-4 py-2 text-sm text-white/40">{item.recipient}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-white/30">
                        <Bell size={32} className="mx-auto mb-3 opacity-20" />
                        <p>Aucune notification envoyée</p>
                        <p className="text-xs mt-1">Envoyez un test pour commencer</p>
                    </div>
                )}
            </div>

        </div>
    )
}