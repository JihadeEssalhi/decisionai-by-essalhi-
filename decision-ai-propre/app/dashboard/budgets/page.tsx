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
    Building2, Shield, Zap, HelpCircle, Target, Save
} from 'lucide-react'

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ComposedChart, Line, Bar,
    PieChart as RePieChart, Pie, Cell, BarChart as ReBarChart
} from 'recharts'

// ============================================================
// TYPES
// ============================================================

interface Budget {
    id: string
    company_id: string
    name: string
    department: string
    allocated: number
    spent: number
    remaining: number
    consumption_percentage: number
    status: 'on_track' | 'alert' | 'exceeded'
    period_start: string
    period_end: string
    responsible: string
    category: string
    project?: string
    created_at: string
    updated_at: string
    transactions?: Transaction[]
    ai_insights?: any[]
    ai_recommendations?: any[]
    ai_anomalies?: any[]
    ai_analyzed_at?: string
}

interface Transaction {
    id: string
    budget_id: string
    amount: number
    description: string
    date: string
    category: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
}

interface BudgetAdjustment {
    id: string
    budget_id: string
    amount: number
    reason: string
    created_at: string
    created_by: string
}

interface BudgetSummary {
    totalAllocated: number
    totalSpent: number
    totalRemaining: number
    averageConsumption: number
    budgetDeviation: number
    budgetDeviationPercent: number
    exceededCount: number
    alertCount: number
    onTrackCount: number
}

interface BudgetForecast {
    period: string
    projectedSpent: number
    budgetLimit: number
    deviation: number
    status: 'on_track' | 'alert' | 'exceeded'
}

// ============================================================
// COMPOSANTS
// ============================================================

const StatusBadge = ({ status }: { status: 'on_track' | 'alert' | 'exceeded' }) => {
    const config = {
        on_track: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: '✅ Dans les limites', icon: CheckCircle },
        alert: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: '⚠️ Alerte', icon: AlertTriangle },
        exceeded: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: '🚨 Dépassé', icon: AlertCircle }
    }
    const c = config[status]
    const Icon = c.icon
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${c.color}`}>
            <Icon size={10} />
            {c.label}
        </span>
    )
}

const ProgressBar = ({ value, status }: { value: number; status: 'on_track' | 'alert' | 'exceeded' }) => {
    const colors = {
        on_track: 'bg-emerald-500',
        alert: 'bg-yellow-500',
        exceeded: 'bg-red-500'
    }
    return (
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${colors[status]}`}
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    )
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function BudgetsPage() {
    const router = useRouter()
    const supabase = createClient()

    // États principaux
    const [loading, setLoading] = useState(true)
    const [loadingData, setLoadingData] = useState(true)
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([])
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
    const [showDetailPanel, setShowDetailPanel] = useState(false)
    const [showNewBudgetModal, setShowNewBudgetModal] = useState(false)
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [budgetIdToDelete, setBudgetIdToDelete] = useState<string | null>(null)

    // Filtres
    const [searchTerm, setSearchTerm] = useState('')
    const [periodFilter, setPeriodFilter] = useState('monthly')
    const [departmentFilter, setDepartmentFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [sortField, setSortField] = useState('allocated')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Stats
    const [summary, setSummary] = useState<BudgetSummary>({
        totalAllocated: 0,
        totalSpent: 0,
        totalRemaining: 0,
        averageConsumption: 0,
        budgetDeviation: 0,
        budgetDeviationPercent: 0,
        exceededCount: 0,
        alertCount: 0,
        onTrackCount: 0
    })

    // Graphiques
    const [departmentChartData, setDepartmentChartData] = useState<any[]>([])
    const [comparisonChartData, setComparisonChartData] = useState<any[]>([])
    const [evolutionChartData, setEvolutionChartData] = useState<any[]>([])
    const [forecastData, setForecastData] = useState<BudgetForecast[]>([])

    // Données IA
    const [aiInsights, setAiInsights] = useState<any[]>([])
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([])
    const [aiAnomalies, setAiAnomalies] = useState<any[]>([])

    // Toast
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)

    // Formulaires
    const [newBudgetForm, setNewBudgetForm] = useState({
        name: '',
        department: '',
        allocated: '',
        period_start: '',
        period_end: '',
        responsible: '',
        category: '',
        project: ''
    })

    const [adjustmentForm, setAdjustmentForm] = useState({
        amount: '',
        reason: ''
    })

    // ============================================================
    // 1. RÉCUPÉRATION DES DONNÉES
    // ============================================================
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()

                if (companyError) throw new Error(companyError.message)
                setCompanyId(company.id)

                await fetchBudgets(company.id)

            } catch (err: any) {
                console.error('Erreur:', err)
                showToast('error', `❌ ${err.message || 'Erreur de chargement'}`)
            } finally {
                setLoading(false)
                setLoadingData(false)
            }
        }

        fetchData()
    }, [])

    const fetchBudgets = async (companyId: string) => {
        setLoadingData(true)
        try {
            // Récupérer les budgets
            const { data: budgetsData, error: budgetsError } = await supabase
                .from('budgets')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })

            if (budgetsError) throw new Error(budgetsError.message)

            // Récupérer les transactions pour chaque budget
            const budgetsWithTransactions = await Promise.all(
                (budgetsData || []).map(async (budget) => {
                    const { data: transactions } = await supabase
                        .from('transactions')
                        .select('*')
                        .eq('budget_id', budget.id)
                        .order('date', { ascending: false })

                    return {
                        ...budget,
                        transactions: transactions || [],
                        ai_insights: budget.ai_insights || [],
                        ai_recommendations: budget.ai_recommendations || [],
                        ai_anomalies: budget.ai_anomalies || []
                    }
                })
            )

            setBudgets(budgetsWithTransactions)
            setFilteredBudgets(budgetsWithTransactions)
            calculateSummary(budgetsWithTransactions)
            generateCharts(budgetsWithTransactions)

            // Récupérer les insights IA du premier budget
            if (budgetsWithTransactions.length > 0) {
                const firstBudget = budgetsWithTransactions[0]
                setAiInsights(firstBudget.ai_insights || [])
                setAiRecommendations(firstBudget.ai_recommendations || [])
                setAiAnomalies(firstBudget.ai_anomalies || [])
            }

        } catch (err: any) {
            console.error('Erreur chargement budgets:', err)
            showToast('error', `❌ ${err.message || 'Erreur de chargement des budgets'}`)
        } finally {
            setLoadingData(false)
        }
    }

    // ============================================================
    // 2. CALCUL DES STATISTIQUES
    // ============================================================
    const calculateSummary = (data: Budget[]) => {
        const totalAllocated = data.reduce((sum, b) => sum + b.allocated, 0)
        const totalSpent = data.reduce((sum, b) => sum + b.spent, 0)
        const totalRemaining = data.reduce((sum, b) => sum + b.remaining, 0)
        const averageConsumption = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0
        const budgetDeviation = totalSpent - (totalAllocated * 0.8) // 80% d'utilisation prévue
        const budgetDeviationPercent = totalAllocated > 0 ? (budgetDeviation / totalAllocated) * 100 : 0

        const exceededCount = data.filter(b => b.status === 'exceeded').length
        const alertCount = data.filter(b => b.status === 'alert').length
        const onTrackCount = data.filter(b => b.status === 'on_track').length

        setSummary({
            totalAllocated,
            totalSpent,
            totalRemaining,
            averageConsumption,
            budgetDeviation,
            budgetDeviationPercent,
            exceededCount,
            alertCount,
            onTrackCount
        })
    }

    // ============================================================
    // 3. GÉNÉRATION DES GRAPHIQUES
    // ============================================================
    const generateCharts = (data: Budget[]) => {
        // Répartition par département
        const deptData = data.reduce((acc: any[], budget) => {
            const existing = acc.find(d => d.name === budget.department)
            if (existing) {
                existing.value += budget.allocated
            } else {
                acc.push({ name: budget.department, value: budget.allocated })
            }
            return acc
        }, [])
        setDepartmentChartData(deptData)

        // Comparaison Alloué vs Dépensé
        const comparisonData = data.map(b => ({
            name: b.name,
            allocated: b.allocated,
            spent: b.spent
        }))
        setComparisonChartData(comparisonData)

        // Évolution mensuelle (simulée avec données réelles)
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin']
        const evolutionData = months.map((month, index) => ({
            month,
            spent: data.reduce((sum, b) => sum + (b.spent * (0.1 + index * 0.15)), 0) / 10,
            budget: data.reduce((sum, b) => sum + (b.allocated * 0.8 / 6), 0) // 80% sur 6 mois
        }))
        setEvolutionChartData(evolutionData)

        // Prévisions
        const forecastData: BudgetForecast[] = months.map((month, index) => {
            const projectedSpent = data.reduce((sum, b) => sum + (b.spent * (0.2 + index * 0.13)), 0) / 5
            const budgetLimit = data.reduce((sum, b) => sum + (b.allocated * 0.8 / 6), 0)
            const deviation = projectedSpent - budgetLimit
            const status = deviation < -1000 ? 'on_track' : deviation < 500 ? 'alert' : 'exceeded'
            return { period: month, projectedSpent, budgetLimit, deviation, status }
        })
        setForecastData(forecastData)
    }

    // ============================================================
    // 4. FILTRES ET RECHERCHE
    // ============================================================
    useEffect(() => {
        if (!budgets) return

        let result = [...budgets]

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(b =>
                b.name.toLowerCase().includes(term) ||
                b.department.toLowerCase().includes(term) ||
                b.responsible.toLowerCase().includes(term)
            )
        }

        if (departmentFilter !== 'all') {
            result = result.filter(b => b.department === departmentFilter)
        }

        if (statusFilter !== 'all') {
            result = result.filter(b => b.status === statusFilter)
        }

        if (categoryFilter !== 'all') {
            result = result.filter(b => b.category === categoryFilter)
        }

        // Tri
        result.sort((a, b) => {
            let aVal = a[sortField as keyof Budget] as any
            let bVal = b[sortField as keyof Budget] as any
            if (typeof aVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
            }
            return sortDirection === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
        })

        setFilteredBudgets(result)
        calculateSummary(result)
        generateCharts(result)
        setCurrentPage(1)

    }, [budgets, searchTerm, departmentFilter, statusFilter, categoryFilter, sortField, sortDirection])

    // ============================================================
    // 5. CRÉATION D'UN BUDGET
    // ============================================================
    const handleCreateBudget = async () => {
        if (!companyId) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Utilisateur non connecté')

            const now = new Date().toISOString()
            const allocated = parseFloat(newBudgetForm.allocated) || 0

            const budgetData = {
                company_id: companyId,
                user_id: user.id,
                name: newBudgetForm.name,
                department: newBudgetForm.department,
                allocated: allocated,
                spent: 0,
                remaining: allocated,
                consumption_percentage: 0,
                status: 'on_track' as const,
                period_start: newBudgetForm.period_start || now,
                period_end: newBudgetForm.period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                responsible: newBudgetForm.responsible || user.email || 'Non assigné',
                category: newBudgetForm.category || 'Général',
                project: newBudgetForm.project || null,
                created_at: now,
                updated_at: now
            }

            const { error } = await supabase
                .from('budgets')
                .insert(budgetData)

            if (error) throw new Error(error.message)

            showToast('success', '✅ Budget créé avec succès !')
            setShowNewBudgetModal(false)
            setNewBudgetForm({
                name: '',
                department: '',
                allocated: '',
                period_start: '',
                period_end: '',
                responsible: '',
                category: '',
                project: ''
            })

            if (companyId) await fetchBudgets(companyId)

        } catch (err: any) {
            console.error('Erreur création:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la création'}`)
        }
    }

    // ============================================================
    // 6. AJUSTEMENT D'UN BUDGET
    // ============================================================
    const handleAdjustBudget = async () => {
        if (!selectedBudget || !companyId) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Utilisateur non connecté')

            const adjustmentAmount = parseFloat(adjustmentForm.amount) || 0
            const newAllocated = selectedBudget.allocated + adjustmentAmount

            // Mettre à jour le budget
            const { error: updateError } = await supabase
                .from('budgets')
                .update({
                    allocated: newAllocated,
                    remaining: newAllocated - selectedBudget.spent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedBudget.id)

            if (updateError) throw new Error(updateError.message)

            // Enregistrer l'ajustement
            const { error: adjustmentError } = await supabase
                .from('budget_adjustments')
                .insert({
                    budget_id: selectedBudget.id,
                    amount: adjustmentAmount,
                    reason: adjustmentForm.reason || 'Ajustement manuel',
                    created_at: new Date().toISOString(),
                    created_by: user.id
                })

            if (adjustmentError) throw new Error(adjustmentError.message)

            showToast('success', `✅ Budget ajusté de ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount} €`)
            setShowAdjustmentModal(false)
            setAdjustmentForm({ amount: '', reason: '' })

            if (companyId) await fetchBudgets(companyId)

        } catch (err: any) {
            console.error('Erreur ajustement:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de l\'ajustement'}`)
        }
    }

    // ============================================================
    // 7. SUPPRESSION D'UN BUDGET
    // ============================================================
    const handleDeleteBudget = async () => {
        if (!budgetIdToDelete || !companyId) return

        try {
            // Supprimer les transactions associées
            await supabase
                .from('transactions')
                .delete()
                .eq('budget_id', budgetIdToDelete)

            // Supprimer les ajustements associés
            await supabase
                .from('budget_adjustments')
                .delete()
                .eq('budget_id', budgetIdToDelete)

            // Supprimer le budget
            const { error } = await supabase
                .from('budgets')
                .delete()
                .eq('id', budgetIdToDelete)

            if (error) throw new Error(error.message)

            showToast('success', '✅ Budget supprimé avec succès')
            setShowDeleteModal(false)
            setBudgetIdToDelete(null)

            if (companyId) await fetchBudgets(companyId)

        } catch (err: any) {
            console.error('Erreur suppression:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la suppression'}`)
        }
    }

    // ============================================================
    // 8. ANALYSE IA
    // ============================================================
    const runBudgetAnalysis = async () => {
        if (!budgets || budgets.length === 0) {
            showToast('warning', '⚠️ Aucun budget disponible à analyser')
            return
        }

        try {
            const insights = []
            const recommendations = []
            const anomalies = []

            // Analyse des budgets en dépassement
            const exceededBudgets = budgets.filter(b => b.status === 'exceeded')
            if (exceededBudgets.length > 0) {
                insights.push({
                    title: `${exceededBudgets.length} budgets en dépassement`,
                    description: `Les budgets suivants dépassent leurs limites: ${exceededBudgets.map(b => b.name).join(', ')}`
                })
                recommendations.push({
                    title: 'Réduire les dépenses',
                    description: `Réduire de 10% les budgets en dépassement: ${exceededBudgets.map(b => b.name).join(', ')}`
                })
            }

            // Analyse des budgets avec faible consommation
            const lowConsumption = budgets.filter(b => b.consumption_percentage < 30)
            if (lowConsumption.length > 0) {
                insights.push({
                    title: `${lowConsumption.length} budgets sous-utilisés`,
                    description: `Budgets avec moins de 30% consommé: ${lowConsumption.map(b => b.name).join(', ')}`
                })
                recommendations.push({
                    title: 'Réallouer les budgets',
                    description: `Réallouer les budgets sous-utilisés vers les départements avec des besoins supplémentaires`
                })
            }

            // Anomalies
            const highSpending = budgets.filter(b => b.consumption_percentage > 90 && b.status !== 'exceeded')
            if (highSpending.length > 0) {
                anomalies.push({
                    title: 'Risque de dépassement',
                    description: `${highSpending.length} budgets proches de leur limite: ${highSpending.map(b => b.name).join(', ')}`
                })
            }

            setAiInsights(insights)
            setAiRecommendations(recommendations)
            setAiAnomalies(anomalies)

            showToast('success', `✅ Analyse IA terminée ! ${insights.length + recommendations.length + anomalies.length} insights générés.`)

        } catch (err: any) {
            console.error('Erreur analyse IA:', err)
            showToast('error', '❌ Erreur lors de l\'analyse IA')
        }
    }

    // ============================================================
    // 9. UTILITAIRES
    // ============================================================
    const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 5000)
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('fr-FR') + ' €'
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A'
        try { return new Date(dateStr).toLocaleDateString('fr-FR') } catch { return dateStr }
    }

    const getDepartments = () => {
        const depts = new Set(budgets.map(b => b.department))
        return ['all', ...Array.from(depts)]
    }

    const getCategories = () => {
        const cats = new Set(budgets.map(b => b.category))
        return ['all', ...Array.from(cats)]
    }

    // ============================================================
    // 10. RENDU
    // ============================================================

    const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage)
    const paginatedBudgets = filteredBudgets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-400 mx-auto" />
                    <p className="text-white/40 mt-4">Chargement des budgets...</p>
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
                <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl backdrop-blur-xl border ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        toast.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                            'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    }`}>
                    <p className="text-sm font-medium">{toast.message}</p>
                </div>
            )}

            {/* ============================================================
            EN-TÊTE
            ============================================================ */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet size={24} className="text-blue-400" />
                        Budgets
                    </h1>
                    <p className="text-sm text-white/40">
                        {filteredBudgets.length} budgets · {summary.totalAllocated > 0 ? formatCurrency(summary.totalAllocated) : '0'} alloués
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Sélecteur de période */}
                    <select
                        value={periodFilter}
                        onChange={(e) => setPeriodFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="monthly">Mensuel</option>
                        <option value="quarterly">Trimestriel</option>
                        <option value="annual">Annuel</option>
                    </select>

                    <button
                        onClick={runBudgetAnalysis}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-violet-500/20"
                    >
                        <Brain size={16} />
                        Analyse IA
                        <Sparkles size={12} className="text-yellow-300" />
                    </button>

                    <button
                        onClick={() => setShowNewBudgetModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={16} />
                        Nouveau budget
                    </button>

                    <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition">
                        <Download size={16} />
                        Exporter
                    </button>
                </div>
            </div>

            {/* ============================================================
            INSIGHTS IA
            ============================================================ */}
            {(aiInsights.length > 0 || aiRecommendations.length > 0 || aiAnomalies.length > 0) && (
                <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Brain size={18} className="text-violet-400" />
                            <h3 className="text-sm font-medium text-white/60">Analyse IA des budgets</h3>
                        </div>
                        <button
                            onClick={runBudgetAnalysis}
                            className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full transition flex items-center gap-1"
                        >
                            <RefreshCw size={10} /> Actualiser
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {aiInsights.length > 0 && (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                                <p className="text-[10px] text-emerald-400 font-medium">📊 Insights</p>
                                <ul className="mt-1 space-y-1">
                                    {aiInsights.map((insight, i) => (
                                        <li key={i} className="text-xs text-white/60">• {insight.title}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {aiRecommendations.length > 0 && (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                                <p className="text-[10px] text-amber-400 font-medium">💡 Recommandations</p>
                                <ul className="mt-1 space-y-1">
                                    {aiRecommendations.map((rec, i) => (
                                        <li key={i} className="text-xs text-white/60">• {rec.title}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {aiAnomalies.length > 0 && (
                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                                <p className="text-[10px] text-red-400 font-medium">⚠️ Anomalies</p>
                                <ul className="mt-1 space-y-1">
                                    {aiAnomalies.map((anomaly, i) => (
                                        <li key={i} className="text-xs text-white/60">• {anomaly.title}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================
            CARTES RÉSUMÉ
            ============================================================ */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Total alloué</p>
                    <p className="text-xl font-bold text-white mt-1">{formatCurrency(summary.totalAllocated)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Dépensé</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(summary.totalSpent)}</p>
                    <p className="text-[10px] text-white/30">{summary.averageConsumption.toFixed(1)}% consommé</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Restant</p>
                    <p className="text-xl font-bold text-blue-400 mt-1">{formatCurrency(summary.totalRemaining)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Écart budgétaire</p>
                    <p className={`text-xl font-bold mt-1 ${summary.budgetDeviation > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {summary.budgetDeviation > 0 ? '+' : ''}{formatCurrency(summary.budgetDeviation)}
                    </p>
                    <p className="text-[10px] text-white/30">{summary.budgetDeviationPercent.toFixed(1)}%</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Alertes</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold text-red-400">{summary.exceededCount}</span>
                        <span className="text-xs text-white/30">dépassés</span>
                        <span className="text-xl font-bold text-yellow-400 ml-2">{summary.alertCount}</span>
                        <span className="text-xs text-white/30">alertes</span>
                    </div>
                </div>
            </div>

            {/* ============================================================
            GRAPHIQUES
            ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Répartition par département */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                        <PieChartIcon size={16} className="text-blue-400" />
                        Répartition du budget par département
                    </h3>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={departmentChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={30}
                                    outerRadius={60}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={{ stroke: '#ffffff15', strokeWidth: 1 }}
                                >
                                    {departmentChartData.map((entry, idx) => (
                                        <Cell key={idx} fill={['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'][idx % 8]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Comparaison Alloué vs Dépensé */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-emerald-400" />
                        Budget alloué vs Dépenses réelles
                    </h3>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={comparisonChartData.slice(0, 8)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                                <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} />
                                <YAxis stroke="#ffffff30" fontSize={10} />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend wrapperStyle={{ fontSize: '10px', color: '#ffffff60' }} />
                                <Bar dataKey="allocated" fill="#6366f1" name="Alloué" />
                                <Bar dataKey="spent" fill="#10b981" name="Dépensé" />
                            </ReBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Évolution des dépenses */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                        <LineChart size={16} className="text-violet-400" />
                        Évolution des dépenses
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={evolutionChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                                <XAxis dataKey="month" stroke="#ffffff30" fontSize={10} />
                                <YAxis stroke="#ffffff30" fontSize={10} />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend wrapperStyle={{ fontSize: '10px', color: '#ffffff60' }} />
                                <Bar dataKey="spent" fill="#10b981" name="Dépenses" />
                                <Line type="monotone" dataKey="budget" stroke="#6366f1" name="Ligne budgétaire" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Prévisions */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                        <Target size={16} className="text-amber-400" />
                        Prévisions de fin de période
                    </h3>
                    <div className="space-y-2">
                        {forecastData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-white/40">{item.period}</span>
                                    <span className="text-xs text-white/60">Prévu: {formatCurrency(item.budgetLimit)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium ${item.status === 'on_track' ? 'text-emerald-400' :
                                        item.status === 'alert' ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {formatCurrency(item.projectedSpent)}
                                    </span>
                                    <StatusBadge status={item.status} />
                                    {item.deviation !== 0 && (
                                        <span className={`text-[10px] ${item.deviation > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {item.deviation > 0 ? '+' : ''}{formatCurrency(item.deviation)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ============================================================
            TABLEAU PRINCIPAL
            ============================================================ */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Barre de recherche et filtres */}
                <div className="p-4 border-b border-white/5">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher un budget, département, responsable..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="all">Tous départements</option>
                                {getDepartments().filter(d => d !== 'all').map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="all">Tous statuts</option>
                                <option value="on_track">Dans les limites</option>
                                <option value="alert">Alerte</option>
                                <option value="exceeded">Dépassé</option>
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="all">Toutes catégories</option>
                                {getCategories().filter(c => c !== 'all').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tableau */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => { setSortField('name'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc') }}>
                                    Nom {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => { setSortField('department'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc') }}>
                                    Département
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => { setSortField('allocated'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc') }}>
                                    Alloué {sortField === 'allocated' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => { setSortField('spent'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc') }}>
                                    Dépensé
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => { setSortField('remaining'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc') }}>
                                    Restant
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                                    % Consommé
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                                    Responsable
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedBudgets.length > 0 ? (
                                paginatedBudgets.map((budget) => (
                                    <tr
                                        key={budget.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                                        onClick={() => {
                                            setSelectedBudget(budget)
                                            setShowDetailPanel(true)
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Wallet size={14} className="text-blue-400" />
                                                <span className="text-sm font-medium text-white/80">{budget.name}</span>
                                            </div>
                                            {budget.project && (
                                                <p className="text-[10px] text-white/30 ml-6">{budget.project}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">
                                            <div className="flex items-center gap-1">
                                                <Building2 size={12} className="text-white/30" />
                                                {budget.department}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-white">
                                            {formatCurrency(budget.allocated)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-emerald-400">
                                            {formatCurrency(budget.spent)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-blue-400">
                                            {formatCurrency(budget.remaining)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="w-24">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-white/60">{budget.consumption_percentage.toFixed(1)}%</span>
                                                    <ProgressBar value={budget.consumption_percentage} status={budget.status} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={budget.status} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">
                                            <div className="flex items-center gap-1">
                                                <Users size={12} className="text-white/30" />
                                                {budget.responsible}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition"
                                                    onClick={() => {
                                                        setSelectedBudget(budget)
                                                        setShowDetailPanel(true)
                                                    }}
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition"
                                                    onClick={() => {
                                                        setSelectedBudget(budget)
                                                        setShowAdjustmentModal(true)
                                                    }}
                                                >
                                                    <Edit size={15} />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition"
                                                    onClick={() => {
                                                        setBudgetIdToDelete(budget.id)
                                                        setShowDeleteModal(true)
                                                    }}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Wallet size={32} className="text-white/20" />
                                            <p className="text-white/40 text-sm font-medium">Aucun budget trouvé</p>
                                            <p className="text-white/20 text-xs">Commencez par créer votre premier budget</p>
                                            <button
                                                onClick={() => setShowNewBudgetModal(true)}
                                                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition"
                                            >
                                                <Plus size={16} />
                                                Créer un budget
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredBudgets.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                        <div className="text-sm text-white/40">
                            {filteredBudgets.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredBudgets.length)} sur ${filteredBudgets.length}` : '0 budget'}
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white/70 focus:outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
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
            PANEL DE DÉTAIL
            ============================================================ */}
            {showDetailPanel && selectedBudget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Wallet size={20} className="text-blue-400" />
                                {selectedBudget.name}
                            </h2>
                            <button onClick={() => setShowDetailPanel(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Alloué</p>
                                <p className="text-lg font-bold text-white">{formatCurrency(selectedBudget.allocated)}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Dépensé</p>
                                <p className="text-lg font-bold text-emerald-400">{formatCurrency(selectedBudget.spent)}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Restant</p>
                                <p className="text-lg font-bold text-blue-400">{formatCurrency(selectedBudget.remaining)}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Consommation</p>
                                <p className="text-lg font-bold text-white">{selectedBudget.consumption_percentage.toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-[10px] text-white/30">Département</p>
                                <p className="text-sm text-white/80">{selectedBudget.department}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30">Responsable</p>
                                <p className="text-sm text-white/80">{selectedBudget.responsible}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30">Catégorie</p>
                                <p className="text-sm text-white/80">{selectedBudget.category}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30">Période</p>
                                <p className="text-sm text-white/80">{formatDate(selectedBudget.period_start)} - {formatDate(selectedBudget.period_end)}</p>
                            </div>
                        </div>

                        {/* Transactions associées */}
                        {selectedBudget.transactions && selectedBudget.transactions.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-white/60 mb-3">Transactions associées</h4>
                                <div className="space-y-2">
                                    {selectedBudget.transactions.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Receipt size={14} className="text-white/30" />
                                                <div>
                                                    <p className="text-sm text-white/80">{t.description}</p>
                                                    <p className="text-[10px] text-white/30">{formatDate(t.date)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-emerald-400">{formatCurrency(t.amount)}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {t.status}
                                                </span>
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
                                    setSelectedBudget(selectedBudget)
                                    setShowAdjustmentModal(true)
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition"
                            >
                                <Edit size={14} /> Ajuster
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition">
                                <FileText size={14} /> Voir rapports
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition">
                                <LineChart size={14} /> Analyse
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetailPanel(false)
                                    setBudgetIdToDelete(selectedBudget.id)
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
            MODAL NOUVEAU BUDGET
            ============================================================ */}
            {showNewBudgetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-emerald-400" />
                                Nouveau budget
                            </h2>
                            <button onClick={() => setShowNewBudgetModal(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-white/60">Nom du budget *</label>
                                <input
                                    type="text"
                                    value={newBudgetForm.name}
                                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, name: e.target.value })}
                                    placeholder="Ex: Budget Marketing 2024"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60">Département *</label>
                                    <input
                                        type="text"
                                        value={newBudgetForm.department}
                                        onChange={(e) => setNewBudgetForm({ ...newBudgetForm, department: e.target.value })}
                                        placeholder="Ex: Marketing"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60">Montant alloué *</label>
                                    <input
                                        type="number"
                                        value={newBudgetForm.allocated}
                                        onChange={(e) => setNewBudgetForm({ ...newBudgetForm, allocated: e.target.value })}
                                        placeholder="0"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60">Période début</label>
                                    <input
                                        type="date"
                                        value={newBudgetForm.period_start}
                                        onChange={(e) => setNewBudgetForm({ ...newBudgetForm, period_start: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60">Période fin</label>
                                    <input
                                        type="date"
                                        value={newBudgetForm.period_end}
                                        onChange={(e) => setNewBudgetForm({ ...newBudgetForm, period_end: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60">Responsable</label>
                                    <input
                                        type="text"
                                        value={newBudgetForm.responsible}
                                        onChange={(e) => setNewBudgetForm({ ...newBudgetForm, responsible: e.target.value })}
                                        placeholder="Nom du responsable"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60">Catégorie</label>
                                    <input
                                        type="text"
                                        value={newBudgetForm.category}
                                        onChange={(e) => setNewBudgetForm({ ...newBudgetForm, category: e.target.value })}
                                        placeholder="Ex: Opérationnel"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Projet (optionnel)</label>
                                <input
                                    type="text"
                                    value={newBudgetForm.project}
                                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, project: e.target.value })}
                                    placeholder="Nom du projet associé"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setShowNewBudgetModal(false)}
                                className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreateBudget}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                            >
                                <Check size={18} />
                                Créer le budget
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
            MODAL AJUSTEMENT
            ============================================================ */}
            {showAdjustmentModal && selectedBudget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit size={20} className="text-blue-400" />
                                Ajuster le budget
                            </h2>
                            <button onClick={() => setShowAdjustmentModal(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-xs text-white/40">Budget actuel</p>
                                <p className="text-xl font-bold text-white">{formatCurrency(selectedBudget.allocated)}</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Montant d'ajustement *</label>
                                <input
                                    type="number"
                                    value={adjustmentForm.amount}
                                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                                    placeholder="+1000 ou -500"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                                <p className="text-[10px] text-white/30 mt-1">Utilisez + pour augmenter, - pour diminuer</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Raison de l'ajustement</label>
                                <input
                                    type="text"
                                    value={adjustmentForm.reason}
                                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                                    placeholder="Ex: Réallocation budgétaire"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setShowAdjustmentModal(false)}
                                className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAdjustBudget}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20"
                            >
                                <Save size={18} />
                                Appliquer l'ajustement
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
                            Êtes-vous sûr de vouloir supprimer ce budget ? Cette action est irréversible.
                        </p>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                            <p className="text-xs text-red-400 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Toutes les transactions et ajustements associés seront également supprimés.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setBudgetIdToDelete(null)
                                }}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteBudget}
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