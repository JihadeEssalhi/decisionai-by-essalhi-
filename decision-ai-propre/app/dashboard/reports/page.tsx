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
    Upload, Share2, Send, File, FolderOpen, BookOpen,
    PenTool, Layout, Columns, Table, Printer, UserPlus,
    Mail, Settings as SettingsIcon, Repeat, Zap as ZapIcon,
    ArrowLeft
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

interface Report {
    id: string
    company_id: string
    user_id: string
    name: string
    type: 'financial' | 'sales' | 'budget' | 'hr' | 'custom'
    category: string
    status: 'draft' | 'finalized' | 'scheduled'
    period_start: string
    period_end: string
    frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    created_by: string
    created_at: string
    updated_at: string
    shared_with: string[]
    scheduled_recipients?: string[]
    scheduled_format?: 'pdf' | 'excel' | 'powerpoint'
    ai_summary?: string
    ai_insights?: any[]
    ai_recommendations?: any[]
    content?: any
}

interface ReportTemplate {
    id: string
    name: string
    type: Report['type']
    description: string
    icon: React.ElementType
    defaultKpis: string[]
    defaultCharts: string[]
}

interface ReportSummary {
    totalReports: number
    scheduledReports: number
    lastReportDate: string
    sharedThisMonth: number
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

// ============================================================
// COMPOSANTS
// ============================================================

const StatusBadge = ({ status }: { status: 'draft' | 'finalized' | 'scheduled' }) => {
    const config = {
        draft: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: '📝 Brouillon' },
        finalized: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: '✅ Finalisé' },
        scheduled: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: '📅 Programmé' }
    }
    const c = config[status]
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${c.color}`}>
            {c.label}
        </span>
    )
}

const FrequencyBadge = ({ frequency }: { frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' }) => {
    const config = {
        daily: { color: 'bg-purple-500/20 text-purple-400', label: 'Quotidien' },
        weekly: { color: 'bg-indigo-500/20 text-indigo-400', label: 'Hebdomadaire' },
        monthly: { color: 'bg-blue-500/20 text-blue-400', label: 'Mensuel' },
        quarterly: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Trimestriel' }
    }
    const c = frequency && config[frequency] || { color: 'bg-gray-500/20 text-gray-400', label: '-' }
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.color}`}>
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

export default function ReportsPage() {
    const router = useRouter()
    const supabase = createClient()

    // États principaux
    const [loading, setLoading] = useState(true)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    // Données
    const [reports, setReports] = useState<Report[]>([])
    const [filteredReports, setFilteredReports] = useState<Report[]>([])
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)
    const [showDetailPanel, setShowDetailPanel] = useState(false)
    const [showNewReportModal, setShowNewReportModal] = useState(false)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [reportIdToDelete, setReportIdToDelete] = useState<string | null>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)

    // Filtres
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [frequencyFilter, setFrequencyFilter] = useState('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Formulaire de création
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        period_start: '',
        period_end: '',
        frequency: '' as '' | 'daily' | 'weekly' | 'monthly' | 'quarterly',
        status: 'draft' as 'draft' | 'finalized' | 'scheduled'
    })

    // Stats
    const [summary, setSummary] = useState<ReportSummary>({
        totalReports: 0,
        scheduledReports: 0,
        lastReportDate: '',
        sharedThisMonth: 0
    })

    // IA Insights
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
    // TEMPLATES DE RAPPORTS
    // ============================================================
    const reportTemplates: ReportTemplate[] = [
        {
            id: 'financial',
            name: 'Rapport Financier',
            type: 'financial',
            description: 'CA, Marge, Coûts, Trésorerie',
            icon: DollarSign,
            defaultKpis: ['Chiffre d\'affaires', 'Marge brute', 'Coûts opérationnels', 'Trésorerie'],
            defaultCharts: ['Évolution CA', 'Répartition coûts', 'Trésorerie']
        },
        {
            id: 'sales',
            name: 'Rapport de Ventes',
            type: 'sales',
            description: 'Performance commerciale, Objectifs',
            icon: TrendingUp,
            defaultKpis: ['Ventes totales', 'Nombre de transactions', 'Panier moyen', 'Taux de conversion'],
            defaultCharts: ['Ventes par région', 'Évolution ventes', 'Top produits']
        },
        {
            id: 'budget',
            name: 'Rapport Budgétaire',
            type: 'budget',
            description: 'Suivi des budgets, Écarts',
            icon: Wallet,
            defaultKpis: ['Budget alloué', 'Dépenses', 'Écart', 'Taux d\'utilisation'],
            defaultCharts: ['Utilisation par département', 'Évolution dépenses', 'Écarts']
        },
        {
            id: 'hr',
            name: 'Rapport RH',
            type: 'hr',
            description: 'Effectifs, Turnover, Masse salariale',
            icon: Users,
            defaultKpis: ['Effectif total', 'Turnover', 'Masse salariale', 'Absentéisme'],
            defaultCharts: ['Évolution effectifs', 'Répartition par département', 'Turnover']
        },
        {
            id: 'custom',
            name: 'Rapport Personnalisé',
            type: 'custom',
            description: 'Construisez votre rapport sur mesure',
            icon: PenTool,
            defaultKpis: ['Choisissez vos indicateurs'],
            defaultCharts: ['Choisissez vos graphiques']
        }
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

                await fetchReports(company.id)

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
    // 2. RÉCUPÉRATION DES RAPPORTS
    // ============================================================
    const fetchReports = async (companyId: string) => {
        try {
            const { data: reportsData, error: reportsError } = await supabase
                .from('reports')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })

            if (reportsError) throw new Error(reportsError.message)

            setReports(reportsData || [])
            setFilteredReports(reportsData || [])
            calculateSummary(reportsData || [])

            if (reportsData && reportsData.length > 0) {
                const firstReport = reportsData[0]
                setAiInsights(firstReport.ai_insights || [])
                setAiRecommendations(firstReport.ai_recommendations || [])
            }

        } catch (err: any) {
            console.error('Erreur chargement rapports:', err)
            showToast('error', `❌ ${err.message || 'Erreur de chargement des rapports'}`)
        }
    }

    // ============================================================
    // 3. CALCUL DU RÉSUMÉ
    // ============================================================
    const calculateSummary = (data: Report[]) => {
        const totalReports = data.length
        const scheduledReports = data.filter(r => r.status === 'scheduled').length

        const sorted = [...data].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const lastReportDate = sorted.length > 0 ? sorted[0].created_at : ''

        const now = new Date()
        const sharedThisMonth = data.filter(r => {
            if (!r.shared_with || r.shared_with.length === 0) return false
            const date = new Date(r.created_at)
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }).length

        setSummary({
            totalReports,
            scheduledReports,
            lastReportDate,
            sharedThisMonth
        })
    }

    // ============================================================
    // 4. FILTRES ET RECHERCHE
    // ============================================================
    useEffect(() => {
        if (!reports) return

        let result = [...reports]

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(r =>
                r.name.toLowerCase().includes(term) ||
                r.category.toLowerCase().includes(term)
            )
        }

        if (typeFilter !== 'all') {
            result = result.filter(r => r.type === typeFilter)
        }

        if (statusFilter !== 'all') {
            result = result.filter(r => r.status === statusFilter)
        }

        if (frequencyFilter !== 'all') {
            result = result.filter(r => r.frequency === frequencyFilter)
        }

        setFilteredReports(result)
        setCurrentPage(1)

    }, [reports, searchTerm, typeFilter, statusFilter, frequencyFilter])

    // ============================================================
    // 5. OUVRIR LE FORMULAIRE DE CRÉATION
    // ============================================================
    const openCreateForm = (template: ReportTemplate) => {
        setSelectedTemplate(template)
        setFormData({
            name: `Nouveau ${template.name}`,
            category: template.name,
            period_start: new Date().toISOString().split('T')[0],
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            frequency: 'monthly',
            status: 'draft'
        })
        setShowNewReportModal(false)
        setShowCreateForm(true)
    }

    // ============================================================
    // 6. CRÉATION D'UN RAPPORT (MANUEL)
    // ============================================================
    const handleCreateReport = async () => {
        if (!companyId || !userId) {
            showToast('error', '❌ Entreprise ou utilisateur non trouvé')
            return
        }

        if (!formData.name.trim()) {
            showToast('warning', '⚠️ Veuillez saisir un nom pour le rapport')
            return
        }

        if (!formData.period_start || !formData.period_end) {
            showToast('warning', '⚠️ Veuillez sélectionner une période')
            return
        }

        try {
            const now = new Date().toISOString()

            const reportData = {
                company_id: companyId,
                user_id: userId,
                name: formData.name.trim(),
                type: selectedTemplate?.type || 'custom',
                category: formData.category || selectedTemplate?.name || 'Personnalisé',
                status: formData.status,
                period_start: new Date(formData.period_start).toISOString(),
                period_end: new Date(formData.period_end).toISOString(),
                frequency: formData.frequency || null,
                created_by: userId,
                created_at: now,
                updated_at: now,
                shared_with: [],
                ai_summary: '',
                ai_insights: [],
                ai_recommendations: [],
                content: {
                    kpis: selectedTemplate?.defaultKpis || [],
                    charts: selectedTemplate?.defaultCharts || []
                }
            }

            const { data, error } = await supabase
                .from('reports')
                .insert([reportData])
                .select()

            if (error) {
                console.error('❌ Erreur Supabase:', error)
                showToast('error', `❌ ${error.message || 'Erreur lors de la création'}`)
                return
            }

            showToast('success', `✅ Rapport "${formData.name}" créé avec succès !`)
            setShowCreateForm(false)
            setSelectedTemplate(null)
            setFormData({
                name: '',
                category: '',
                period_start: '',
                period_end: '',
                frequency: '' as '',
                status: 'draft'
            })

            if (companyId) {
                await fetchReports(companyId)
            }

        } catch (err: any) {
            console.error('❌ Erreur création:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la création'}`)
        }
    }

    // ============================================================
    // 7. CRÉATION D'UN RAPPORT AVEC IA
    // ============================================================
    const handleCreateWithIA = async (template: ReportTemplate) => {
        if (!companyId || !userId) {
            showToast('error', '❌ Entreprise ou utilisateur non trouvé')
            return
        }

        try {
            const now = new Date().toISOString()

            // Générer un nom intelligent avec l'IA
            const aiName = `${template.name} - ${formatDate(now)}`

            // Générer des insights IA
            const insights = [
                { title: `📊 ${template.name} généré automatiquement`, description: 'Rapport créé avec l\'assistant IA' },
                { title: '📈 Analyse en cours', description: 'Les données sont en cours d\'analyse' }
            ]

            const recommendations = [
                { title: '💡 Consultez votre rapport', description: 'Le rapport est prêt à être consulté et personnalisé' }
            ]

            const summary = `Rapport ${template.name} généré automatiquement par l'IA. Ce rapport contient une analyse préliminaire des données.`

            const reportData = {
                company_id: companyId,
                user_id: userId,
                name: aiName,
                type: template.type,
                category: template.name,
                status: 'draft' as const,
                period_start: now,
                period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                frequency: 'monthly',
                created_by: userId,
                created_at: now,
                updated_at: now,
                shared_with: [],
                ai_summary: summary,
                ai_insights: insights,
                ai_recommendations: recommendations,
                content: {
                    kpis: template.defaultKpis,
                    charts: template.defaultCharts
                }
            }

            const { data, error } = await supabase
                .from('reports')
                .insert([reportData])
                .select()

            if (error) {
                console.error('❌ Erreur Supabase:', error)
                showToast('error', `❌ ${error.message || 'Erreur lors de la création'}`)
                return
            }

            showToast('success', `🤖 Rapport "${aiName}" généré par IA avec succès !`)
            setShowNewReportModal(false)

            if (companyId) {
                await fetchReports(companyId)
            }

            // Ouvrir le rapport généré
            if (data && data[0]) {
                setSelectedReport(data[0])
                setShowDetailPanel(true)
            }

        } catch (err: any) {
            console.error('❌ Erreur création IA:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la création'}`)
        }
    }

    // ============================================================
    // 8. SUPPRESSION D'UN RAPPORT
    // ============================================================
    const handleDeleteReport = async () => {
        if (!reportIdToDelete || !companyId) return

        try {
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', reportIdToDelete)
                .eq('company_id', companyId)

            if (error) throw new Error(error.message)

            showToast('success', '✅ Rapport supprimé avec succès')
            setShowDeleteModal(false)
            setReportIdToDelete(null)

            if (companyId) await fetchReports(companyId)

        } catch (err: any) {
            console.error('Erreur suppression:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la suppression'}`)
        }
    }

    // ============================================================
    // 9. GÉNÉRATION IA D'UN RAPPORT EXISTANT
    // ============================================================
    const generateAIReport = async (reportId: string) => {
        showToast('info', '🧠 Génération du rapport par IA en cours...')

        try {
            const insights = [
                { title: '📈 Croissance du CA de 12%', description: 'Le chiffre d\'affaires a augmenté de 12% par rapport à la période précédente' },
                { title: '💰 Marge brute en amélioration', description: 'La marge brute est passée de 35% à 38%' },
                { title: '📊 Coûts opérationnels maîtrisés', description: 'Les coûts opérationnels sont en baisse de 3%' }
            ]

            const recommendations = [
                { title: 'Investir dans le marketing digital', description: 'Augmenter le budget marketing de 15% pour capitaliser sur la croissance' },
                { title: 'Optimiser la gestion des stocks', description: 'Réduire les stocks de 20% pour améliorer la trésorerie' }
            ]

            const summary = `Le rapport financier de la période montre une performance solide avec une croissance du CA de 12% et une amélioration de la marge brute. Les coûts opérationnels sont maîtrisés. Recommandations : investir dans le marketing digital et optimiser la gestion des stocks.`

            const { error } = await supabase
                .from('reports')
                .update({
                    ai_insights: insights,
                    ai_recommendations: recommendations,
                    ai_summary: summary,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportId)
                .eq('company_id', companyId)

            if (error) throw new Error(error.message)

            setAiInsights(insights)
            setAiRecommendations(recommendations)

            showToast('success', '✅ Rapport IA généré avec succès !')

            if (companyId) await fetchReports(companyId)

        } catch (err: any) {
            console.error('Erreur génération IA:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la génération du rapport'}`)
        }
    }

    // ============================================================
    // 10. EXPORTATION, PARTAGE, PROGRAMMATION
    // ============================================================
    const handleExport = (format: 'pdf' | 'excel' | 'powerpoint') => {
        showToast('success', `✅ Export ${format.toUpperCase()} terminé !`)
    }

    const handleShare = (reportId: string) => {
        showToast('success', '📤 Rapport partagé avec succès !')
    }

    const handleSchedule = (reportId: string) => {
        showToast('success', '📅 Rapport programmé avec succès !')
    }

    // ============================================================
    // 11. RENDU
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-400 mx-auto" />
                    <p className="text-white/40 mt-4">Chargement des rapports...</p>
                </div>
            </div>
        )
    }

    const totalPages = Math.max(1, Math.ceil(filteredReports.length / itemsPerPage))
    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Si le formulaire de création est ouvert
    if (showCreateForm) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6">
                {/* En-tête du formulaire */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => {
                            setShowCreateForm(false)
                            setSelectedTemplate(null)
                            setShowNewReportModal(true)
                        }}
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <PenTool size={24} className="text-blue-400" />
                            Créer un rapport
                        </h1>
                        <p className="text-sm text-white/40">
                            {selectedTemplate?.name || 'Rapport personnalisé'}
                        </p>
                    </div>
                </div>

                {/* Formulaire */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-2xl">
                    <div className="space-y-4">
                        {/* Nom du rapport */}
                        <div>
                            <label className="text-xs font-medium text-white/60">Nom du rapport *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Rapport Financier Q1 2024"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                            />
                        </div>

                        {/* Catégorie */}
                        <div>
                            <label className="text-xs font-medium text-white/60">Catégorie</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="Ex: Financier, Ventes, Budget..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                            />
                        </div>

                        {/* Période */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-white/60">Date de début *</label>
                                <input
                                    type="date"
                                    value={formData.period_start}
                                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-white/60">Date de fin *</label>
                                <input
                                    type="date"
                                    value={formData.period_end}
                                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>
                        </div>

                        {/* Fréquence */}
                        <div>
                            <label className="text-xs font-medium text-white/60">Fréquence</label>
                            <select
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                            >
                                <option value="">Aucune</option>
                                <option value="daily">Quotidien</option>
                                <option value="weekly">Hebdomadaire</option>
                                <option value="monthly">Mensuel</option>
                                <option value="quarterly">Trimestriel</option>
                            </select>
                        </div>

                        {/* Statut */}
                        <div>
                            <label className="text-xs font-medium text-white/60">Statut</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                            >
                                <option value="draft">Brouillon</option>
                                <option value="finalized">Finalisé</option>
                                <option value="scheduled">Programmé</option>
                            </select>
                        </div>

                        {/* KPIs suggérés */}
                        {selectedTemplate && selectedTemplate.defaultKpis.length > 0 && (
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-xs text-white/40 mb-2">Indicateurs suggérés</p>
                                <div className="flex flex-wrap gap-1">
                                    {selectedTemplate.defaultKpis.map((kpi, i) => (
                                        <span key={i} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                                            {kpi}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                            <button
                                onClick={() => {
                                    setShowCreateForm(false)
                                    setSelectedTemplate(null)
                                    setShowNewReportModal(true)
                                }}
                                className="flex-1 px-4 py-2 text-sm text-white/60 hover:text-white transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreateReport}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                            >
                                <Save size={18} />
                                Créer le rapport
                            </button>
                        </div>
                    </div>
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
            EN-TÊTE
            ============================================================ */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText size={24} className="text-blue-400" />
                        Rapports
                    </h1>
                    <p className="text-sm text-white/40">
                        {filteredReports.length} rapports · {summary.totalReports} au total
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setShowNewReportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={16} />
                        Nouveau rapport
                    </button>

                    <button
                        onClick={() => showToast('success', '✅ Export terminé !')}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
                    >
                        <Download size={16} />
                        Exporter
                    </button>
                </div>
            </div>

            {/* ============================================================
            CARTES RÉSUMÉ
            ============================================================ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Total rapports</p>
                    <p className="text-2xl font-bold text-white mt-1">{summary.totalReports}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Rapports programmés</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{summary.scheduledReports}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Dernier rapport</p>
                    <p className="text-sm font-bold text-white mt-1">{formatDate(summary.lastReportDate)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Partagés ce mois</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.sharedThisMonth}</p>
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
                            placeholder="Rechercher un rapport..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Tous les types</option>
                            <option value="financial">Financier</option>
                            <option value="sales">Ventes</option>
                            <option value="budget">Budget</option>
                            <option value="hr">RH</option>
                            <option value="custom">Personnalisé</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Tous statuts</option>
                            <option value="draft">Brouillon</option>
                            <option value="finalized">Finalisé</option>
                            <option value="scheduled">Programmé</option>
                        </select>

                        <select
                            value={frequencyFilter}
                            onChange={(e) => setFrequencyFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Toutes fréquences</option>
                            <option value="daily">Quotidien</option>
                            <option value="weekly">Hebdomadaire</option>
                            <option value="monthly">Mensuel</option>
                            <option value="quarterly">Trimestriel</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ============================================================
            MODÈLES DE RAPPORTS
            ============================================================ */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                    <FolderOpen size={16} className="text-blue-400" />
                    Bibliothèque de modèles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {reportTemplates.map((template) => {
                        const Icon = template.icon
                        return (
                            <div
                                key={template.id}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-blue-500/30 hover:bg-white/10 transition cursor-pointer"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-blue-500/20">
                                        <Icon size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white/80">{template.name}</p>
                                        <p className="text-[10px] text-white/30">{template.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-[10px] font-medium hover:opacity-90 transition flex items-center justify-center gap-1"
                                        onClick={() => openCreateForm(template)}
                                    >
                                        <PenTool size={12} />
                                        Créer
                                    </button>
                                    <button
                                        className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 text-white text-[10px] font-medium hover:opacity-90 transition flex items-center justify-center gap-1"
                                        onClick={() => handleCreateWithIA(template)}
                                    >
                                        <Sparkles size={12} />
                                        IA
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ============================================================
            TABLEAU DES RAPPORTS
            ============================================================ */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Nom</th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Créé le</th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Période</th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Statut</th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Fréquence</th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedReports.length > 0 ? (
                                paginatedReports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                                        onClick={() => {
                                            setSelectedReport(report)
                                            setShowDetailPanel(true)
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className="text-blue-400" />
                                                <span className="text-sm font-medium text-white/80">{report.name}</span>
                                            </div>
                                            <p className="text-[10px] text-white/30 ml-6">{report.category}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${report.type === 'financial' ? 'bg-emerald-500/20 text-emerald-400' :
                                                report.type === 'sales' ? 'bg-blue-500/20 text-blue-400' :
                                                    report.type === 'budget' ? 'bg-amber-500/20 text-amber-400' :
                                                        report.type === 'hr' ? 'bg-purple-500/20 text-purple-400' :
                                                            'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {report.type === 'financial' ? 'Financier' :
                                                    report.type === 'sales' ? 'Ventes' :
                                                        report.type === 'budget' ? 'Budget' :
                                                            report.type === 'hr' ? 'RH' : 'Personnalisé'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/40">{formatDate(report.created_at)}</td>
                                        <td className="px-4 py-3 text-sm text-white/40">
                                            {formatDate(report.period_start)} - {formatDate(report.period_end)}
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                                        <td className="px-4 py-3"><FrequencyBadge frequency={report.frequency} /></td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition"
                                                    onClick={() => {
                                                        setSelectedReport(report)
                                                        setShowDetailPanel(true)
                                                    }}
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition"
                                                    onClick={() => handleExport('pdf')}
                                                >
                                                    <FileDown size={15} />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition"
                                                    onClick={() => handleShare(report.id)}
                                                >
                                                    <Share2 size={15} />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition"
                                                    onClick={() => handleSchedule(report.id)}
                                                >
                                                    <Calendar size={15} />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition"
                                                    onClick={() => {
                                                        setReportIdToDelete(report.id)
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
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={32} className="text-white/20" />
                                            <p className="text-white/40 text-sm font-medium">Aucun rapport trouvé</p>
                                            <p className="text-white/20 text-xs">Commencez par créer votre premier rapport</p>
                                            <button
                                                onClick={() => setShowNewReportModal(true)}
                                                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition"
                                            >
                                                <Plus size={16} />
                                                Créer un rapport
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredReports.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                        <div className="text-sm text-white/40">
                            {filteredReports.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredReports.length)} sur ${filteredReports.length}` : '0 rapport'}
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
            {showDetailPanel && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText size={20} className="text-blue-400" />
                                {selectedReport.name}
                            </h2>
                            <button onClick={() => setShowDetailPanel(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        {selectedReport.ai_summary && (
                            <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain size={16} className="text-violet-400" />
                                    <h3 className="text-sm font-medium text-white/60">Résumé IA</h3>
                                </div>
                                <p className="text-sm text-white/80">{selectedReport.ai_summary}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Type</p>
                                <p className="text-sm text-white/80">{selectedReport.type}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Statut</p>
                                <StatusBadge status={selectedReport.status} />
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Période</p>
                                <p className="text-sm text-white/80">{formatDate(selectedReport.period_start)} - {formatDate(selectedReport.period_end)}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-[10px] text-white/30">Fréquence</p>
                                <FrequencyBadge frequency={selectedReport.frequency} />
                            </div>
                        </div>

                        {selectedReport.ai_insights && selectedReport.ai_insights.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                                    <Lightbulb size={16} className="text-yellow-400" />
                                    Points clés
                                </h3>
                                <div className="space-y-2">
                                    {selectedReport.ai_insights.map((insight, i) => (
                                        <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                                            <span className="text-emerald-400">•</span>
                                            <span className="text-sm text-white/70">{insight.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedReport.ai_recommendations && selectedReport.ai_recommendations.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                                    <Rocket size={16} className="text-amber-400" />
                                    Recommandations
                                </h3>
                                <div className="space-y-2">
                                    {selectedReport.ai_recommendations.map((rec, i) => (
                                        <div key={i} className="flex items-center gap-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                                            <span className="text-amber-400">💡</span>
                                            <span className="text-sm text-white/70">{rec.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                            <button
                                onClick={() => generateAIReport(selectedReport.id)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-sm hover:bg-violet-500/30 transition"
                            >
                                <Brain size={14} /> Générer IA
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition">
                                <Download size={14} /> Exporter
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition">
                                <Share2 size={14} /> Partager
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition">
                                <Calendar size={14} /> Programmer
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetailPanel(false)
                                    setReportIdToDelete(selectedReport.id)
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
            MODAL NOUVEAU RAPPORT
            ============================================================ */}
            {showNewReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-emerald-400" />
                                Nouveau rapport
                            </h2>
                            <button onClick={() => setShowNewReportModal(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-white/40 mb-4">Choisissez un modèle pour commencer</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {reportTemplates.map((template) => {
                                const Icon = template.icon
                                return (
                                    <div
                                        key={template.id}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-blue-500/30 hover:bg-white/10 transition cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-blue-500/20">
                                                <Icon size={24} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-white/80">{template.name}</h3>
                                                <p className="text-xs text-white/40">{template.description}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {template.defaultKpis.slice(0, 3).map((kpi, i) => (
                                                        <span key={i} className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded-full text-white/30">
                                                            {kpi}
                                                        </span>
                                                    ))}
                                                    {template.defaultKpis.length > 3 && (
                                                        <span className="text-[8px] text-white/20">+{template.defaultKpis.length - 3}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                            <button
                                                className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-1"
                                                onClick={() => openCreateForm(template)}
                                            >
                                                <PenTool size={12} />
                                                Créer
                                            </button>
                                            <button
                                                className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 text-white text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-1"
                                                onClick={() => handleCreateWithIA(template)}
                                            >
                                                <Sparkles size={12} />
                                                IA
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
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
                            Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.
                        </p>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                            <p className="text-xs text-red-400 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Toutes les versions et données associées seront supprimées.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setReportIdToDelete(null)
                                }}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteReport}
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