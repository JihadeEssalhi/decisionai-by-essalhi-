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
    Sparkle, StarHalf, CircleDot, Circle, Square
} from 'lucide-react'

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ComposedChart, Line, Bar,
    PieChart as RePieChart, Pie, Cell, BarChart as ReBarChart,
    ReferenceLine
} from 'recharts'

// ============================================================
// TYPES
// ============================================================

interface Badge {
    id: string
    company_id: string
    user_id: string
    name: string
    description: string
    icon: string
    category: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    status: 'locked' | 'in_progress' | 'unlocked'
    progress_current: number
    progress_target: number
    progress_percentage: number
    unlocked_at?: string
    condition: string
    points: number
    users_count?: number
    created_at: string
    updated_at: string
    ai_tips?: string[]
    ai_insights?: any[]
}

interface BadgeSummary {
    totalBadges: number
    unlockedBadges: number
    lockedBadges: number
    inProgressBadges: number
    totalPoints: number
    lastUnlockedDate?: string
    rank: string
    rankLevel: number
    collectionPercentage: number
}

// ============================================================
// FONCTIONS UTILITAIRES GLOBALES
// ============================================================

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return 'N/A'
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    } catch {
        return 'N/A'
    }
}

// ============================================================
// COMPOSANTS
// ============================================================

const RarityBadge = ({ rarity }: { rarity: 'common' | 'rare' | 'epic' | 'legendary' }) => {
    const config = {
        common: { color: 'bg-gray-500/20 text-gray-400', label: 'Commun', icon: Circle },
        rare: { color: 'bg-blue-500/20 text-blue-400', label: 'Rare', icon: CircleDot },
        epic: { color: 'bg-purple-500/20 text-purple-400', label: 'Épique', icon: Star },
        legendary: { color: 'bg-amber-500/20 text-amber-400', label: 'Légendaire', icon: Crown }
    }
    const c = config[rarity]
    const Icon = c.icon
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${c.color}`}>
            <Icon size={10} />
            {c.label}
        </span>
    )
}

const StatusBadge = ({ status }: { status: 'locked' | 'in_progress' | 'unlocked' }) => {
    const config = {
        locked: { color: 'bg-gray-500/20 text-gray-400', label: '🔒 Verrouillé' },
        in_progress: { color: 'bg-yellow-500/20 text-yellow-400', label: '🔄 En cours' },
        unlocked: { color: 'bg-emerald-500/20 text-emerald-400', label: '✅ Obtenu' }
    }
    const c = config[status]
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full ${c.color}`}>
            {c.label}
        </span>
    )
}

const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
        target: TargetIcon,
        piggy: PiggyBank,
        rocket: Rocket,
        flag: Flag,
        star: Star,
        heart: Heart,
        coffee: CoffeeIcon,
        car: Car,
        home: HomeIcon,
        shopping: ShoppingBag,
        plane: Plane,
        graduation: GraduationCap,
        umbrella: Umbrella,
        battery: Battery,
        gift: GiftIcon,
        wallet: Wallet,
        trophy: Trophy,
        medal: Medal,
        crown: Crown,
        badge: Badge,
        gem: Gem,
        diamond: Diamond,
        sparkle: Sparkle,
        starhalf: StarHalf
    }
    return icons[iconName] || AwardIcon
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

export default function BadgesPage() {
    const router = useRouter()
    const supabase = createClient()

    // États principaux
    const [loading, setLoading] = useState(true)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    // Données réelles
    const [badges, setBadges] = useState<Badge[]>([])
    const [filteredBadges, setFilteredBadges] = useState<Badge[]>([])
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
    const [showDetailPanel, setShowDetailPanel] = useState(false)

    // Filtres
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [rarityFilter, setRarityFilter] = useState('all')

    // Vue
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    // Stats - calculées à partir des données réelles
    const [summary, setSummary] = useState<BadgeSummary>({
        totalBadges: 0,
        unlockedBadges: 0,
        lockedBadges: 0,
        inProgressBadges: 0,
        totalPoints: 0,
        rank: 'Apprenti',
        rankLevel: 1,
        collectionPercentage: 0
    })

    // IA Insights
    const [aiInsights, setAiInsights] = useState<any[]>([])
    const [nextBadgeToUnlock, setNextBadgeToUnlock] = useState<Badge | null>(null)

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

                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()

                if (companyError) throw new Error(companyError.message)
                setCompanyId(company.id)

                await fetchBadges(company.id)

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
    // 2. RÉCUPÉRATION DES BADGES RÉELS
    // ============================================================
    const fetchBadges = async (companyId: string) => {
        try {
            const { data: badgesData, error: badgesError } = await supabase
                .from('badges')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })

            if (badgesError) throw new Error(badgesError.message)

            setBadges(badgesData || [])
            setFilteredBadges(badgesData || [])

            calculateSummary(badgesData || [])
            generateAIInsights(badgesData || [])

        } catch (err: any) {
            console.error('Erreur chargement badges:', err)
            showToast('error', `❌ ${err.message || 'Erreur de chargement des badges'}`)
        }
    }

    // ============================================================
    // 3. CALCUL DES STATISTIQUES
    // ============================================================
    const calculateSummary = (data: Badge[]) => {
        if (!data || data.length === 0) {
            setSummary({
                totalBadges: 0,
                unlockedBadges: 0,
                lockedBadges: 0,
                inProgressBadges: 0,
                totalPoints: 0,
                rank: 'Apprenti',
                rankLevel: 1,
                collectionPercentage: 0
            })
            return
        }

        const unlocked = data.filter(b => b.status === 'unlocked')
        const locked = data.filter(b => b.status === 'locked')
        const inProgress = data.filter(b => b.status === 'in_progress')

        const totalPoints = unlocked.reduce((sum, b) => sum + b.points, 0)
        const collectionPercentage = data.length > 0 ? (unlocked.length / data.length) * 100 : 0

        // Déterminer le rang
        let rank = 'Apprenti'
        let rankLevel = 1
        if (collectionPercentage >= 90) { rank = 'Légende'; rankLevel = 5 }
        else if (collectionPercentage >= 70) { rank = 'Maître'; rankLevel = 4 }
        else if (collectionPercentage >= 50) { rank = 'Expert'; rankLevel = 3 }
        else if (collectionPercentage >= 30) { rank = 'Confirmé'; rankLevel = 2 }

        const lastUnlocked = unlocked.sort((a, b) =>
            new Date(b.unlocked_at || '').getTime() - new Date(a.unlocked_at || '').getTime()
        )[0]

        setSummary({
            totalBadges: data.length,
            unlockedBadges: unlocked.length,
            lockedBadges: locked.length,
            inProgressBadges: inProgress.length,
            totalPoints,
            lastUnlockedDate: lastUnlocked?.unlocked_at,
            rank,
            rankLevel,
            collectionPercentage
        })
    }

    // ============================================================
    // 4. GÉNÉRATION DES INSIGHTS IA
    // ============================================================
    const generateAIInsights = (data: Badge[]) => {
        if (!data || data.length === 0) return

        // Trouver le badge le plus proche d'être débloqué
        const inProgress = data.filter(b => b.status === 'in_progress')
        const sortedByProgress = inProgress.sort((a, b) => b.progress_percentage - a.progress_percentage)

        if (sortedByProgress.length > 0) {
            setNextBadgeToUnlock(sortedByProgress[0])
        }

        const insights = []

        // Insight sur la collection
        const unlockedCount = data.filter(b => b.status === 'unlocked').length
        insights.push({
            title: `📊 Collection: ${unlockedCount}/${data.length} badges`,
            description: `Vous avez débloqué ${((unlockedCount / data.length) * 100).toFixed(0)}% des badges disponibles`
        })

        // Insight sur le prochain badge
        if (sortedByProgress.length > 0) {
            insights.push({
                title: `🎯 Prochain badge: ${sortedByProgress[0].name}`,
                description: `Progression: ${sortedByProgress[0].progress_percentage.toFixed(0)}% - ${sortedByProgress[0].condition}`
            })
        }

        setAiInsights(insights)
    }

    // ============================================================
    // 5. FILTRES ET RECHERCHE
    // ============================================================
    useEffect(() => {
        if (!badges) return

        let result = [...badges]

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(b =>
                b.name.toLowerCase().includes(term) ||
                b.description.toLowerCase().includes(term) ||
                b.category.toLowerCase().includes(term)
            )
        }

        if (statusFilter !== 'all') {
            result = result.filter(b => b.status === statusFilter)
        }

        if (categoryFilter !== 'all') {
            result = result.filter(b => b.category === categoryFilter)
        }

        if (rarityFilter !== 'all') {
            result = result.filter(b => b.rarity === rarityFilter)
        }

        setFilteredBadges(result)

    }, [badges, searchTerm, statusFilter, categoryFilter, rarityFilter])

    // ============================================================
    // 6. RENDU
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-400 mx-auto" />
                    <p className="text-white/40 mt-4">Chargement des badges...</p>
                </div>
            </div>
        )
    }

    // Obtenir les catégories uniques
    const uniqueCategories = [...new Set(badges.map(b => b.category))]

    return (
        <div className="min-h-screen bg-[#03030b] text-white p-6">

            {/* ============================================================
            TOAST NOTIFICATIONS
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
                        <AwardIcon size={24} className="text-yellow-400" />
                        Badges
                    </h1>
                    <p className="text-sm text-white/40">
                        {summary.unlockedBadges}/{summary.totalBadges} badges · {summary.rank} (Niv. {summary.rankLevel})
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => {
                            if (badges.length > 0) {
                                generateAIInsights(badges)
                                showToast('success', '✅ Analyse IA terminée !')
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-violet-500/20"
                    >
                        <Brain size={16} />
                        Analyse IA
                        <Sparkles size={12} className="text-yellow-300" />
                    </button>
                </div>
            </div>

            {/* ============================================================
            INSIGHTS IA
            ============================================================ */}
            {aiInsights.length > 0 && (
                <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Brain size={18} className="text-violet-400" />
                            <h3 className="text-sm font-medium text-white/60">Analyse IA</h3>
                            <span className="text-[10px] text-white/30">
                                {badges.length} badges analysés
                            </span>
                        </div>
                        <button
                            onClick={() => generateAIInsights(badges)}
                            className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full transition flex items-center gap-1"
                        >
                            <RefreshCw size={10} /> Actualiser
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiInsights.map((insight, i) => (
                            <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                                <p className="text-[10px] text-emerald-400 font-medium">📊 {insight.title}</p>
                                <p className="text-xs text-white/60 mt-1">{insight.description}</p>
                            </div>
                        ))}
                    </div>

                    {nextBadgeToUnlock && (
                        <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                            <p className="text-[10px] text-amber-400 font-medium">🎯 Prochain badge à débloquer</p>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-sm text-white/80">{nextBadgeToUnlock.name}</span>
                                <span className="text-xs text-white/60">{nextBadgeToUnlock.progress_percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                                <div
                                    className="h-full rounded-full bg-amber-500"
                                    style={{ width: `${Math.min(nextBadgeToUnlock.progress_percentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================
            CARTES RÉSUMÉ
            ============================================================ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Badges obtenus</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.unlockedBadges}</p>
                    <p className="text-[10px] text-white/30">sur {summary.totalBadges} disponibles</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Collection</p>
                    <p className="text-2xl font-bold text-white mt-1">{summary.collectionPercentage.toFixed(0)}%</p>
                    <p className="text-[10px] text-white/30">{summary.inProgressBadges} en cours</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Points</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">{summary.totalPoints}</p>
                    <p className="text-[10px] text-white/30">Rang: {summary.rank}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Dernier badge</p>
                    <p className="text-sm font-bold text-white mt-1">{summary.lastUnlockedDate ? formatDate(summary.lastUnlockedDate) : 'Aucun'}</p>
                </div>
            </div>

            {/* ============================================================
            BARRE DE RECHERCHE ET FILTRES
            ============================================================ */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher un badge..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Tous statuts</option>
                            <option value="unlocked">Obtenus</option>
                            <option value="in_progress">En cours</option>
                            <option value="locked">Verrouillés</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Toutes catégories</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <select
                            value={rarityFilter}
                            onChange={(e) => setRarityFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Toutes raretés</option>
                            <option value="common">Commun</option>
                            <option value="rare">Rare</option>
                            <option value="epic">Épique</option>
                            <option value="legendary">Légendaire</option>
                        </select>

                        <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'text-white/30 hover:text-white/60'}`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'text-white/30 hover:text-white/60'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
            GRILLE DES BADGES
            ============================================================ */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredBadges.length > 0 ? (
                        filteredBadges.map((badge) => {
                            const Icon = getIcon(badge.icon)
                            const isUnlocked = badge.status === 'unlocked'
                            const isInProgress = badge.status === 'in_progress'

                            return (
                                <div
                                    key={badge.id}
                                    className={`bg-white/5 border rounded-2xl p-4 transition cursor-pointer ${isUnlocked ? 'border-emerald-500/30 hover:border-emerald-500/50' :
                                            isInProgress ? 'border-yellow-500/30 hover:border-yellow-500/50' :
                                                'border-white/10 hover:border-white/30'
                                        }`}
                                    onClick={() => {
                                        setSelectedBadge(badge)
                                        setShowDetailPanel(true)
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-3 rounded-xl ${isUnlocked ? 'bg-emerald-500/20' :
                                                isInProgress ? 'bg-yellow-500/20' :
                                                    'bg-gray-500/10'
                                            }`}>
                                            <Icon size={28} className={isUnlocked ? 'text-emerald-400' : 'text-white/30'} />
                                        </div>
                                        <RarityBadge rarity={badge.rarity} />
                                    </div>

                                    <h3 className="text-sm font-medium text-white/80">{badge.name}</h3>
                                    <p className="text-[10px] text-white/30 mt-1 line-clamp-2">{badge.description}</p>

                                    <div className="mt-3 space-y-2">
                                        <StatusBadge status={badge.status} />

                                        {isInProgress && (
                                            <div className="mt-2">
                                                <div className="flex justify-between text-[10px] text-white/40">
                                                    <span>Progression</span>
                                                    <span>{badge.progress_percentage.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-white/10 rounded-full h-1.5 mt-0.5">
                                                    <div
                                                        className="h-full rounded-full bg-yellow-500"
                                                        style={{ width: `${Math.min(badge.progress_percentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {isUnlocked && badge.unlocked_at && (
                                            <p className="text-[10px] text-white/30">
                                                Obtenu le {formatDate(badge.unlocked_at)}
                                            </p>
                                        )}

                                        {badge.points > 0 && (
                                            <p className="text-[10px] text-yellow-400">+{badge.points} pts</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="col-span-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <AwardIcon size={32} className="text-white/20" />
                                <p className="text-white/40 text-sm font-medium">Aucun badge trouvé</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Vue liste
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Badge</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Catégorie</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Rareté</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Statut</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">Points</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">Progression</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBadges.map((badge) => {
                                    const Icon = getIcon(badge.icon)
                                    const isUnlocked = badge.status === 'unlocked'

                                    return (
                                        <tr
                                            key={badge.id}
                                            className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                                            onClick={() => {
                                                setSelectedBadge(badge)
                                                setShowDetailPanel(true)
                                            }}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Icon size={16} className={isUnlocked ? 'text-emerald-400' : 'text-white/30'} />
                                                    <span className={`text-sm font-medium ${isUnlocked ? 'text-white/80' : 'text-white/40'}`}>
                                                        {badge.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white/40">{badge.category}</td>
                                            <td className="px-4 py-3"><RarityBadge rarity={badge.rarity} /></td>
                                            <td className="px-4 py-3"><StatusBadge status={badge.status} /></td>
                                            <td className="px-4 py-3 text-right text-yellow-400">{badge.points}</td>
                                            <td className="px-4 py-3 text-right">
                                                {badge.status === 'in_progress' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-sm text-white/60">{badge.progress_percentage.toFixed(0)}%</span>
                                                        <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-yellow-500"
                                                                style={{ width: `${Math.min(badge.progress_percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : badge.status === 'unlocked' ? (
                                                    <span className="text-emerald-400">✅ Obtenu</span>
                                                ) : (
                                                    <span className="text-white/30">🔒 Verrouillé</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================
            PANEL DE DÉTAIL
            ============================================================ */}
            {showDetailPanel && selectedBadge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {(() => {
                                    const Icon = getIcon(selectedBadge.icon)
                                    return <Icon size={24} className={selectedBadge.status === 'unlocked' ? 'text-emerald-400' : 'text-white/30'} />
                                })()}
                                {selectedBadge.name}
                            </h2>
                            <button onClick={() => setShowDetailPanel(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Statut</p>
                                <StatusBadge status={selectedBadge.status} />
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Rareté</p>
                                <RarityBadge rarity={selectedBadge.rarity} />
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Points</p>
                                <p className="text-sm font-medium text-yellow-400">+{selectedBadge.points} pts</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Catégorie</p>
                                <p className="text-sm text-white/80">{selectedBadge.category}</p>
                            </div>
                            {selectedBadge.unlocked_at && (
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-[10px] text-white/30">Obtenu le</p>
                                    <p className="text-sm text-white/80">{formatDate(selectedBadge.unlocked_at)}</p>
                                </div>
                            )}
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Condition</p>
                                <p className="text-sm text-white/80">{selectedBadge.condition}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-[10px] text-white/30">Description</p>
                            <p className="text-sm text-white/80 mt-1">{selectedBadge.description}</p>
                        </div>

                        {selectedBadge.status === 'in_progress' && (
                            <div className="bg-white/5 rounded-xl p-4 mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white/40">Progression</span>
                                    <span className="text-white/60">{selectedBadge.progress_percentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-yellow-500"
                                        style={{ width: `${Math.min(selectedBadge.progress_percentage, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs mt-2">
                                    <span className="text-white/30">Objectif: {selectedBadge.progress_target}</span>
                                    <span className="text-white/30">Actuel: {selectedBadge.progress_current}</span>
                                </div>
                            </div>
                        )}

                        {selectedBadge.ai_tips && selectedBadge.ai_tips.length > 0 && (
                            <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb size={16} className="text-yellow-400" />
                                    <h3 className="text-sm font-medium text-white/60">Conseils IA</h3>
                                </div>
                                <ul className="space-y-1">
                                    {selectedBadge.ai_tips.map((tip, i) => (
                                        <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                                            <span className="text-yellow-400">💡</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition">
                                <Share2 size={14} /> Partager
                            </button>
                            <button
                                onClick={() => setShowDetailPanel(false)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition ml-auto"
                            >
                                <Eye size={14} /> Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}