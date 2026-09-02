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
    Building2, Shield, Zap, HelpCircle, Target, Save, Gift,
    PiggyBank, Rocket, Flag, Star, Heart, Coffee, Car,
    Home as HomeIcon, ShoppingBag, Plane, GraduationCap,
    Umbrella, Battery, TrendingUp as TrendingUpIcon
} from 'lucide-react'

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ComposedChart, Line, Bar,
    PieChart as RePieChart, Pie, Cell, BarChart as ReBarChart
} from 'recharts'

// ============================================================
// TYPES
// ============================================================

interface SavingsGoal {
    id: string
    company_id: string
    user_id: string
    name: string
    description?: string
    icon: string
    target_amount: number
    current_amount: number
    remaining_amount: number
    progress_percentage: number
    deadline: string
    status: 'in_progress' | 'achieved' | 'delayed' | 'paused'
    category: string
    priority: 'low' | 'medium' | 'high'
    monthly_recommended: number
    estimated_completion: string
    created_at: string
    updated_at: string
    contributions?: Contribution[]
    ai_insights?: any[]
    ai_recommendations?: any[]
    ai_analyzed_at?: string
}

interface Contribution {
    id: string
    goal_id: string
    amount: number
    date: string
    source: string
    description?: string
    created_at: string
}

interface SavingsSummary {
    totalSaved: number
    totalTarget: number
    activeGoals: number
    achievedGoals: number
    delayedGoals: number
    pausedGoals: number
    globalProgress: number
    totalRemaining: number
}

// ============================================================
// COMPOSANTS
// ============================================================

const StatusBadge = ({ status }: { status: 'in_progress' | 'achieved' | 'delayed' | 'paused' }) => {
    const config = {
        in_progress: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: '🔄 En cours' },
        achieved: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: '✅ Atteint' },
        delayed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: '⚠️ En retard' },
        paused: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: '⏸️ En pause' }
    }
    const c = config[status]
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${c.color}`}>
            {c.label}
        </span>
    )
}

const ProgressBar = ({ value, status }: { value: number; status: 'in_progress' | 'achieved' | 'delayed' | 'paused' }) => {
    const colors = {
        in_progress: 'bg-blue-500',
        achieved: 'bg-emerald-500',
        delayed: 'bg-red-500',
        paused: 'bg-gray-500'
    }
    return (
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${colors[status]}`}
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    )
}

const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
        piggy: PiggyBank,
        rocket: Rocket,
        flag: Flag,
        star: Star,
        heart: Heart,
        coffee: Coffee,
        car: Car,
        home: HomeIcon,
        shopping: ShoppingBag,
        plane: Plane,
        graduation: GraduationCap,
        umbrella: Umbrella,
        battery: Battery,
        gift: Gift,
        target: Target,
        wallet: Wallet
    }
    const Icon = icons[iconName] || PiggyBank
    return Icon
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

export default function SavingsGoalsPage() {
    const router = useRouter()
    const supabase = createClient()

    // États principaux
    const [loading, setLoading] = useState(true)
    const [goals, setGoals] = useState<SavingsGoal[]>([])
    const [filteredGoals, setFilteredGoals] = useState<SavingsGoal[]>([])
    const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
    const [showDetailPanel, setShowDetailPanel] = useState(false)
    const [showNewGoalModal, setShowNewGoalModal] = useState(false)
    const [showContributionModal, setShowContributionModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showAchievementModal, setShowAchievementModal] = useState(false)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [goalIdToDelete, setGoalIdToDelete] = useState<string | null>(null)

    // Filtres
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(9)

    // Stats
    const [summary, setSummary] = useState<SavingsSummary>({
        totalSaved: 0,
        totalTarget: 0,
        activeGoals: 0,
        achievedGoals: 0,
        delayedGoals: 0,
        pausedGoals: 0,
        globalProgress: 0,
        totalRemaining: 0
    })

    // Graphiques - données réelles
    const [distributionData, setDistributionData] = useState<any[]>([])
    const [evolutionData, setEvolutionData] = useState<any[]>([])
    const [comparisonData, setComparisonData] = useState<any[]>([])
    const [forecastData, setForecastData] = useState<any[]>([])
    const [monthlyData, setMonthlyData] = useState<any[]>([])

    // Données IA - réelles
    const [aiInsights, setAiInsights] = useState<any[]>([])
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([])

    // Toast
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)

    // Formulaires
    const [goalForm, setGoalForm] = useState({
        name: '',
        description: '',
        target_amount: '',
        deadline: '',
        category: '',
        priority: 'medium',
        icon: 'piggy'
    })

    const [contributionForm, setContributionForm] = useState({
        amount: '',
        source: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    })

    // Icônes disponibles
    const availableIcons = [
        { name: 'piggy', label: '🐷 Tirelire' },
        { name: 'rocket', label: '🚀 Fusée' },
        { name: 'flag', label: '🏁 Drapeau' },
        { name: 'star', label: '⭐ Étoile' },
        { name: 'heart', label: '❤️ Cœur' },
        { name: 'coffee', label: '☕ Café' },
        { name: 'car', label: '🚗 Voiture' },
        { name: 'home', label: '🏠 Maison' },
        { name: 'shopping', label: '🛍️ Shopping' },
        { name: 'plane', label: '✈️ Voyage' },
        { name: 'graduation', label: '🎓 Études' },
        { name: 'umbrella', label: '☂️ Protection' },
        { name: 'battery', label: '🔋 Énergie' },
        { name: 'gift', label: '🎁 Cadeau' },
        { name: 'target', label: '🎯 Objectif' },
        { name: 'wallet', label: '👛 Portefeuille' }
    ]

    // Catégories disponibles
    const categories = [
        'Fonds d\'urgence',
        'Achat important',
        'Voyage',
        'Études',
        'Santé',
        'Retraite',
        'Projet personnel',
        'Entreprise',
        'Loisirs',
        'Immobilier',
        'Véhicule',
        'Autre'
    ]

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

                await fetchGoals(company.id, user.id)

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
    // 2. RÉCUPÉRATION DES OBJECTIFS AVEC LEURS CONTRIBUTIONS
    // ============================================================
    const fetchGoals = async (companyId: string, userId: string) => {
        try {
            // Récupérer les objectifs
            const { data: goalsData, error: goalsError } = await supabase
                .from('savings_goals')
                .select('*')
                .eq('company_id', companyId)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (goalsError) throw new Error(goalsError.message)

            // Récupérer les contributions pour chaque objectif
            const goalsWithContributions = await Promise.all(
                (goalsData || []).map(async (goal) => {
                    const { data: contributions, error: contribError } = await supabase
                        .from('contributions')
                        .select('*')
                        .eq('goal_id', goal.id)
                        .order('date', { ascending: false })

                    if (contribError) {
                        console.warn(`Erreur chargement contributions pour ${goal.id}:`, contribError)
                        return {
                            ...goal,
                            contributions: []
                        }
                    }

                    return {
                        ...goal,
                        contributions: contributions || [],
                        ai_insights: goal.ai_insights || [],
                        ai_recommendations: goal.ai_recommendations || []
                    }
                })
            )

            setGoals(goalsWithContributions)
            setFilteredGoals(goalsWithContributions)

            // Calculer les statistiques avec les données réelles
            calculateSummary(goalsWithContributions)

            // Générer les graphiques avec les données réelles
            generateCharts(goalsWithContributions)

            // Récupérer les insights IA du premier objectif s'il existe
            if (goalsWithContributions.length > 0) {
                const firstGoal = goalsWithContributions[0]
                if (firstGoal.ai_insights) {
                    setAiInsights(firstGoal.ai_insights)
                }
                if (firstGoal.ai_recommendations) {
                    setAiRecommendations(firstGoal.ai_recommendations)
                }
            }

        } catch (err: any) {
            console.error('Erreur chargement objectifs:', err)
            showToast('error', `❌ ${err.message || 'Erreur de chargement des objectifs'}`)
        }
    }

    // ============================================================
    // 3. CALCUL DES STATISTIQUES - DONNÉES RÉELLES
    // ============================================================
    const calculateSummary = (data: SavingsGoal[]) => {
        if (!data || data.length === 0) {
            setSummary({
                totalSaved: 0,
                totalTarget: 0,
                activeGoals: 0,
                achievedGoals: 0,
                delayedGoals: 0,
                pausedGoals: 0,
                globalProgress: 0,
                totalRemaining: 0
            })
            return
        }

        const totalSaved = data.reduce((sum, g) => sum + (g.current_amount || 0), 0)
        const totalTarget = data.reduce((sum, g) => sum + (g.target_amount || 0), 0)
        const totalRemaining = data.reduce((sum, g) => sum + (g.remaining_amount || 0), 0)
        const globalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

        const activeGoals = data.filter(g => g.status === 'in_progress').length
        const achievedGoals = data.filter(g => g.status === 'achieved').length
        const delayedGoals = data.filter(g => g.status === 'delayed').length
        const pausedGoals = data.filter(g => g.status === 'paused').length

        setSummary({
            totalSaved,
            totalTarget,
            activeGoals,
            achievedGoals,
            delayedGoals,
            pausedGoals,
            globalProgress,
            totalRemaining
        })
    }

    // ============================================================
    // 4. GÉNÉRATION DES GRAPHIQUES - DONNÉES RÉELLES
    // ============================================================
    const generateCharts = (data: SavingsGoal[]) => {
        if (!data || data.length === 0) {
            setDistributionData([])
            setEvolutionData([])
            setComparisonData([])
            setForecastData([])
            setMonthlyData([])
            return
        }

        // 1. Répartition par objectif - Données réelles
        const distData = data
            .filter(g => g.current_amount > 0)
            .map(g => ({
                name: g.name,
                value: g.current_amount,
                target: g.target_amount
            }))
        setDistributionData(distData)

        // 2. Évolution mensuelle - À partir des contributions réelles
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
        const currentMonth = new Date().getMonth()
        const last6Months = []
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12
            last6Months.push(months[monthIndex])
        }

        // Calculer les montants réels par mois à partir des contributions
        const evoData = last6Months.map((month) => {
            let totalMonth = 0
            data.forEach(goal => {
                if (goal.contributions) {
                    goal.contributions.forEach(contrib => {
                        const contribDate = new Date(contrib.date)
                        const contribMonth = months[contribDate.getMonth()]
                        if (contribMonth === month) {
                            totalMonth += contrib.amount
                        }
                    })
                }
            })
            return {
                month,
                saved: totalMonth
            }
        })
        setEvolutionData(evoData)

        // 3. Comparaison atteints vs en cours - Données réelles
        const activeTotal = data
            .filter(g => g.status === 'in_progress')
            .reduce((sum, g) => sum + g.current_amount, 0)
        const achievedTotal = data
            .filter(g => g.status === 'achieved')
            .reduce((sum, g) => sum + g.current_amount, 0)
        setComparisonData([
            { name: 'En cours', value: activeTotal },
            { name: 'Atteints', value: achievedTotal }
        ])

        // 4. Prévisions - Basées sur les données réelles
        const totalMonthly = data.reduce((sum, g) => {
            if (g.contributions && g.contributions.length > 0) {
                const last3Months = g.contributions
                    .filter(c => {
                        const d = new Date(c.date)
                        const now = new Date()
                        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
                        return diffMonths < 3
                    })
                    .reduce((s, c) => s + c.amount, 0)
                return sum + (last3Months / 3)
            }
            return sum
        }, 0) || 0

        const remainingMonths = data.reduce((sum, g) => {
            if (g.deadline) {
                const diff = new Date(g.deadline).getTime() - new Date().getTime()
                const months = Math.max(1, Math.ceil(diff / (30 * 24 * 60 * 60 * 1000)))
                return sum + months
            }
            return sum
        }, 0) / (data.length || 1)

        const forecastMonths = ['Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
        const forecast = forecastMonths.map((month, index) => {
            const projected = summary.totalSaved + (totalMonthly * (index + 1))
            return {
                month,
                projected,
                target: summary.totalTarget || 0
            }
        })
        setForecastData(forecast)

        // 5. Données mensuelles réelles
        const monthlyDataReel = last6Months.map((month, index) => {
            let total = 0
            data.forEach(goal => {
                if (goal.contributions) {
                    goal.contributions.forEach(contrib => {
                        const contribDate = new Date(contrib.date)
                        const contribMonth = months[contribDate.getMonth()]
                        if (contribMonth === month) {
                            total += contrib.amount
                        }
                    })
                }
            })
            return {
                name: month,
                'Versements': total,
                'Objectif': summary.totalTarget / (data.length || 1) / 6
            }
        })
        setMonthlyData(monthlyDataReel)
    }

    // ============================================================
    // 5. FILTRES ET RECHERCHE
    // ============================================================
    useEffect(() => {
        if (!goals || goals.length === 0) {
            setFilteredGoals([])
            return
        }

        let result = [...goals]

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(g =>
                g.name.toLowerCase().includes(term) ||
                (g.description && g.description.toLowerCase().includes(term)) ||
                g.category.toLowerCase().includes(term)
            )
        }

        if (statusFilter !== 'all') {
            result = result.filter(g => g.status === statusFilter)
        }

        if (categoryFilter !== 'all') {
            result = result.filter(g => g.category === categoryFilter)
        }

        if (priorityFilter !== 'all') {
            result = result.filter(g => g.priority === priorityFilter)
        }

        setFilteredGoals(result)
        calculateSummary(result)
        generateCharts(result)
        setCurrentPage(1)

    }, [goals, searchTerm, statusFilter, categoryFilter, priorityFilter])

    // ============================================================
    // 6. CRÉATION D'UN OBJECTIF - AVEC DONNÉES RÉELLES
    // ============================================================
    const handleCreateGoal = async () => {
        if (!companyId || !userId) {
            showToast('error', '❌ Entreprise ou utilisateur non trouvé')
            return
        }

        if (!goalForm.name.trim()) {
            showToast('warning', '⚠️ Veuillez saisir un nom pour l\'objectif')
            return
        }

        if (!goalForm.target_amount || parseFloat(goalForm.target_amount) <= 0) {
            showToast('warning', '⚠️ Veuillez saisir un montant cible valide')
            return
        }

        if (!goalForm.deadline) {
            showToast('warning', '⚠️ Veuillez saisir une date limite')
            return
        }

        try {
            const now = new Date().toISOString()
            const targetAmount = parseFloat(goalForm.target_amount) || 0

            // Calcul du montant mensuel recommandé basé sur la date limite
            const deadlineDate = new Date(goalForm.deadline)
            const monthsDiff = Math.max(1, Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (30 * 24 * 60 * 60 * 1000)))
            const monthlyRecommended = targetAmount / monthsDiff

            const goalData = {
                company_id: companyId,
                user_id: userId,
                name: goalForm.name.trim(),
                description: goalForm.description?.trim() || null,
                icon: goalForm.icon || 'piggy',
                target_amount: targetAmount,
                current_amount: 0,
                remaining_amount: targetAmount,
                progress_percentage: 0,
                deadline: goalForm.deadline,
                status: 'in_progress' as const,
                category: goalForm.category || 'Autre',
                priority: goalForm.priority as 'low' | 'medium' | 'high',
                monthly_recommended: monthlyRecommended,
                estimated_completion: goalForm.deadline,
                created_at: now,
                updated_at: now
            }

            const { error } = await supabase
                .from('savings_goals')
                .insert(goalData)

            if (error) throw new Error(error.message)

            showToast('success', `✅ Objectif "${goalForm.name}" créé avec succès !`)
            setShowNewGoalModal(false)
            setGoalForm({
                name: '',
                description: '',
                target_amount: '',
                deadline: '',
                category: '',
                priority: 'medium',
                icon: 'piggy'
            })

            if (companyId && userId) {
                await fetchGoals(companyId, userId)
            }

        } catch (err: any) {
            console.error('Erreur création:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la création'}`)
        }
    }

    // ============================================================
    // 7. AJOUT D'UNE CONTRIBUTION - DONNÉES RÉELLES
    // ============================================================
    const handleAddContribution = async () => {
        if (!selectedGoal || !companyId || !userId) {
            showToast('error', '❌ Informations manquantes')
            return
        }

        const amount = parseFloat(contributionForm.amount) || 0
        if (amount <= 0) {
            showToast('warning', '⚠️ Veuillez saisir un montant valide')
            return
        }

        try {
            const newCurrentAmount = selectedGoal.current_amount + amount
            const newRemainingAmount = selectedGoal.target_amount - newCurrentAmount
            const newProgress = (newCurrentAmount / selectedGoal.target_amount) * 100
            const isAchieved = newProgress >= 100

            // Mettre à jour l'objectif
            const { error: updateError } = await supabase
                .from('savings_goals')
                .update({
                    current_amount: newCurrentAmount,
                    remaining_amount: newRemainingAmount,
                    progress_percentage: newProgress,
                    status: isAchieved ? 'achieved' : selectedGoal.status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedGoal.id)

            if (updateError) throw new Error(updateError.message)

            // Enregistrer la contribution
            const { error: contributionError } = await supabase
                .from('contributions')
                .insert({
                    goal_id: selectedGoal.id,
                    amount: amount,
                    source: contributionForm.source?.trim() || 'Manuel',
                    description: contributionForm.description?.trim() || null,
                    date: contributionForm.date || new Date().toISOString(),
                    created_at: new Date().toISOString()
                })

            if (contributionError) throw new Error(contributionError.message)

            // Vérifier si l'objectif est atteint
            if (isAchieved) {
                showToast('success', `🎉 Félicitations ! Objectif "${selectedGoal.name}" atteint !`)
                setShowAchievementModal(true)
            } else {
                showToast('success', `✅ Contribution de ${amount.toFixed(2)}€ ajoutée avec succès !`)
            }

            setShowContributionModal(false)
            setContributionForm({
                amount: '',
                source: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
            })

            if (companyId && userId) {
                await fetchGoals(companyId, userId)
            }

        } catch (err: any) {
            console.error('Erreur contribution:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de l\'ajout de la contribution'}`)
        }
    }

    // ============================================================
    // 8. SUPPRESSION D'UN OBJECTIF - DONNÉES RÉELLES
    // ============================================================
    const handleDeleteGoal = async () => {
        if (!goalIdToDelete || !companyId || !userId) {
            showToast('error', '❌ Informations manquantes')
            return
        }

        try {
            // Supprimer les contributions associées
            const { error: contribError } = await supabase
                .from('contributions')
                .delete()
                .eq('goal_id', goalIdToDelete)

            if (contribError) {
                console.warn('Erreur suppression contributions:', contribError)
            }

            // Supprimer l'objectif
            const { error } = await supabase
                .from('savings_goals')
                .delete()
                .eq('id', goalIdToDelete)

            if (error) throw new Error(error.message)

            showToast('success', '✅ Objectif supprimé avec succès')
            setShowDeleteModal(false)
            setGoalIdToDelete(null)

            if (companyId && userId) {
                await fetchGoals(companyId, userId)
            }

        } catch (err: any) {
            console.error('Erreur suppression:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la suppression'}`)
        }
    }

    // ============================================================
    // 9. ANALYSE IA - BASÉE SUR LES DONNÉES RÉELLES
    // ============================================================
    const runGoalAnalysis = async () => {
        if (!goals || goals.length === 0) {
            showToast('warning', '⚠️ Aucun objectif disponible à analyser')
            return
        }

        try {
            const insights = []
            const recommendations = []

            // Analyse des objectifs en retard - Données réelles
            const delayedGoals = goals.filter(g => g.status === 'delayed')
            if (delayedGoals.length > 0) {
                insights.push({
                    title: `${delayedGoals.length} objectif${delayedGoals.length > 1 ? 's' : ''} en retard`,
                    description: `Objectifs: ${delayedGoals.map(g => g.name).join(', ')}. Retard total de ${delayedGoals.reduce((sum, g) => sum + g.remaining_amount, 0).toFixed(2)}€`
                })
                recommendations.push({
                    title: 'Augmenter les contributions',
                    description: `Augmenter de 20% les versements pour les objectifs en retard afin de rattraper le retard`
                })
            }

            // Analyse des objectifs proches de l'atteinte - Données réelles
            const nearCompletion = goals.filter(g => g.progress_percentage > 80 && g.status !== 'achieved')
            if (nearCompletion.length > 0) {
                insights.push({
                    title: `${nearCompletion.length} objectif${nearCompletion.length > 1 ? 's' : ''} presque atteint${nearCompletion.length > 1 ? 's' : ''}`,
                    description: `Objectifs à plus de 80%: ${nearCompletion.map(g => g.name).join(', ')}. Il reste ${nearCompletion.reduce((sum, g) => sum + g.remaining_amount, 0).toFixed(2)}€ à épargner`
                })
                recommendations.push({
                    title: 'Finaliser ces objectifs',
                    description: `Concentrez vos efforts sur les objectifs proches de l'atteinte pour les terminer rapidement`
                })
            }

            // Analyse des objectifs à faible progression - Données réelles
            const lowProgress = goals.filter(g => g.progress_percentage < 20 && g.status === 'in_progress')
            if (lowProgress.length > 0) {
                insights.push({
                    title: `${lowProgress.length} objectif${lowProgress.length > 1 ? 's' : ''} à faible progression`,
                    description: `Objectifs avec moins de 20%: ${lowProgress.map(g => g.name).join(', ')}. Montant total restant: ${lowProgress.reduce((sum, g) => sum + g.remaining_amount, 0).toFixed(2)}€`
                })
                recommendations.push({
                    title: 'Réévaluer ces objectifs',
                    description: `Revoyez les montants ou les délais des objectifs à faible progression pour les rendre plus réalistes`
                })
            }

            // Analyse des objectifs atteints - Données réelles
            const achieved = goals.filter(g => g.status === 'achieved')
            if (achieved.length > 0) {
                insights.push({
                    title: `🎉 ${achieved.length} objectif${achieved.length > 1 ? 's' : ''} atteint${achieved.length > 1 ? 's' : ''}`,
                    description: `Félicitations ! Vous avez atteint ${achieved.length} objectif${achieved.length > 1 ? 's' : ''} sur ${goals.length}`
                })
            }

            // Calcul de la progression globale - Données réelles
            const totalProgress = goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length
            insights.push({
                title: `📊 Progression globale: ${totalProgress.toFixed(1)}%`,
                description: `Sur ${goals.length} objectif${goals.length > 1 ? 's' : ''}, vous avez épargné ${goals.reduce((sum, g) => sum + g.current_amount, 0).toFixed(2)}€ sur ${goals.reduce((sum, g) => sum + g.target_amount, 0).toFixed(2)}€`
            })

            // Recommandation basée sur les données réelles
            const averageMonthly = goals.reduce((sum, g) => {
                if (g.contributions && g.contributions.length > 0) {
                    const last3Months = g.contributions
                        .filter(c => {
                            const d = new Date(c.date)
                            const now = new Date()
                            const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
                            return diffMonths < 3
                        })
                        .reduce((s, c) => s + c.amount, 0)
                    return sum + (last3Months / 3)
                }
                return sum
            }, 0)

            if (averageMonthly > 0) {
                const remainingTotal = goals.reduce((sum, g) => sum + g.remaining_amount, 0)
                const monthsNeeded = remainingTotal / averageMonthly
                recommendations.push({
                    title: `📅 Estimation: ${monthsNeeded.toFixed(1)} mois restants`,
                    description: `Au rythme actuel (${averageMonthly.toFixed(2)}€/mois), vous atteindrez tous vos objectifs dans ${monthsNeeded.toFixed(1)} mois`
                })
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
    // 10. UTILITAIRES
    // ============================================================
    const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 5000)
    }

    const formatCurrency = (value: number) => {
        if (!value && value !== 0) return '0,00 €'
        return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
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

    const getDaysRemaining = (deadline: string) => {
        if (!deadline) return 0
        const now = new Date()
        const end = new Date(deadline)
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diff
    }

    // ============================================================
    // 11. RENDU
    // ============================================================

    const totalPages = Math.max(1, Math.ceil(filteredGoals.length / itemsPerPage))
    const paginatedGoals = filteredGoals.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-400 mx-auto" />
                    <p className="text-white/40 mt-4">Chargement des objectifs...</p>
                </div>
            </div>
        )
    }

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
            MODAL FÉLICITATIONS
            ============================================================ */}
            {showAchievementModal && selectedGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
                            <div className="relative">
                                <div className="text-6xl mb-2">🎉</div>
                                <Star className="h-16 w-16 text-emerald-400 mx-auto animate-bounce" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mt-4">Objectif atteint !</h2>
                        <p className="text-white/60 mt-2">
                            Félicitations ! Vous avez atteint votre objectif :
                        </p>
                        <p className="text-xl font-bold text-emerald-400 mt-2">{selectedGoal.name}</p>
                        <p className="text-sm text-white/40 mt-1">
                            {formatCurrency(selectedGoal.target_amount)} épargnés
                        </p>
                        <button
                            onClick={() => setShowAchievementModal(false)}
                            className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                        >
                            Continuer
                        </button>
                    </div>
                </div>
            )}

            {/* ============================================================
            EN-TÊTE
            ============================================================ */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Target size={24} className="text-emerald-400" />
                        Objectifs d'épargne
                    </h1>
                    <p className="text-sm text-white/40">
                        {filteredGoals.length} objectif{filteredGoals.length > 1 ? 's' : ''} · {formatCurrency(summary.totalSaved)} épargnés
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={runGoalAnalysis}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-violet-500/20"
                    >
                        <Brain size={16} />
                        Analyse IA
                        <Sparkles size={12} className="text-yellow-300" />
                    </button>

                    <button
                        onClick={() => setShowNewGoalModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={16} />
                        Nouvel objectif
                    </button>

                    <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition">
                        <Download size={16} />
                        Exporter
                    </button>
                </div>
            </div>

            {/* ============================================================
            INSIGHTS IA - DONNÉES RÉELLES
            ============================================================ */}
            {(aiInsights.length > 0 || aiRecommendations.length > 0) && (
                <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Brain size={18} className="text-violet-400" />
                            <h3 className="text-sm font-medium text-white/60">Analyse IA des objectifs</h3>
                        </div>
                        <button
                            onClick={runGoalAnalysis}
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
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Total épargné</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(summary.totalSaved)}</p>
                    <p className="text-[10px] text-white/30">{summary.globalProgress.toFixed(1)}% du total</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Objectifs actifs</p>
                    <p className="text-2xl font-bold text-white mt-1">{summary.activeGoals}</p>
                    <p className="text-[10px] text-white/30">En cours de réalisation</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Objectifs atteints</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.achievedGoals}</p>
                    <p className="text-[10px] text-white/30">✅ Félicitations !</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Progression globale</p>
                    <div className="mt-2">
                        <ProgressBar value={summary.globalProgress} status={summary.globalProgress >= 100 ? 'achieved' : 'in_progress'} />
                        <p className="text-sm font-bold text-white mt-1">{summary.globalProgress.toFixed(1)}%</p>
                    </div>
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
                            placeholder="Rechercher un objectif, catégorie..."
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
                            <option value="in_progress">En cours</option>
                            <option value="achieved">Atteints</option>
                            <option value="delayed">En retard</option>
                            <option value="paused">En pause</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Toutes catégories</option>
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Toutes priorités</option>
                            <option value="high">Haute</option>
                            <option value="medium">Moyenne</option>
                            <option value="low">Basse</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ============================================================
            GRAPHIQUES - DONNÉES RÉELLES
            ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Répartition de l'épargne - Données réelles */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                        <PieChartIcon size={16} className="text-blue-400" />
                        Répartition de l'épargne par objectif
                    </h3>
                    {distributionData.length > 0 ? (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={30}
                                        outerRadius={60}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => {
                                            if (!percent) return name
                                            return `${name} ${(percent * 100).toFixed(0)}%`
                                        }}
                                        labelLine={{ stroke: '#ffffff15', strokeWidth: 1 }}
                                    >
                                        {distributionData.map((entry, idx) => (
                                            <Cell key={idx} fill={['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'][idx % 8]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-sm text-white/30 text-center py-4">Aucune donnée disponible</p>
                    )}
                </div>

                {/* Évolution de l'épargne - Données réelles */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                        <LineChart size={16} className="text-emerald-400" />
                        Évolution mensuelle des versements
                    </h3>
                    {evolutionData.length > 0 && evolutionData.some(d => d.saved > 0) ? (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={evolutionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                                    <XAxis dataKey="month" stroke="#ffffff30" fontSize={10} />
                                    <YAxis stroke="#ffffff30" fontSize={10} />
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                    <Area
                                        type="monotone"
                                        dataKey="saved"
                                        stroke="#10b981"
                                        fill="#10b981"
                                        fillOpacity={0.15}
                                        name="Versements"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-sm text-white/30 text-center py-4">Aucun versement enregistré</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Comparaison atteints vs en cours - Données réelles */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-violet-400" />
                        Objectifs atteints vs en cours
                    </h3>
                    {comparisonData.some(d => d.value > 0) ? (
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={comparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                                    <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} />
                                    <YAxis stroke="#ffffff30" fontSize={10} />
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                    <Bar dataKey="value" fill="#6366f1" name="Montant épargné" />
                                </ReBarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-sm text-white/30 text-center py-4">Aucune donnée disponible</p>
                    )}
                </div>

                {/* Prévisions - Basées sur les données réelles */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                        <Rocket size={16} className="text-amber-400" />
                        Prévisions de fin d'année
                    </h3>
                    {forecastData.length > 0 && summary.totalTarget > 0 ? (
                        <div className="space-y-2">
                            {forecastData.map((item, idx) => {
                                const progress = item.target > 0 ? (item.projected / item.target) * 100 : 0
                                return (
                                    <div key={idx} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5">
                                        <span className="text-xs text-white/40">{item.month}</span>
                                        <span className="text-xs text-white/60">Prévu: {formatCurrency(item.projected)}</span>
                                        <span className={`text-xs font-medium ${progress >= 100 ? 'text-emerald-400' : 'text-blue-400'}`}>
                                            {progress >= 100 ? '✅ Objectif atteint' : `${progress.toFixed(0)}%`}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-white/30 text-center py-4">Aucune donnée de prévision disponible</p>
                    )}
                </div>
            </div>

            {/* ============================================================
            GRILLE DES OBJECTIFS - DONNÉES RÉELLES
            ============================================================ */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                {paginatedGoals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedGoals.map((goal) => {
                            const IconComponent = getIcon(goal.icon)
                            const daysRemaining = getDaysRemaining(goal.deadline)
                            const isDelayed = daysRemaining < 0 && goal.status !== 'achieved'

                            // Mettre à jour le statut si en retard
                            const displayStatus = isDelayed && goal.status === 'in_progress' ? 'delayed' : goal.status

                            return (
                                <div
                                    key={goal.id}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition cursor-pointer"
                                    onClick={() => {
                                        setSelectedGoal(goal)
                                        setShowDetailPanel(true)
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/20">
                                                <IconComponent size={20} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-white/80">{goal.name}</h3>
                                                <p className="text-[10px] text-white/30">{goal.category}</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={displayStatus} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/40">Progression</span>
                                            <span className="text-white/60">{goal.progress_percentage.toFixed(1)}%</span>
                                        </div>
                                        <ProgressBar value={goal.progress_percentage} status={displayStatus} />

                                        <div className="flex justify-between text-xs mt-2">
                                            <span className="text-white/40">Épargné</span>
                                            <span className="text-emerald-400">{formatCurrency(goal.current_amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/40">Objectif</span>
                                            <span className="text-white/60">{formatCurrency(goal.target_amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/40">Restant</span>
                                            <span className="text-blue-400">{formatCurrency(goal.remaining_amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/40">Échéance</span>
                                            <span className={`${daysRemaining < 0 && goal.status !== 'achieved' ? 'text-red-400' : 'text-white/40'}`}>
                                                {formatDate(goal.deadline)}
                                                {daysRemaining > 0 && ` (${daysRemaining}j)`}
                                                {daysRemaining === 0 && ' (Aujourd\'hui)'}
                                                {daysRemaining < 0 && goal.status !== 'achieved' && ' ⚠️ En retard'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/30 transition"
                                            onClick={() => {
                                                setSelectedGoal(goal)
                                                setShowContributionModal(true)
                                            }}
                                        >
                                            <Plus size={12} />
                                            Verser
                                        </button>
                                        <button
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition"
                                            onClick={() => {
                                                setSelectedGoal(goal)
                                                setShowDetailPanel(true)
                                            }}
                                        >
                                            <Eye size={12} />
                                            Détail
                                        </button>
                                        <button
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition"
                                            onClick={() => {
                                                setGoalIdToDelete(goal.id)
                                                setShowDeleteModal(true)
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Target size={32} className="text-white/20" />
                            <p className="text-white/40 text-sm font-medium">Aucun objectif trouvé</p>
                            <p className="text-white/20 text-xs">Commencez par créer votre premier objectif d'épargne</p>
                            <button
                                onClick={() => setShowNewGoalModal(true)}
                                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition"
                            >
                                <Plus size={16} />
                                Créer un objectif
                            </button>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {filteredGoals.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 mt-4">
                        <div className="text-sm text-white/40">
                            {filteredGoals.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredGoals.length)} sur ${filteredGoals.length}` : '0 objectif'}
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
            </div>

            {/* ============================================================
            PANEL DE DÉTAIL - DONNÉES RÉELLES
            ============================================================ */}
            {showDetailPanel && selectedGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {(() => {
                                    const Icon = getIcon(selectedGoal.icon)
                                    return <Icon size={20} className="text-blue-400" />
                                })()}
                                {selectedGoal.name}
                            </h2>
                            <button onClick={() => setShowDetailPanel(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Objectif</p>
                                <p className="text-lg font-bold text-white">{formatCurrency(selectedGoal.target_amount)}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Épargné</p>
                                <p className="text-lg font-bold text-emerald-400">{formatCurrency(selectedGoal.current_amount)}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Restant</p>
                                <p className="text-lg font-bold text-blue-400">{formatCurrency(selectedGoal.remaining_amount)}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Progression</p>
                                <div className="mt-1">
                                    <ProgressBar value={selectedGoal.progress_percentage} status={selectedGoal.status} />
                                    <p className="text-sm font-bold text-white mt-1">{selectedGoal.progress_percentage.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-[10px] text-white/30">Catégorie</p>
                                <p className="text-sm text-white/80">{selectedGoal.category}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30">Priorité</p>
                                <p className={`text-sm font-medium ${selectedGoal.priority === 'high' ? 'text-red-400' :
                                    selectedGoal.priority === 'medium' ? 'text-yellow-400' :
                                        'text-blue-400'
                                    }`}>
                                    {selectedGoal.priority === 'high' ? 'Haute' :
                                        selectedGoal.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30">Échéance</p>
                                <p className="text-sm text-white/80">{formatDate(selectedGoal.deadline)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30">Mensuel recommandé</p>
                                <p className="text-sm text-emerald-400">{formatCurrency(selectedGoal.monthly_recommended)}</p>
                            </div>
                        </div>

                        {selectedGoal.description && (
                            <div className="mb-6">
                                <p className="text-[10px] text-white/30">Description</p>
                                <p className="text-sm text-white/60">{selectedGoal.description}</p>
                            </div>
                        )}

                        {/* Historique des versements - Données réelles */}
                        {selectedGoal.contributions && selectedGoal.contributions.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-white/60 mb-3">
                                    Historique des versements ({selectedGoal.contributions.length})
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {selectedGoal.contributions.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Wallet size={14} className="text-white/30" />
                                                <div>
                                                    <p className="text-sm text-white/80">{c.source}</p>
                                                    <p className="text-[10px] text-white/30">{formatDate(c.date)}</p>
                                                    {c.description && (
                                                        <p className="text-[10px] text-white/40">{c.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-emerald-400">+{formatCurrency(c.amount)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                            <button
                                onClick={() => {
                                    setShowDetailPanel(false)
                                    setSelectedGoal(selectedGoal)
                                    setShowContributionModal(true)
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition"
                            >
                                <Plus size={14} /> Ajouter un versement
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition">
                                <Edit size={14} /> Modifier
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition">
                                <Bell size={14} /> Rappel
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetailPanel(false)
                                    setGoalIdToDelete(selectedGoal.id)
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
            MODAL NOUVEL OBJECTIF
            ============================================================ */}
            {showNewGoalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-emerald-400" />
                                Nouvel objectif d'épargne
                            </h2>
                            <button onClick={() => setShowNewGoalModal(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-white/60">Nom de l'objectif *</label>
                                <input
                                    type="text"
                                    value={goalForm.name}
                                    onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                                    placeholder="Ex: Fonds d'urgence, Achat maison..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Description</label>
                                <textarea
                                    value={goalForm.description}
                                    onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                                    placeholder="Décrivez votre objectif..."
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60">Montant cible (€) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={goalForm.target_amount}
                                        onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                                        placeholder="10000"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60">Date limite *</label>
                                    <input
                                        type="date"
                                        value={goalForm.deadline}
                                        onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60">Catégorie</label>
                                    <select
                                        value={goalForm.category}
                                        onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    >
                                        <option value="">Sélectionnez...</option>
                                        {categories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60">Priorité</label>
                                    <select
                                        value={goalForm.priority}
                                        onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    >
                                        <option value="low">Basse</option>
                                        <option value="medium">Moyenne</option>
                                        <option value="high">Haute</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Icône</label>
                                <div className="grid grid-cols-8 gap-2 mt-1">
                                    {availableIcons.map((icon) => {
                                        const Icon = getIcon(icon.name)
                                        return (
                                            <button
                                                key={icon.name}
                                                onClick={() => setGoalForm({ ...goalForm, icon: icon.name })}
                                                className={`p-2 rounded-lg border transition ${goalForm.icon === icon.name ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
                                                title={icon.label}
                                            >
                                                <Icon size={20} className={goalForm.icon === icon.name ? 'text-blue-400' : 'text-white/40'} />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setShowNewGoalModal(false)}
                                className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreateGoal}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                            >
                                <Check size={18} />
                                Créer l'objectif
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
            MODAL CONTRIBUTION
            ============================================================ */}
            {showContributionModal && selectedGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Wallet size={20} className="text-emerald-400" />
                                Ajouter un versement
                            </h2>
                            <button onClick={() => setShowContributionModal(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3 mb-4">
                            <p className="text-xs text-white/40">Objectif</p>
                            <p className="text-lg font-bold text-white">{selectedGoal.name}</p>
                            <p className="text-xs text-white/40 mt-1">
                                Progression: {selectedGoal.progress_percentage.toFixed(1)}% · Restant: {formatCurrency(selectedGoal.remaining_amount)}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-white/60">Montant (€) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={contributionForm.amount}
                                    onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Source</label>
                                <input
                                    type="text"
                                    value={contributionForm.source}
                                    onChange={(e) => setContributionForm({ ...contributionForm, source: e.target.value })}
                                    placeholder="Ex: Salaire, Épargne, Vente..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Description</label>
                                <input
                                    type="text"
                                    value={contributionForm.description}
                                    onChange={(e) => setContributionForm({ ...contributionForm, description: e.target.value })}
                                    placeholder="Ex: Versement mensuel"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Date</label>
                                <input
                                    type="date"
                                    value={contributionForm.date}
                                    onChange={(e) => setContributionForm({ ...contributionForm, date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setShowContributionModal(false)}
                                className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddContribution}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                            >
                                <Check size={18} />
                                Ajouter le versement
                            </button>
                        </div>
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
                            Êtes-vous sûr de vouloir supprimer cet objectif ? Cette action est irréversible.
                        </p>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                            <p className="text-xs text-red-400 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Tous les versements associés seront également supprimés.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setGoalIdToDelete(null)
                                }}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteGoal}
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