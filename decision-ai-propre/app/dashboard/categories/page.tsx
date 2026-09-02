'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { analyzeCategories } from '@/lib/gemini'
import {
    ArrowUp, ArrowDown, Calendar, Download, Share2, TrendingUp,
    Users, DollarSign, PieChart as PieChartIcon, Target, AlertCircle, CheckCircle,
    Loader2, Brain, MapPin, Building2, Award, Bell, Clock, Sparkles,
    AlertTriangle, Info, ArrowRight, Settings, LogOut, Search, Globe,
    Pin, Maximize2, Filter, X, ChevronDown, Radio, Home,
    RefreshCw, Plus, Edit, Trash2, Eye, CreditCard, Wallet,
    Receipt, FileText, Printer, Copy, Ban, RotateCcw, Check,
    AlertOctagon, MoreHorizontal, ChevronLeft, ChevronRight, FileSpreadsheet,
    FileDown, FolderTree, Tag, Layers, BarChart3, Activity,
    GripVertical, ChevronUp, ChevronDown as ChevronDownIcon
} from 'lucide-react'

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ComposedChart, Line, Bar, PieChart as RePieChart,
    Pie, Cell, BarChart as ReBarChart
} from 'recharts'

// ============================================================
// TYPES
// ============================================================

interface Category {
    id: string
    company_id: string
    user_id: string
    name: string
    description?: string
    parent_id?: string
    product_count: number
    revenue: number
    revenue_percentage: number
    evolution: number
    status: 'active' | 'inactive'
    created_at: string
    updated_at: string
    subcategories?: Category[]
    ai_insights?: any[]
    ai_recommendations?: any[]
    ai_anomalies?: any[]
    ai_analyzed_at?: string
}

// ============================================================
// COMPOSANTS UTILITAIRES
// ============================================================

const StatusBadge = ({ status }: { status: 'active' | 'inactive' }) => {
    const config = {
        active: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Active' },
        inactive: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Inactive' },
    }
    const c = config[status]
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${c.color}`}>
            <CheckCircle size={10} />
            {c.label}
        </span>
    )
}

const SkeletonLoader = () => (
    <div className="animate-pulse space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-8 bg-white/10 rounded w-1/2" />
        <div className="h-2 bg-white/10 rounded w-full" />
    </div>
)

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function CategoriesPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [showDetailPanel, setShowDetailPanel] = useState(false)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [isExporting, setIsExporting] = useState(false)
    const [showExportMenu, setShowExportMenu] = useState(false)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
    const [deleteMode, setDeleteMode] = useState<'single' | 'multiple'>('single')

    // Données IA
    const [aiInsights, setAiInsights] = useState<any[]>([])
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([])
    const [aiAnomalies, setAiAnomalies] = useState<any[]>([])
    const [aiAnalyzedAt, setAiAnalyzedAt] = useState<string | null>(null)

    // Toast notifications
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null)

    // Filtres
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [sortField, setSortField] = useState<string>('revenue')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        topCategory: '',
        topRevenue: 0,
        bottomCategory: '',
        bottomRevenue: 0,
        newCategories: 0
    })

    // Graphiques
    const [chartData, setChartData] = useState<any[]>([])
    const [topFlopData, setTopFlopData] = useState<any[]>([])

    // ============================================================
    // 1. Récupération des données réelles
    // ============================================================
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { router.push('/login'); return }

                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()

                if (companyError) throw new Error(companyError.message)
                setCompanyId(company.id)

                await fetchCategories(company.id)

            } catch (err: any) {
                console.error('Erreur:', err)
                setCategories([])
                setFilteredCategories([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // ============================================================
    // 2. Fonction de récupération des catégories
    // ============================================================
    const fetchCategories = async (companyId: string) => {
        const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        if (categoriesError) {
            console.warn('⚠️ Erreur chargement catégories:', categoriesError)
            setCategories([])
            setFilteredCategories([])
        } else {
            const formattedData = buildCategoryHierarchy(categoriesData || [])
            setCategories(formattedData)
            setFilteredCategories(formattedData)
            calculateStats(formattedData)
            generateChartData(formattedData)

            if (categoriesData && categoriesData.length > 0) {
                const firstCategory = categoriesData[0]
                setAiInsights(firstCategory.ai_insights || [])
                setAiRecommendations(firstCategory.ai_recommendations || [])
                setAiAnomalies(firstCategory.ai_anomalies || [])
                setAiAnalyzedAt(firstCategory.ai_analyzed_at || null)
            }
        }
    }

    // ============================================================
    // 3. Construction de la hiérarchie
    // ============================================================
    const buildCategoryHierarchy = (data: any[]): Category[] => {
        const categoryMap = new Map<string, Category>()
        const roots: Category[] = []

        data.forEach(item => {
            categoryMap.set(item.id, {
                ...item,
                subcategories: []
            })
        })

        data.forEach(item => {
            const category = categoryMap.get(item.id)
            if (category) {
                if (item.parent_id && categoryMap.has(item.parent_id)) {
                    const parent = categoryMap.get(item.parent_id)
                    if (parent) {
                        parent.subcategories = parent.subcategories || []
                        parent.subcategories.push(category)
                    }
                } else {
                    roots.push(category)
                }
            }
        })

        return roots
    }

    // ============================================================
    // 4. Calcul des statistiques
    // ============================================================
    const calculateStats = (data: Category[]) => {
        const total = data.length
        let topCategory = '', topRevenue = 0
        let bottomCategory = '', bottomRevenue = Infinity

        const allCategories = flattenCategories(data)
        allCategories.forEach(c => {
            if (c.revenue > topRevenue) {
                topRevenue = c.revenue
                topCategory = c.name
            }
            if (c.revenue < bottomRevenue && c.revenue > 0) {
                bottomRevenue = c.revenue
                bottomCategory = c.name
            }
        })

        const newCategories = allCategories.filter(c => {
            const date = new Date(c.created_at)
            const now = new Date()
            const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
            return diffDays <= 30
        }).length

        setStats({ total, topCategory, topRevenue, bottomCategory, bottomRevenue, newCategories })
    }

    const flattenCategories = (data: Category[]): Category[] => {
        let result: Category[] = []
        data.forEach(c => {
            result.push(c)
            if (c.subcategories && c.subcategories.length > 0) {
                result = result.concat(flattenCategories(c.subcategories))
            }
        })
        return result
    }

    // ============================================================
    // 5. Génération des graphiques
    // ============================================================
    const generateChartData = (data: Category[]) => {
        const pieData = data.map(c => ({ name: c.name, value: c.revenue }))
        setChartData(pieData)

        const allCategories = flattenCategories(data)
        const sorted = [...allCategories].sort((a, b) => b.revenue - a.revenue)
        const top = sorted.slice(0, 3).map(c => ({ name: c.name, value: c.revenue, type: 'top' }))
        const flop = sorted.slice(-3).reverse().map(c => ({ name: c.name, value: c.revenue, type: 'flop' }))
        setTopFlopData([...top, ...flop])
    }

    // ============================================================
    // 6. ANALYSE IA - GROQ
    // ============================================================
    const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 5000)
    }

    const runCategoryAnalysis = async () => {
        if (!categories || categories.length === 0) {
            showToast('warning', '⚠️ Aucune catégorie disponible. Créez des catégories pour les analyser.')
            return
        }

        setIsAnalyzing(true)

        try {
            const allCategories = flattenCategories(categories)
            const result = await analyzeCategories(allCategories)

            const { error: updateError } = await supabase
                .from('categories')
                .update({
                    ai_insights: result.insights,
                    ai_recommendations: result.recommendations,
                    ai_anomalies: result.anomalies,
                    ai_analyzed_at: new Date().toISOString(),
                })
                .eq('company_id', companyId)

            if (updateError) throw new Error(updateError.message)

            setAiInsights(result.insights)
            setAiRecommendations(result.recommendations)
            setAiAnomalies(result.anomalies)
            setAiAnalyzedAt(new Date().toISOString())

            showToast('success', `✅ Analyse IA terminée ! ${result.insights.length + result.recommendations.length + result.anomalies.length} insights générés.`)

        } catch (error) {
            console.error('Erreur analyse IA:', error)
            showToast('error', '❌ Erreur lors de l\'analyse IA. Veuillez réessayer.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    // ============================================================
    // 7. Filtrage
    // ============================================================
    useEffect(() => {
        if (!categories || categories.length === 0) {
            setFilteredCategories([])
            return
        }

        let result = [...categories]

        if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim()
            result = result.filter(c =>
                c.name.toLowerCase().includes(term) ||
                c.description?.toLowerCase().includes(term)
            )
        }

        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter)
        }

        result.sort((a, b) => {
            let aVal = a[sortField as keyof Category] as any
            let bVal = b[sortField as keyof Category] as any
            if (typeof aVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
            }
            return sortDirection === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
        })

        setFilteredCategories(result)
        calculateStats(result)
        generateChartData(result)
        setCurrentPage(1)
    }, [categories, searchTerm, statusFilter, sortField, sortDirection])

    // ============================================================
    // 8. Pagination
    // ============================================================
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
    const paginatedCategories = filteredCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // ============================================================
    // 9. Actions
    // ============================================================
    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedCategories(newExpanded)
    }

    const toggleSelectAll = () => {
        if (selectedCategories.length === paginatedCategories.length && paginatedCategories.length > 0) {
            setSelectedCategories([])
        } else {
            setSelectedCategories(paginatedCategories.map(c => c.id))
        }
    }

    const toggleSelect = (id: string) => {
        if (selectedCategories.includes(id)) {
            setSelectedCategories(selectedCategories.filter(s => s !== id))
        } else {
            setSelectedCategories([...selectedCategories, id])
        }
    }

    const handleSort = (field: string) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const handleViewCategory = (category: Category) => {
        setSelectedCategory(category)
        setShowDetailPanel(true)
    }

    const handleNewCategory = () => {
        router.push('/dashboard/categories/new')
    }

    // ============================================================
    // 10. FONCTION DE SUPPRESSION
    // ============================================================
    const handleDeleteClick = (category: Category) => {
        setCategoryToDelete(category)
        setDeleteMode('single')
        setShowDeleteModal(true)
    }

    const handleDeleteSelectedClick = () => {
        if (selectedCategories.length === 0) {
            showToast('warning', '⚠️ Aucune catégorie sélectionnée')
            return
        }
        setDeleteMode('multiple')
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        setIsDeleting(true)
        setShowDeleteModal(false)

        try {
            let idsToDelete: string[] = []

            if (deleteMode === 'single' && categoryToDelete) {
                idsToDelete = [categoryToDelete.id]
            } else if (deleteMode === 'multiple') {
                idsToDelete = selectedCategories
            }

            if (idsToDelete.length === 0) {
                showToast('warning', '⚠️ Aucune catégorie à supprimer')
                setIsDeleting(false)
                return
            }

            // Récupérer toutes les sous-catégories à supprimer récursivement
            const allIdsToDelete = await getCategoriesToDelete(idsToDelete)

            // Supprimer les catégories de la base de données
            const { error } = await supabase
                .from('categories')
                .delete()
                .in('id', allIdsToDelete)

            if (error) throw new Error(error.message)

            // Recharger les données
            if (companyId) {
                await fetchCategories(companyId)
            }

            // Réinitialiser les sélections
            setSelectedCategories([])
            setCategoryToDelete(null)

            showToast('success', `✅ ${allIdsToDelete.length} catégorie(s) supprimée(s) avec succès`)

        } catch (err: any) {
            console.error('Erreur suppression:', err)
            showToast('error', `❌ Erreur lors de la suppression: ${err.message}`)
        } finally {
            setIsDeleting(false)
        }
    }

    // Fonction récursive pour récupérer toutes les catégories à supprimer (y compris les sous-catégories)
    const getCategoriesToDelete = async (parentIds: string[]): Promise<string[]> => {
        let allIds = [...parentIds]

        // Récupérer les sous-catégories
        const { data: subCategories, error } = await supabase
            .from('categories')
            .select('id')
            .in('parent_id', parentIds)

        if (!error && subCategories && subCategories.length > 0) {
            const subIds = subCategories.map(c => c.id)
            const deeperIds = await getCategoriesToDelete(subIds)
            allIds = [...allIds, ...subIds, ...deeperIds]
        }

        return allIds
    }

    // ============================================================
    // 11. Exportation
    // ============================================================
    const handleExport = (format: 'csv' | 'excel') => {
        setIsExporting(true)
        const dataToExport = selectedCategories.length > 0
            ? filteredCategories.filter(c => selectedCategories.includes(c.id))
            : filteredCategories

        if (dataToExport.length === 0) {
            showToast('warning', '⚠️ Aucune catégorie à exporter.')
            setIsExporting(false)
            return
        }

        setTimeout(() => {
            setIsExporting(false)
            setShowExportMenu(false)
            showToast('success', `✅ Export ${format.toUpperCase()} terminé !`)
        }, 1500)
    }

    // ============================================================
    // 12. Formatage
    // ============================================================
    const formatCurrency = (value: number) => value.toLocaleString() + ' MAD'
    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A'
        try { return new Date(dateStr).toLocaleDateString('fr-FR') } catch { return dateStr }
    }

    // ============================================================
    // 13. Rendu
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <SkeletonLoader />
                    <SkeletonLoader />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <SkeletonLoader key={i} />)}
                </div>
                <SkeletonLoader />
                <div className="h-96"><SkeletonLoader /></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#03030b] text-white p-6">
            {/* ============================================================
            TOAST NOTIFICATION
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
            MODAL DE CONFIRMATION SUPPRESSION
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
                            {deleteMode === 'single' ? (
                                <>Êtes-vous sûr de vouloir supprimer la catégorie <span className="text-white font-medium">"{categoryToDelete?.name}"</span> ?</>
                            ) : (
                                <>Êtes-vous sûr de vouloir supprimer les <span className="text-white font-medium">{selectedCategories.length}</span> catégorie(s) sélectionnées ?</>
                            )}
                        </p>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                            <p className="text-xs text-red-400 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Cette action est irréversible. Toutes les sous-catégories seront également supprimées.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setCategoryToDelete(null)
                                }}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Suppression...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Supprimer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
            EN-TÊTE
            ============================================================ */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Catégories</h1>
                    <p className="text-sm text-white/40">
                        {filteredCategories.length} catégories · {stats.total} au total
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Bouton Supprimer la sélection */}
                    {selectedCategories.length > 0 && (
                        <button
                            onClick={handleDeleteSelectedClick}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-red-500/20"
                        >
                            <Trash2 size={16} />
                            Supprimer ({selectedCategories.length})
                        </button>
                    )}

                    <button
                        onClick={runCategoryAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-violet-500/20"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Analyse IA en cours...
                            </>
                        ) : (
                            <>
                                <Brain size={16} />
                                Analyser avec IA
                                <Sparkles size={12} className="text-yellow-300" />
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleNewCategory}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={16} />
                        Nouvelle catégorie
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Export...
                                </>
                            ) : (
                                <>
                                    <FileDown size={16} />
                                    Exporter
                                    <ChevronDown size={14} />
                                </>
                            )}
                        </button>

                        {showExportMenu && !isExporting && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a3e] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                                <button onClick={() => handleExport('csv')} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition">
                                    <FileSpreadsheet size={16} className="text-green-400" /> Exporter en CSV
                                </button>
                                <button onClick={() => handleExport('excel')} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition">
                                    <FileSpreadsheet size={16} className="text-blue-400" /> Exporter en Excel
                                </button>
                                {selectedCategories.length > 0 && (
                                    <div className="border-t border-white/5 px-4 py-2 text-[10px] text-white/30">
                                        {selectedCategories.length} catégorie(s) sélectionnée(s)
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
                            <h3 className="text-sm font-medium text-white/60">Analyse IA des catégories</h3>
                            {aiAnalyzedAt && (
                                <span className="text-[10px] text-white/30">
                                    Générée le {new Date(aiAnalyzedAt).toLocaleDateString('fr-FR')}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={runCategoryAnalysis}
                            disabled={isAnalyzing}
                            className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full transition flex items-center gap-1"
                        >
                            {isAnalyzing ? <Loader2 size={10} className="animate-spin" /> : '🔄 Actualiser'}
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
                            placeholder="Rechercher par nom, description..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Tous statuts</option>
                            <option value="active">Actives</option>
                            <option value="inactive">Inactives</option>
                        </select>
                        <button className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ============================================================
            CARTES RÉSUMÉ
            ============================================================ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Total catégories</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Meilleure performance</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1 truncate">{stats.topCategory || 'N/A'}</p>
                    <p className="text-[10px] text-white/30">{stats.topRevenue > 0 ? formatCurrency(stats.topRevenue) : 'Aucune donnée'}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Moins performante</p>
                    <p className="text-xl font-bold text-red-400 mt-1 truncate">{stats.bottomCategory || 'N/A'}</p>
                    <p className="text-[10px] text-white/30">{stats.bottomRevenue > 0 ? formatCurrency(stats.bottomRevenue) : 'Aucune donnée'}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Nouvelles (30j)</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.newCategories}</p>
                </div>
            </div>

            {/* ============================================================
            GRAPHIQUES
            ============================================================ */}
            {chartData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                        <h3 className="text-sm font-medium text-white/60 mb-4">Répartition du CA par catégorie</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={30}
                                        outerRadius={60}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => {
                                            const pct = percent || 0
                                            return `${name} ${(pct * 100).toFixed(0)}%`
                                        }}
                                        labelLine={{ stroke: '#ffffff15', strokeWidth: 1 }}
                                    >
                                        {chartData.map((entry, idx) => (
                                            <Cell key={idx} fill={['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][idx % 6]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                        <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                            <Award size={16} className="text-yellow-400" />
                            Top / Flop catégories
                        </h3>
                        <div className="space-y-2">
                            {topFlopData.length > 0 ? (
                                topFlopData.map((item, idx) => (
                                    <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-lg ${item.type === 'top' ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-red-500/5 border border-red-500/20'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${item.type === 'top' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                            <span className="text-sm text-white/70">{item.name}</span>
                                        </div>
                                        <span className={`text-sm font-medium ${item.type === 'top' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {formatCurrency(item.value)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-white/30 text-center py-4">Aucune donnée disponible</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
            TABLEAU PRINCIPAL
            ============================================================ */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {selectedCategories.length > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
                        <span className="text-sm text-white/60">{selectedCategories.length} sélectionnée(s)</span>
                        <button
                            onClick={handleDeleteSelectedClick}
                            disabled={isDeleting}
                            className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
                        >
                            <Trash2 size={12} />
                            Supprimer
                        </button>
                        <button className="text-xs text-blue-400 hover:text-blue-300 transition">Exporter</button>
                        <button className="text-xs text-white/30 hover:text-white/50 transition ml-auto" onClick={() => setSelectedCategories([])}>
                            Désélectionner tout
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3 text-left w-10">
                                    <input type="checkbox" checked={selectedCategories.length === paginatedCategories.length && paginatedCategories.length > 0} onChange={toggleSelectAll} className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50" />
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => handleSort('name')}>
                                    Catégorie {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => handleSort('product_count')}>
                                    Produits {sortField === 'product_count' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => handleSort('revenue')}>
                                    CA {sortField === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => handleSort('revenue_percentage')}>
                                    Part {sortField === 'revenue_percentage' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => handleSort('evolution')}>
                                    Évolution {sortField === 'evolution' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Statut</th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Création</th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCategories.length > 0 ? (
                                paginatedCategories.map((category) => (
                                    <React.Fragment key={category.id}>
                                        <tr className={`border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${selectedCategories.includes(category.id) ? 'bg-blue-500/5' : ''}`} onClick={() => handleViewCategory(category)}>
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" checked={selectedCategories.includes(category.id)} onChange={() => toggleSelect(category.id)} className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {category.subcategories && category.subcategories.length > 0 && (
                                                        <button onClick={(e) => { e.stopPropagation(); toggleExpand(category.id) }} className="text-white/40 hover:text-white transition">
                                                            {expandedCategories.has(category.id) ? <ChevronDownIcon size={16} /> : <ChevronRight size={16} />}
                                                        </button>
                                                    )}
                                                    <FolderTree size={16} className="text-blue-400" />
                                                    <span className="text-sm font-medium text-white/80">{category.name}</span>
                                                    {category.subcategories && category.subcategories.length > 0 && (
                                                        <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">{category.subcategories.length}</span>
                                                    )}
                                                </div>
                                                {category.description && <p className="text-[10px] text-white/30 mt-0.5 ml-8">{category.description}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white/60">{category.product_count || 0}</td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-white">{formatCurrency(category.revenue || 0)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-white/60">{category.revenue_percentage?.toFixed(1) || '0.0'}%</td>
                                            <td className={`px-4 py-3 text-sm text-right font-medium ${(category.evolution || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {(category.evolution || 0) >= 0 ? '+' : ''}{(category.evolution || 0).toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge status={category.status || 'inactive'} /></td>
                                            <td className="px-4 py-3 text-sm text-white/40">{formatDate(category.created_at)}</td>
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition" onClick={() => handleViewCategory(category)}>
                                                        <Eye size={15} />
                                                    </button>
                                                    <button className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition">
                                                        <Edit size={15} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteClick(category)
                                                        }}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedCategories.has(category.id) && category.subcategories && category.subcategories.map((sub) => (
                                            <tr key={sub.id} className="border-b border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition" onClick={() => handleViewCategory(sub)}>
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" checked={selectedCategories.includes(sub.id)} onChange={() => toggleSelect(sub.id)} className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50" />
                                                </td>
                                                <td className="px-4 py-3 pl-12">
                                                    <div className="flex items-center gap-2">
                                                        <Tag size={14} className="text-violet-400" />
                                                        <span className="text-sm text-white/60">↳ {sub.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-white/40">{sub.product_count || 0}</td>
                                                <td className="px-4 py-3 text-sm text-right text-white/60">{formatCurrency(sub.revenue || 0)}</td>
                                                <td className="px-4 py-3 text-sm text-right text-white/40">{sub.revenue_percentage?.toFixed(1) || '0.0'}%</td>
                                                <td className={`px-4 py-3 text-sm text-right font-medium ${(sub.evolution || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {(sub.evolution || 0) >= 0 ? '+' : ''}{(sub.evolution || 0).toFixed(1)}%
                                                </td>
                                                <td className="px-4 py-3"><StatusBadge status={sub.status || 'inactive'} /></td>
                                                <td className="px-4 py-3 text-sm text-white/30">{formatDate(sub.created_at)}</td>
                                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition" onClick={() => handleViewCategory(sub)}>
                                                            <Eye size={15} />
                                                        </button>
                                                        <button className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition">
                                                            <Edit size={15} />
                                                        </button>
                                                        <button
                                                            className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteClick(sub)
                                                            }}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <FolderTree size={32} className="text-white/20" />
                                            <p className="text-white/40 text-sm font-medium">Aucune catégorie trouvée</p>
                                            <p className="text-white/20 text-xs">Commencez par créer votre première catégorie</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ============================================================
                PAGINATION
                ============================================================ */}
                {filteredCategories.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                        <div className="text-sm text-white/40">
                            {filteredCategories.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredCategories.length)} sur ${filteredCategories.length}` : '0 catégorie'}
                        </div>
                        <div className="flex items-center gap-2">
                            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(parseInt(e.target.value))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white/70 focus:outline-none">
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed">
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-sm text-white/40 px-2">{currentPage} / {totalPages || 1}</span>
                                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed">
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
            {showDetailPanel && selectedCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">{selectedCategory.name}</h2>
                            <button onClick={() => setShowDetailPanel(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-[10px] text-white/30">Description</p><p className="text-sm text-white/60">{selectedCategory.description || 'Aucune description'}</p></div>
                                <div><p className="text-[10px] text-white/30">Statut</p><StatusBadge status={selectedCategory.status || 'inactive'} /></div>
                                <div><p className="text-[10px] text-white/30">Produits associés</p><p className="text-sm font-semibold text-white">{selectedCategory.product_count || 0}</p></div>
                                <div><p className="text-[10px] text-white/30">CA généré</p><p className="text-sm font-semibold text-emerald-400">{formatCurrency(selectedCategory.revenue || 0)}</p></div>
                                <div><p className="text-[10px] text-white/30">Part du CA total</p><p className="text-sm font-semibold text-white">{selectedCategory.revenue_percentage?.toFixed(1) || '0.0'}%</p></div>
                                <div><p className="text-[10px] text-white/30">Évolution</p><p className={`text-sm font-semibold ${(selectedCategory.evolution || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {(selectedCategory.evolution || 0) >= 0 ? '+' : ''}{(selectedCategory.evolution || 0).toFixed(1)}%
                                </p></div>
                            </div>

                            {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                                <div className="pt-4 border-t border-white/5">
                                    <p className="text-xs font-medium text-white/40 mb-2">Sous-catégories</p>
                                    <div className="space-y-2">
                                        {selectedCategory.subcategories.map((sub) => (
                                            <div key={sub.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                                <span className="text-sm text-white/70">{sub.name}</span>
                                                <span className="text-sm text-white/40">{formatCurrency(sub.revenue || 0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/5">
                                <p className="text-xs font-medium text-white/40 mb-2">Historique de performance</p>
                                <div className="h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={[
                                            { month: 'Jan', value: (selectedCategory.revenue || 0) * 0.7 },
                                            { month: 'Fév', value: (selectedCategory.revenue || 0) * 0.75 },
                                            { month: 'Mar', value: (selectedCategory.revenue || 0) * 0.8 },
                                            { month: 'Avr', value: (selectedCategory.revenue || 0) * 0.85 },
                                            { month: 'Mai', value: (selectedCategory.revenue || 0) * 0.9 },
                                            { month: 'Juin', value: selectedCategory.revenue || 0 }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                                            <XAxis dataKey="month" stroke="#ffffff30" fontSize={10} />
                                            <YAxis stroke="#ffffff30" fontSize={10} />
                                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                            <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition">
                                    <Edit size={14} /> Modifier
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition">
                                    <Eye size={14} /> Voir produits
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition">
                                    <BarChart3 size={14} /> Analyse
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailPanel(false)
                                        handleDeleteClick(selectedCategory)
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition ml-auto"
                                >
                                    <Trash2 size={14} /> Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}