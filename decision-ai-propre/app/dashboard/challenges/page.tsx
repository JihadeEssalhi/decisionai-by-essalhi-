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
    Target as TargetIcon, PiggyBank, Share2
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

interface Challenge {
    id: string
    company_id: string
    user_id: string
    name: string
    description: string
    icon: string
    target: number
    current_progress: number
    progress_percentage: number
    start_date: string
    end_date: string
    status: 'upcoming' | 'active' | 'completed' | 'failed'
    difficulty: 'easy' | 'medium' | 'hard'
    category: string
    reward_points: number
    reward_badge?: string
    participants: string[]
    created_at: string
    updated_at: string
    ai_tips?: string[]
    ai_insights?: any[]
    ai_recommendations?: any[]
}

interface ChallengeSummary {
    totalActive: number
    totalCompleted: number
    totalFailed: number
    successRate: number
    totalPoints: number
    totalParticipants: number
}

interface LeaderboardEntry {
    user_id: string
    user_name: string
    points: number
    badges: string[]
    completed_challenges: number
    rank: number
}

// ============================================================
// FONCTIONS UTILITAIRES GLOBALES
// ============================================================

const formatCurrency = (value: number) => {
    if (!value && value !== 0) return '0,00 MAD'
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD'
}

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

const getDaysRemaining = (endDate: string) => {
    if (!endDate) return 0
    const now = new Date()
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
}

// ============================================================
// COMPOSANTS
// ============================================================

const StatusBadge = ({ status }: { status: 'upcoming' | 'active' | 'completed' | 'failed' }) => {
    const config = {
        upcoming: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: '📅 À venir' },
        active: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: '🔄 En cours' },
        completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: '✅ Réussi' },
        failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: '❌ Échoué' }
    }
    const c = config[status]
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${c.color}`}>
            {c.label}
        </span>
    )
}

const DifficultyBadge = ({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
    const config = {
        easy: { color: 'bg-emerald-500/20 text-emerald-400', label: '🟢 Facile' },
        medium: { color: 'bg-yellow-500/20 text-yellow-400', label: '🟡 Moyen' },
        hard: { color: 'bg-red-500/20 text-red-400', label: '🔴 Difficile' }
    }
    const c = config[difficulty]
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.color}`}>
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
        badge: Badge
    }
    return icons[iconName] || TargetIcon
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

export default function ChallengesPage() {
    const router = useRouter()
    const supabase = createClient()

    // États principaux
    const [loading, setLoading] = useState(true)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    // Données réelles
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([])
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
    const [showDetailPanel, setShowDetailPanel] = useState(false)
    const [showNewChallengeModal, setShowNewChallengeModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showLeaderboard, setShowLeaderboard] = useState(false)
    const [challengeIdToDelete, setChallengeIdToDelete] = useState<string | null>(null)

    // Filtres
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [difficultyFilter, setDifficultyFilter] = useState('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(9)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    // Stats - calculées à partir des données réelles
    const [summary, setSummary] = useState<ChallengeSummary>({
        totalActive: 0,
        totalCompleted: 0,
        totalFailed: 0,
        successRate: 0,
        totalPoints: 0,
        totalParticipants: 0
    })

    // Leaderboard - basé sur les données réelles
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

    // IA Insights - basés sur les données réelles
    const [aiInsights, setAiInsights] = useState<any[]>([])
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([])

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

                await fetchChallenges(company.id)

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
    // 2. RÉCUPÉRATION DES DÉFIS RÉELS
    // ============================================================
    const fetchChallenges = async (companyId: string) => {
        try {
            const { data: challengesData, error: challengesError } = await supabase
                .from('challenges')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })

            if (challengesError) throw new Error(challengesError.message)

            // Mettre à jour les statuts des défis en fonction de la date
            const now = new Date()
            const updatedChallenges = (challengesData || []).map(challenge => {
                const endDate = new Date(challenge.end_date)
                const startDate = new Date(challenge.start_date)

                if (challenge.status === 'upcoming' && startDate <= now) {
                    return { ...challenge, status: 'active' as const }
                }
                if (challenge.status === 'active' && endDate < now) {
                    if (challenge.progress_percentage >= 100) {
                        return { ...challenge, status: 'completed' as const }
                    }
                    return { ...challenge, status: 'failed' as const }
                }
                return challenge
            })

            setChallenges(updatedChallenges)
            setFilteredChallenges(updatedChallenges)

            calculateSummary(updatedChallenges)
            generateLeaderboard(updatedChallenges)

            if (updatedChallenges && updatedChallenges.length > 0) {
                const firstChallenge = updatedChallenges[0]
                setAiInsights(firstChallenge.ai_insights || [])
                setAiRecommendations(firstChallenge.ai_recommendations || [])
            }

        } catch (err: any) {
            console.error('Erreur chargement défis:', err)
            showToast('error', `❌ ${err.message || 'Erreur de chargement des défis'}`)
        }
    }

    // ============================================================
    // 3. CALCUL DES STATISTIQUES
    // ============================================================
    const calculateSummary = (data: Challenge[]) => {
        if (!data || data.length === 0) {
            setSummary({
                totalActive: 0,
                totalCompleted: 0,
                totalFailed: 0,
                successRate: 0,
                totalPoints: 0,
                totalParticipants: 0
            })
            return
        }

        const totalActive = data.filter(c => c.status === 'active').length
        const totalCompleted = data.filter(c => c.status === 'completed').length
        const totalFailed = data.filter(c => c.status === 'failed').length
        const totalFinished = totalCompleted + totalFailed
        const successRate = totalFinished > 0 ? (totalCompleted / totalFinished) * 100 : 0
        const totalPoints = data.reduce((sum, c) => sum + (c.status === 'completed' ? c.reward_points : 0), 0)
        const totalParticipants = data.reduce((sum, c) => sum + (c.participants ? c.participants.length : 0), 0)

        setSummary({
            totalActive,
            totalCompleted,
            totalFailed,
            successRate,
            totalPoints,
            totalParticipants
        })
    }

    // ============================================================
    // 4. GÉNÉRATION DU CLASSEMENT
    // ============================================================
    const generateLeaderboard = (data: Challenge[]) => {
        if (!data || data.length === 0) {
            setLeaderboard([])
            return
        }

        const userPoints: Record<string, { points: number; completed: number; badges: string[] }> = {}

        data.forEach(challenge => {
            if (challenge.status === 'completed' && challenge.participants) {
                challenge.participants.forEach(participantId => {
                    if (!userPoints[participantId]) {
                        userPoints[participantId] = { points: 0, completed: 0, badges: [] }
                    }
                    userPoints[participantId].points += challenge.reward_points
                    userPoints[participantId].completed += 1
                    if (challenge.reward_badge) {
                        userPoints[participantId].badges.push(challenge.reward_badge)
                    }
                })
            }
        })

        const leaderboardData = Object.entries(userPoints)
            .map(([userId, data]) => ({
                user_id: userId,
                user_name: `Utilisateur ${userId.slice(0, 6)}`,
                points: data.points,
                badges: data.badges,
                completed_challenges: data.completed,
                rank: 0
            }))
            .sort((a, b) => b.points - a.points)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1
            }))

        setLeaderboard(leaderboardData)
    }

    // ============================================================
    // 5. FILTRES ET RECHERCHE
    // ============================================================
    useEffect(() => {
        if (!challenges) return

        let result = [...challenges]

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(c =>
                c.name.toLowerCase().includes(term) ||
                c.description.toLowerCase().includes(term) ||
                c.category.toLowerCase().includes(term)
            )
        }

        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter)
        }

        if (categoryFilter !== 'all') {
            result = result.filter(c => c.category === categoryFilter)
        }

        if (difficultyFilter !== 'all') {
            result = result.filter(c => c.difficulty === difficultyFilter)
        }

        setFilteredChallenges(result)
        setCurrentPage(1)

    }, [challenges, searchTerm, statusFilter, categoryFilter, difficultyFilter])

    // ============================================================
    // 6. CRÉATION D'UN DÉFI
    // ============================================================
    const handleCreateChallenge = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!companyId || !userId) {
            showToast('error', '❌ Entreprise ou utilisateur non trouvé')
            return
        }

        const form = e.target as HTMLFormElement
        const formData = new FormData(form)

        const name = formData.get('name') as string
        const description = formData.get('description') as string
        const target = parseFloat(formData.get('target') as string) || 0
        const category = formData.get('category') as string
        const difficulty = formData.get('difficulty') as 'easy' | 'medium' | 'hard'
        const end_date = formData.get('end_date') as string
        const reward_points = parseFloat(formData.get('reward_points') as string) || 100
        const icon = formData.get('icon') as string || 'target'

        if (!name || !target || !end_date) {
            showToast('warning', '⚠️ Veuillez remplir tous les champs obligatoires')
            return
        }

        try {
            const now = new Date().toISOString()

            const challengeData = {
                company_id: companyId,
                user_id: userId,
                name: name.trim(),
                description: description?.trim() || '',
                icon: icon,
                target: target,
                current_progress: 0,
                progress_percentage: 0,
                start_date: now,
                end_date: new Date(end_date).toISOString(),
                status: 'upcoming' as const,
                difficulty: difficulty,
                category: category || 'Général',
                reward_points: reward_points,
                participants: [userId],
                created_at: now,
                updated_at: now,
                ai_tips: [],
                ai_insights: [],
                ai_recommendations: []
            }

            const { data, error } = await supabase
                .from('challenges')
                .insert([challengeData])
                .select()

            if (error) {
                console.error('❌ Erreur Supabase:', error)
                showToast('error', `❌ ${error.message || 'Erreur lors de la création'}`)
                return
            }

            showToast('success', `✅ Défi "${name}" créé avec succès !`)
            setShowNewChallengeModal(false)

            if (companyId) {
                await fetchChallenges(companyId)
            }

        } catch (err: any) {
            console.error('❌ Erreur création:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la création'}`)
        }
    }

    // ============================================================
    // 7. REJOINDRE UN DÉFI
    // ============================================================
    const joinChallenge = async (challengeId: string) => {
        if (!userId) {
            showToast('error', '❌ Utilisateur non trouvé')
            return
        }

        try {
            const challenge = challenges.find(c => c.id === challengeId)
            if (!challenge) {
                showToast('error', '❌ Défi non trouvé')
                return
            }

            if (challenge.participants?.includes(userId)) {
                showToast('warning', '⚠️ Vous participez déjà à ce défi')
                return
            }

            const updatedParticipants = [...(challenge.participants || []), userId]

            const { error } = await supabase
                .from('challenges')
                .update({
                    participants: updatedParticipants,
                    updated_at: new Date().toISOString()
                })
                .eq('id', challengeId)

            if (error) throw new Error(error.message)

            showToast('success', '✅ Vous avez rejoint le défi !')

            if (companyId) await fetchChallenges(companyId)

        } catch (err: any) {
            console.error('Erreur:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de l\'inscription'}`)
        }
    }

    // ============================================================
    // 8. SUPPRESSION D'UN DÉFI
    // ============================================================
    const handleDeleteChallenge = async () => {
        if (!challengeIdToDelete || !companyId) return

        try {
            const { error } = await supabase
                .from('challenges')
                .delete()
                .eq('id', challengeIdToDelete)
                .eq('company_id', companyId)

            if (error) throw new Error(error.message)

            showToast('success', '✅ Défi supprimé avec succès')
            setShowDeleteModal(false)
            setChallengeIdToDelete(null)

            if (companyId) await fetchChallenges(companyId)

        } catch (err: any) {
            console.error('Erreur suppression:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la suppression'}`)
        }
    }

    // ============================================================
    // 9. ANALYSE IA
    // ============================================================
    const generateAIInsights = async () => {
        if (!challenges || challenges.length === 0) {
            showToast('warning', '⚠️ Aucun défi disponible à analyser')
            return
        }

        try {
            const insights = []
            const recommendations = []

            const activeChallenges = challenges.filter(c => c.status === 'active')
            if (activeChallenges.length > 0) {
                const avgProgress = activeChallenges.reduce((sum, c) => sum + c.progress_percentage, 0) / activeChallenges.length
                insights.push({
                    title: `📊 Progression moyenne: ${avgProgress.toFixed(1)}%`,
                    description: `Sur ${activeChallenges.length} défi${activeChallenges.length > 1 ? 's' : ''} actif${activeChallenges.length > 1 ? 's' : ''}`
                })
            }

            const delayedChallenges = challenges.filter(c => {
                if (c.status !== 'active') return false
                const daysRemaining = getDaysRemaining(c.end_date)
                return daysRemaining < 7 && c.progress_percentage < 50
            })

            if (delayedChallenges.length > 0) {
                insights.push({
                    title: `⚠️ ${delayedChallenges.length} défi${delayedChallenges.length > 1 ? 's' : ''} en retard`,
                    description: `Ces défis sont à moins de 7 jours de l'échéance avec moins de 50% de progression`
                })
                recommendations.push({
                    title: 'Accélérer la progression',
                    description: `Concentrez-vous sur les défis: ${delayedChallenges.map(c => c.name).join(', ')}`
                })
            }

            const completedChallenges = challenges.filter(c => c.status === 'completed')
            if (completedChallenges.length > 0) {
                insights.push({
                    title: `🎉 ${completedChallenges.length} défi${completedChallenges.length > 1 ? 's' : ''} réussi${completedChallenges.length > 1 ? 's' : ''}`,
                    description: `Taux de réussite: ${(completedChallenges.length / challenges.length * 100).toFixed(0)}%`
                })
            }

            const failedChallenges = challenges.filter(c => c.status === 'failed')
            if (failedChallenges.length > 0) {
                insights.push({
                    title: `❌ ${failedChallenges.length} défi${failedChallenges.length > 1 ? 's' : ''} échoué${failedChallenges.length > 1 ? 's' : ''}`,
                    description: `Analyser les causes pour améliorer les prochains défis`
                })
                recommendations.push({
                    title: 'Analyser les échecs',
                    description: `Revoir les objectifs des défis: ${failedChallenges.map(c => c.name).join(', ')}`
                })
            }

            if (summary.successRate < 50 && challenges.length > 0) {
                recommendations.push({
                    title: 'Améliorer la stratégie',
                    description: `Le taux de réussite est de ${summary.successRate.toFixed(0)}%. Simplifiez les objectifs ou augmentez les délais.`
                })
            }

            if (challenges.length > 0) {
                const firstChallenge = challenges[0]
                await supabase
                    .from('challenges')
                    .update({
                        ai_insights: insights,
                        ai_recommendations: recommendations,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', firstChallenge.id)
            }

            setAiInsights(insights)
            setAiRecommendations(recommendations)

            showToast('success', `✅ Analyse IA terminée ! ${insights.length + recommendations.length} insights générés.`)

        } catch (err: any) {
            console.error('Erreur analyse IA:', err)
            showToast('error', '❌ Erreur lors de l\'analyse IA')
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
                    <p className="text-white/40 mt-4">Chargement des défis...</p>
                </div>
            </div>
        )
    }

    const totalPages = Math.max(1, Math.ceil(filteredChallenges.length / itemsPerPage))
    const paginatedChallenges = filteredChallenges.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const uniqueCategories = [...new Set(challenges.map(c => c.category))]

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
                        <Trophy size={24} className="text-yellow-400" />
                        Défis
                    </h1>
                    <p className="text-sm text-white/40">
                        {filteredChallenges.length} défi{filteredChallenges.length > 1 ? 's' : ''} · {summary.totalActive} actif{summary.totalActive > 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {leaderboard.length > 0 && (
                        <button
                            onClick={() => setShowLeaderboard(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-yellow-500/20"
                        >
                            <Crown size={16} />
                            Classement ({leaderboard.length})
                        </button>
                    )}

                    <button
                        onClick={() => setShowNewChallengeModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={16} />
                        Nouveau défi
                    </button>
                </div>
            </div>

            {/* ============================================================
            INSIGHTS IA
            ============================================================ */}
            {(aiInsights.length > 0 || aiRecommendations.length > 0) && (
                <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Brain size={18} className="text-violet-400" />
                            <h3 className="text-sm font-medium text-white/60">Analyse IA des défis</h3>
                            <span className="text-[10px] text-white/30">
                                {challenges.length} défi{challenges.length > 1 ? 's' : ''} analysé{challenges.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <button
                            onClick={generateAIInsights}
                            className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full transition flex items-center gap-1"
                        >
                            <RefreshCw size={10} /> Actualiser
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiInsights.length > 0 && (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                                <p className="text-[10px] text-emerald-400 font-medium">📊 Insights</p>
                                <ul className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                                    {aiInsights.map((insight, i) => (
                                        <li key={i} className="text-xs text-white/60">• {insight.title}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {aiRecommendations.length > 0 && (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                                <p className="text-[10px] text-amber-400 font-medium">💡 Recommandations</p>
                                <ul className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                                    {aiRecommendations.map((rec, i) => (
                                        <li key={i} className="text-xs text-white/60">• {rec.title}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================
            CARTES RÉSUMÉ - DONNÉES RÉELLES
            ============================================================ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Défis actifs</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{summary.totalActive}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Défis complétés</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.totalCompleted}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Taux de réussite</p>
                    <p className="text-2xl font-bold text-white mt-1">{summary.successRate.toFixed(0)}%</p>
                    <p className="text-[10px] text-white/30">{summary.totalFailed} échoué{summary.totalFailed > 1 ? 's' : ''}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Points cumulés</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">{summary.totalPoints}</p>
                    <p className="text-[10px] text-white/30">{summary.totalParticipants} participant{summary.totalParticipants > 1 ? 's' : ''}</p>
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
                            placeholder="Rechercher un défi..."
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
                            <option value="upcoming">À venir</option>
                            <option value="active">En cours</option>
                            <option value="completed">Réussi</option>
                            <option value="failed">Échoué</option>
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
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Toutes difficultés</option>
                            <option value="easy">Facile</option>
                            <option value="medium">Moyen</option>
                            <option value="hard">Difficile</option>
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
            GRILLE DES DÉFIS - DONNÉES RÉELLES
            ============================================================ */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedChallenges.length > 0 ? (
                        paginatedChallenges.map((challenge) => {
                            const Icon = getIcon(challenge.icon)
                            const daysRemaining = getDaysRemaining(challenge.end_date)
                            const isExpired = daysRemaining < 0 && challenge.status === 'active'
                            const displayStatus = isExpired ? 'failed' : challenge.status

                            return (
                                <div
                                    key={challenge.id}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-blue-500/30 hover:bg-white/10 transition cursor-pointer"
                                    onClick={() => {
                                        setSelectedChallenge(challenge)
                                        setShowDetailPanel(true)
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-blue-500/20">
                                                <Icon size={20} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-white/80">{challenge.name}</h3>
                                                <p className="text-[10px] text-white/30">{challenge.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <StatusBadge status={displayStatus} />
                                            <DifficultyBadge difficulty={challenge.difficulty} />
                                        </div>
                                    </div>

                                    <p className="text-xs text-white/40 line-clamp-2 mb-3">{challenge.description}</p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/40">Progression</span>
                                            <span className="text-white/60">{challenge.progress_percentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${challenge.progress_percentage >= 100 ? 'bg-emerald-500' :
                                                        challenge.progress_percentage > 70 ? 'bg-emerald-400' :
                                                            challenge.progress_percentage > 40 ? 'bg-yellow-400' :
                                                                challenge.progress_percentage > 0 ? 'bg-orange-400' :
                                                                    'bg-gray-500'
                                                    }`}
                                                style={{ width: `${Math.min(challenge.progress_percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs">
                                        <div>
                                            <span className="text-white/40">Objectif</span>
                                            <span className="text-white/60 ml-1">{challenge.target}</span>
                                        </div>
                                        <div>
                                            <span className="text-white/40">Récompense</span>
                                            <span className="text-yellow-400 ml-1">+{challenge.reward_points} pts</span>
                                        </div>
                                        <div>
                                            <span className={`${daysRemaining > 0 ? 'text-white/40' : 'text-red-400'}`}>
                                                {daysRemaining > 0 ? `${daysRemaining}j` : 'Terminé'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                                        {challenge.status === 'upcoming' && (
                                            <button
                                                className="flex-1 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition"
                                                onClick={() => joinChallenge(challenge.id)}
                                            >
                                                Rejoindre
                                            </button>
                                        )}
                                        {challenge.status === 'active' && (
                                            <button
                                                className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/30 transition"
                                                onClick={() => {
                                                    setSelectedChallenge(challenge)
                                                    setShowDetailPanel(true)
                                                }}
                                            >
                                                Voir progression
                                            </button>
                                        )}
                                        {challenge.status === 'completed' && (
                                            <button
                                                className="flex-1 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30 transition"
                                                onClick={() => {
                                                    setSelectedChallenge(challenge)
                                                    setShowDetailPanel(true)
                                                }}
                                            >
                                                🎉 Félicitations !
                                            </button>
                                        )}
                                        {challenge.status === 'failed' && (
                                            <button
                                                className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition"
                                                onClick={() => {
                                                    setSelectedChallenge(challenge)
                                                    setShowDetailPanel(true)
                                                }}
                                            >
                                                Voir détails
                                            </button>
                                        )}
                                        <button
                                            className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition"
                                            onClick={() => {
                                                setChallengeIdToDelete(challenge.id)
                                                setShowDeleteModal(true)
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="col-span-3 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <Trophy size={32} className="text-white/20" />
                                <p className="text-white/40 text-sm font-medium">Aucun défi trouvé</p>
                                <p className="text-white/20 text-xs">Commencez par créer votre premier défi</p>
                                <button
                                    onClick={() => setShowNewChallengeModal(true)}
                                    className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition"
                                >
                                    <Plus size={16} />
                                    Créer un défi
                                </button>
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
                                    <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Défi</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Statut</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Difficulté</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">Progression</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">Récompense</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedChallenges.map((challenge) => {
                                    const Icon = getIcon(challenge.icon)
                                    const daysRemaining = getDaysRemaining(challenge.end_date)
                                    const isExpired = daysRemaining < 0 && challenge.status === 'active'
                                    const displayStatus = isExpired ? 'failed' : challenge.status

                                    return (
                                        <tr
                                            key={challenge.id}
                                            className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                                            onClick={() => {
                                                setSelectedChallenge(challenge)
                                                setShowDetailPanel(true)
                                            }}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Icon size={16} className="text-blue-400" />
                                                    <span className="text-sm font-medium text-white/80">{challenge.name}</span>
                                                </div>
                                                <p className="text-[10px] text-white/30 ml-6">{challenge.category}</p>
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge status={displayStatus} /></td>
                                            <td className="px-4 py-3"><DifficultyBadge difficulty={challenge.difficulty} /></td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-sm text-white/60">{challenge.progress_percentage.toFixed(0)}%</span>
                                                    <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${challenge.progress_percentage >= 100 ? 'bg-emerald-500' :
                                                                    challenge.progress_percentage > 70 ? 'bg-emerald-400' :
                                                                        challenge.progress_percentage > 40 ? 'bg-yellow-400' :
                                                                            'bg-orange-400'
                                                                }`}
                                                            style={{ width: `${Math.min(challenge.progress_percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-yellow-400">{challenge.reward_points} pts</td>
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition"
                                                        onClick={() => {
                                                            setSelectedChallenge(challenge)
                                                            setShowDetailPanel(true)
                                                        }}
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition"
                                                        onClick={() => {
                                                            setChallengeIdToDelete(challenge.id)
                                                            setShowDeleteModal(true)
                                                        }}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {filteredChallenges.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 mt-4">
                    <div className="text-sm text-white/40">
                        {filteredChallenges.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredChallenges.length)} sur ${filteredChallenges.length}` : '0 défi'}
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white/70 focus:outline-none"
                        >
                            <option value={9}>9</option>
                            <option value={18}>18</option>
                            <option value={27}>27</option>
                        </select>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm text-white/40 px-2">{currentPage} / {totalPages || 1}</span>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
            PANEL DE DÉTAIL - DONNÉES RÉELLES
            ============================================================ */}
            {showDetailPanel && selectedChallenge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {(() => {
                                    const Icon = getIcon(selectedChallenge.icon)
                                    return <Icon size={20} className="text-blue-400" />
                                })()}
                                {selectedChallenge.name}
                            </h2>
                            <button onClick={() => setShowDetailPanel(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Statut</p>
                                <StatusBadge status={selectedChallenge.status} />
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Difficulté</p>
                                <DifficultyBadge difficulty={selectedChallenge.difficulty} />
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Récompense</p>
                                <p className="text-sm font-medium text-yellow-400">+{selectedChallenge.reward_points} pts</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Participants</p>
                                <p className="text-sm font-medium text-white">{selectedChallenge.participants?.length || 0}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-[10px] text-white/30">Description</p>
                            <p className="text-sm text-white/80 mt-1">{selectedChallenge.description}</p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-white/40">Progression</span>
                                <span className="text-white/60">{selectedChallenge.progress_percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${selectedChallenge.progress_percentage >= 100 ? 'bg-emerald-500' :
                                            selectedChallenge.progress_percentage > 70 ? 'bg-emerald-400' :
                                                selectedChallenge.progress_percentage > 40 ? 'bg-yellow-400' :
                                                    'bg-orange-400'
                                        }`}
                                    style={{ width: `${Math.min(selectedChallenge.progress_percentage, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs mt-2">
                                <span className="text-white/30">Objectif: {selectedChallenge.target}</span>
                                <span className="text-white/30">Actuel: {selectedChallenge.current_progress}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-[10px] text-white/30">Date de début</p>
                                <p className="text-sm text-white/80">{formatDate(selectedChallenge.start_date)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30">Date d'échéance</p>
                                <p className="text-sm text-white/80">{formatDate(selectedChallenge.end_date)}</p>
                                {getDaysRemaining(selectedChallenge.end_date) > 0 && (
                                    <p className="text-[10px] text-white/30 mt-1">
                                        {getDaysRemaining(selectedChallenge.end_date)} jours restants
                                    </p>
                                )}
                            </div>
                        </div>

                        {selectedChallenge.ai_tips && selectedChallenge.ai_tips.length > 0 && (
                            <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb size={16} className="text-yellow-400" />
                                    <h3 className="text-sm font-medium text-white/60">Conseils IA pour réussir</h3>
                                </div>
                                <ul className="space-y-1">
                                    {selectedChallenge.ai_tips.map((tip, i) => (
                                        <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                                            <span className="text-yellow-400">💡</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                            {selectedChallenge.status === 'upcoming' && (
                                <button
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition"
                                    onClick={() => joinChallenge(selectedChallenge.id)}
                                >
                                    <UserPlus size={14} /> Rejoindre
                                </button>
                            )}
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition">
                                <Share2 size={14} /> Partager
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetailPanel(false)
                                    setChallengeIdToDelete(selectedChallenge.id)
                                    setShowDeleteModal(true)
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition ml-auto"
                            >
                                <Trash2 size={14} /> Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
            MODAL NOUVEAU DÉFI
            ============================================================ */}
            {showNewChallengeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-emerald-400" />
                                Nouveau défi
                            </h2>
                            <button onClick={() => setShowNewChallengeModal(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateChallenge} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-white/60">Nom du défi *</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Ex: Réduire les dépenses de 10%"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Description</label>
                                <textarea
                                    name="description"
                                    rows={2}
                                    placeholder="Décrivez votre défi..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60">Objectif *</label>
                                    <input
                                        type="number"
                                        name="target"
                                        placeholder="1000"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60">Date d'échéance *</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60">Catégorie</label>
                                    <select
                                        name="category"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    >
                                        <option value="Finance">Finance</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Ventes">Ventes</option>
                                        <option value="RH">RH</option>
                                        <option value="Opérations">Opérations</option>
                                        <option value="Général">Général</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60">Difficulté</label>
                                    <select
                                        name="difficulty"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    >
                                        <option value="easy">Facile</option>
                                        <option value="medium">Moyen</option>
                                        <option value="hard">Difficile</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60">Points de récompense</label>
                                    <input
                                        type="number"
                                        name="reward_points"
                                        placeholder="100"
                                        defaultValue="100"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60">Icône</label>
                                    <select
                                        name="icon"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    >
                                        <option value="target">🎯 Objectif</option>
                                        <option value="piggy">🐷 Épargne</option>
                                        <option value="rocket">🚀 Croissance</option>
                                        <option value="flag">🏁 Défi</option>
                                        <option value="star">⭐ Performance</option>
                                        <option value="trophy">🏆 Compétition</option>
                                        <option value="medal">🥇 Mérite</option>
                                        <option value="crown">👑 Excellence</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowNewChallengeModal(false)}
                                    className="flex-1 px-4 py-2 text-sm text-white/60 hover:text-white transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                                >
                                    <Save size={18} />
                                    Créer le défi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================
            MODAL CLASSEMENT - DONNÉES RÉELLES
            ============================================================ */}
            {showLeaderboard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Crown size={20} className="text-yellow-400" />
                                Classement
                            </h2>
                            <button onClick={() => setShowLeaderboard(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        {leaderboard.length > 0 ? (
                            <div className="space-y-3">
                                {leaderboard.map((entry) => (
                                    <div
                                        key={entry.user_id}
                                        className={`flex items-center justify-between p-4 rounded-xl border ${entry.rank === 1 ? 'bg-yellow-500/10 border-yellow-500/30' :
                                                entry.rank === 2 ? 'bg-gray-400/10 border-gray-400/30' :
                                                    entry.rank === 3 ? 'bg-orange-500/10 border-orange-500/30' :
                                                        'bg-white/5 border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                                                        entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                                                            'bg-white/10 text-white/40'
                                                }`}>
                                                {entry.rank}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white/80">{entry.user_name}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {entry.badges.map((badge, i) => (
                                                        <span key={i} className="text-sm">{badge}</span>
                                                    ))}
                                                    <span className="text-xs text-white/30 ml-2">{entry.completed_challenges} défi{entry.completed_challenges > 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-yellow-400">{entry.points} pts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-white/40">
                                <Trophy size={32} className="mx-auto mb-3 opacity-20" />
                                <p>Aucun classement disponible</p>
                                <p className="text-xs text-white/20 mt-1">Complétez des défis pour apparaître dans le classement</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================
            MODAL SUPPRESSION
            ============================================================ */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-full bg-red-500/20">
                                <AlertTriangle size={24} className="text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Confirmer la suppression</h2>
                        </div>

                        <p className="text-white/60 text-sm mb-4">
                            Êtes-vous sûr de vouloir supprimer ce défi ? Cette action est irréversible.
                        </p>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                            <p className="text-xs text-red-400 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Toutes les données associées seront supprimées.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setChallengeIdToDelete(null)
                                }}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteChallenge}
                                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}