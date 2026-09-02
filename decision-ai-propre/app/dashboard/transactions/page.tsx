'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowUp, ArrowDown, Calendar, Download, Share2, TrendingUp,
    Users, DollarSign, PieChart as PieChartIcon, Target, AlertCircle, CheckCircle,
    Loader2, Brain, MapPin, Building2, Award, Bell, Clock, Sparkles,
    AlertTriangle, Info, ArrowRight, Settings, LogOut, Search, Globe,
    Pin, Maximize2, Filter, X, ChevronDown, Radio, Home,
    RefreshCw, Plus, Edit, Trash2, Eye, CreditCard, Wallet,
    Receipt, FileText, Printer, Copy, Ban, RotateCcw, Check,
    AlertOctagon, MoreHorizontal, ChevronLeft, ChevronRight, FileSpreadsheet,
    FileDown
} from 'lucide-react'

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ComposedChart, Line, Bar, PieChart as RePieChart,
    Pie, Cell, BarChart as ReBarChart
} from 'recharts'

// ============================================================
// TYPES
// ============================================================

interface Transaction {
    id: string
    created_at: string
    company_id: string
    user_id: string
    client_name: string
    client_email?: string
    client_phone?: string
    amount: number
    currency: string
    type: string
    payment_method: string
    status: string
    region: string
    agency: string
    channel: string
    description?: string
    invoice_id?: string
    metadata?: any
}

// ============================================================
// COMPOSANTS UTILITAIRES
// ============================================================

const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
        completed: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Check, label: 'Réussi' },
        pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock, label: 'En attente' },
        failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertOctagon, label: 'Échoué' },
        cancelled: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Ban, label: 'Annulé' },
        refunded: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: RotateCcw, label: 'Remboursé' },
    }
    const c = config[status] || config.pending
    const Icon = c.icon
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${c.color}`}>
            <Icon size={10} />
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

export default function TransactionsPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [showDetailPanel, setShowDetailPanel] = useState(false)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)
    const [showExportMenu, setShowExportMenu] = useState(false)

    // Filtres
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [paymentFilter, setPaymentFilter] = useState<string>('all')
    const [regionFilter, setRegionFilter] = useState<string>('all')
    const [minAmount, setMinAmount] = useState('')
    const [maxAmount, setMaxAmount] = useState('')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [sortField, setSortField] = useState<string>('created_at')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        totalAmount: 0,
        averageAmount: 0,
        failedRate: 0,
        evolution: 0
    })

    // Graphiques
    const [chartData, setChartData] = useState<any[]>([])
    const [paymentDistribution, setPaymentDistribution] = useState<any[]>([])
    const [statusDistribution, setStatusDistribution] = useState<any[]>([])

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

                // Récupérer les transactions
                const { data: transactionsData, error: transactionsError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('company_id', company.id)
                    .order('created_at', { ascending: false })

                if (transactionsError) {
                    console.warn('⚠️ Erreur chargement transactions:', transactionsError)
                    setTransactions([])
                } else {
                    const formattedData = transactionsData?.map(t => ({
                        ...t,
                        amount: t.amount || 0,
                        currency: t.currency || 'MAD',
                        status: t.status || 'pending',
                        type: t.type || 'autre',
                        payment_method: t.payment_method || 'autre',
                    })) || []

                    setTransactions(formattedData)
                }

            } catch (err: any) {
                console.error('Erreur:', err)
                setTransactions([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // ============================================================
    // 2. Filtrage et tri (calculé à chaque changement)
    // ============================================================
    const filteredTransactions = useMemo(() => {
        if (!transactions || transactions.length === 0) {
            return []
        }

        let result = [...transactions]

        // ✅ Recherche
        if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim()
            result = result.filter(t =>
                t.id?.toLowerCase().includes(term) ||
                t.client_name?.toLowerCase().includes(term) ||
                t.amount?.toString().includes(term) ||
                t.client_email?.toLowerCase().includes(term) ||
                t.client_phone?.toLowerCase().includes(term) ||
                t.description?.toLowerCase().includes(term) ||
                t.invoice_id?.toLowerCase().includes(term) ||
                t.region?.toLowerCase().includes(term) ||
                t.agency?.toLowerCase().includes(term)
            )
            console.log(`🔍 Recherche "${term}" : ${result.length} résultat(s)`)
        }

        // ✅ Filtres
        if (statusFilter !== 'all') {
            result = result.filter(t => t.status === statusFilter)
        }
        if (typeFilter !== 'all') {
            result = result.filter(t => t.type === typeFilter)
        }
        if (paymentFilter !== 'all') {
            result = result.filter(t => t.payment_method === paymentFilter)
        }
        if (regionFilter !== 'all') {
            result = result.filter(t => t.region === regionFilter)
        }
        if (minAmount) {
            result = result.filter(t => (t.amount || 0) >= parseFloat(minAmount))
        }
        if (maxAmount) {
            result = result.filter(t => (t.amount || 0) <= parseFloat(maxAmount))
        }

        // ✅ Tri
        result.sort((a, b) => {
            let aVal = a[sortField as keyof Transaction] as any
            let bVal = b[sortField as keyof Transaction] as any
            if (typeof aVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
            }
            return sortDirection === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
        })

        return result
    }, [transactions, searchTerm, statusFilter, typeFilter, paymentFilter, regionFilter, minAmount, maxAmount, sortField, sortDirection])

    // ============================================================
    // 3. Calcul des stats et graphiques
    // ============================================================
    useEffect(() => {
        if (!filteredTransactions || filteredTransactions.length === 0) {
            setStats({ total: 0, totalAmount: 0, averageAmount: 0, failedRate: 0, evolution: 0 })
            setChartData([])
            setPaymentDistribution([])
            setStatusDistribution([])
            setCurrentPage(1)
            return
        }

        // Stats
        const total = filteredTransactions.length
        const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
        const averageAmount = total > 0 ? totalAmount / total : 0
        const failed = filteredTransactions.filter(t => t.status === 'failed' || t.status === 'cancelled').length
        const failedRate = total > 0 ? (failed / total) * 100 : 0

        const sorted = [...filteredTransactions].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        const midPoint = Math.floor(sorted.length / 2)
        const firstHalf = sorted.slice(0, midPoint)
        const secondHalf = sorted.slice(midPoint)
        const firstTotal = firstHalf.reduce((sum, t) => sum + (t.amount || 0), 0)
        const secondTotal = secondHalf.reduce((sum, t) => sum + (t.amount || 0), 0)
        const evolution = firstTotal > 0 ? ((secondTotal - firstTotal) / firstTotal) * 100 : 0

        setStats({ total, totalAmount, averageAmount, failedRate, evolution })

        // Graphique évolution
        const grouped = filteredTransactions.reduce((acc: any, t) => {
            const date = new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
            if (!acc[date]) {
                acc[date] = { day: date, count: 0, amount: 0 }
            }
            acc[date].count += 1
            acc[date].amount += t.amount || 0
            return acc
        }, {})
        setChartData(Object.values(grouped).slice(-7))

        // Répartition paiements
        const paymentGroup = filteredTransactions.reduce((acc: any, t) => {
            const method = t.payment_method || 'autre'
            if (!acc[method]) acc[method] = 0
            acc[method] += 1
            return acc
        }, {})
        const colors: Record<string, string> = {
            card: '#6366f1', bank_transfer: '#8b5cf6', cash: '#06b6d4', mobile: '#10b981', autre: '#f59e0b'
        }
        const labels: Record<string, string> = {
            card: 'Carte', bank_transfer: 'Virement', cash: 'Espèces', mobile: 'Mobile', autre: 'Autre'
        }
        setPaymentDistribution(Object.entries(paymentGroup).map(([name, value]) => ({
            name: labels[name] || name,
            value,
            color: colors[name] || '#f59e0b'
        })))

        // Répartition statuts
        const statusGroup = filteredTransactions.reduce((acc: any, t) => {
            const status = t.status || 'pending'
            if (!acc[status]) acc[status] = 0
            acc[status] += 1
            return acc
        }, {})
        const statusColors: Record<string, string> = {
            completed: '#10b981', pending: '#f59e0b', failed: '#ef4444', cancelled: '#6b7280', refunded: '#3b82f6'
        }
        const statusLabels: Record<string, string> = {
            completed: 'Réussi', pending: 'En attente', failed: 'Échoué', cancelled: 'Annulé', refunded: 'Remboursé'
        }
        setStatusDistribution(Object.entries(statusGroup).map(([name, value]) => ({
            name: statusLabels[name] || name,
            value,
            color: statusColors[name] || '#6b7280'
        })))

        setCurrentPage(1)
    }, [filteredTransactions])

    // ============================================================
    // 4. Pagination
    // ============================================================
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // ============================================================
    // 5. Actions
    // ============================================================
    const toggleSelectAll = () => {
        if (selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0) {
            setSelectedTransactions([])
        } else {
            setSelectedTransactions(paginatedTransactions.map(t => t.id))
        }
    }

    const toggleSelect = (id: string) => {
        if (selectedTransactions.includes(id)) {
            setSelectedTransactions(selectedTransactions.filter(s => s !== id))
        } else {
            setSelectedTransactions([...selectedTransactions, id])
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

    const handleViewTransaction = (transaction: Transaction) => {
        setSelectedTransaction(transaction)
        setShowDetailPanel(true)
    }

    const handleNewTransaction = () => {
        router.push('/dashboard/transactions/new')
    }

    // ============================================================
    // 6. EXPORTATION
    // ============================================================
    const convertToCSV = (data: Transaction[]) => {
        const headers = [
            'ID', 'Date', 'Client', 'Email', 'Téléphone', 'Montant', 'Devise',
            'Type', 'Paiement', 'Statut', 'Région', 'Agence', 'Canal', 'Description', 'Facture'
        ]
        const rows = data.map(t => [
            t.id,
            new Date(t.created_at).toLocaleString('fr-FR'),
            t.client_name || '',
            t.client_email || '',
            t.client_phone || '',
            t.amount || 0,
            t.currency || 'MAD',
            getTypeLabel(t.type),
            getPaymentLabel(t.payment_method),
            getStatusLabel(t.status),
            t.region || '',
            t.agency || '',
            t.channel || '',
            t.description || '',
            t.invoice_id || ''
        ])
        return [headers, ...rows]
    }

    const exportCSV = (data: Transaction[], filename: string = 'transactions') => {
        const csvData = convertToCSV(data)
        const csvContent = csvData.map(row => row.join(';')).join('\n')
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
    }

    const exportExcel = (data: Transaction[], filename: string = 'transactions') => {
        const csvData = convertToCSV(data)
        let xlsContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">'
        xlsContent += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Transactions</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>'
        xlsContent += '<body><table>'
        csvData.forEach(row => {
            xlsContent += '<tr>'
            row.forEach(cell => {
                xlsContent += `<td>${cell}</td>`
            })
            xlsContent += '</tr>'
        })
        xlsContent += '</table></body></html>'
        const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xls`
        link.click()
        URL.revokeObjectURL(link.href)
    }

    const handleExport = (format: 'csv' | 'excel') => {
        setIsExporting(true)
        const dataToExport = selectedTransactions.length > 0
            ? filteredTransactions.filter(t => selectedTransactions.includes(t.id))
            : filteredTransactions

        if (dataToExport.length === 0) {
            alert('Aucune transaction à exporter')
            setIsExporting(false)
            return
        }

        const filename = `transactions_${new Date().toISOString().slice(0, 10)}`

        try {
            if (format === 'csv') {
                exportCSV(dataToExport, filename)
            } else {
                exportExcel(dataToExport, filename)
            }
        } catch (error) {
            console.error('Erreur export:', error)
            alert('Erreur lors de l\'exportation')
        } finally {
            setIsExporting(false)
            setShowExportMenu(false)
        }
    }

    // ============================================================
    // 7. Formatage
    // ============================================================
    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A'
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        } catch {
            return dateStr
        }
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            sale: 'Vente', refund: 'Remboursement', subscription: 'Abonnement', transfer: 'Transfert', autre: 'Autre'
        }
        return labels[type] || type
    }

    const getPaymentLabel = (method: string) => {
        const labels: Record<string, string> = {
            card: 'Carte', bank_transfer: 'Virement', cash: 'Espèces', mobile: 'Mobile', autre: 'Autre'
        }
        return labels[method] || method
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            completed: 'Réussi', pending: 'En attente', failed: 'Échoué', cancelled: 'Annulé', refunded: 'Remboursé'
        }
        return labels[status] || status
    }

    // ============================================================
    // 8. Rendu
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
            EN-TÊTE
            ============================================================ */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Transactions</h1>
                    <p className="text-sm text-white/40">
                        {filteredTransactions.length} transactions · {stats.totalAmount.toLocaleString()} MAD
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleNewTransaction}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={16} />
                        Nouvelle transaction
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
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition"
                                >
                                    <FileSpreadsheet size={16} className="text-green-400" />
                                    Exporter en CSV
                                </button>
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition"
                                >
                                    <FileSpreadsheet size={16} className="text-blue-400" />
                                    Exporter en Excel
                                </button>
                                {selectedTransactions.length > 0 && (
                                    <div className="border-t border-white/5 px-4 py-2 text-[10px] text-white/30">
                                        {selectedTransactions.length} transaction(s) sélectionnée(s)
                                    </div>
                                )}
                            </div>
                        )}
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
                            placeholder="Rechercher par ID, client, montant..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                            >
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
                            <option value="completed">Réussi</option>
                            <option value="pending">En attente</option>
                            <option value="failed">Échoué</option>
                            <option value="cancelled">Annulé</option>
                            <option value="refunded">Remboursé</option>
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Tous types</option>
                            <option value="sale">Vente</option>
                            <option value="subscription">Abonnement</option>
                            <option value="refund">Remboursement</option>
                            <option value="transfer">Transfert</option>
                            <option value="autre">Autre</option>
                        </select>

                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Tous paiements</option>
                            <option value="card">Carte</option>
                            <option value="bank_transfer">Virement</option>
                            <option value="cash">Espèces</option>
                            <option value="mobile">Mobile</option>
                            <option value="autre">Autre</option>
                        </select>

                        <select
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Toutes régions</option>
                            {[...new Set(transactions.map(t => t.region).filter(Boolean))].map(region => (
                                <option key={region} value={region}>{region}</option>
                            ))}
                        </select>

                        <button className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-white/30">Montant :</span>
                    <input
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        placeholder="Min"
                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition"
                    />
                    <span className="text-white/20">-</span>
                    <input
                        type="number"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        placeholder="Max"
                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition"
                    />
                    <span className="text-[10px] text-white/30">MAD</span>
                </div>
            </div>

            {/* ============================================================
            CARTES RÉSUMÉ
            ============================================================ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Total transactions</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                    <p className="text-[10px] text-emerald-400">{stats.evolution > 0 ? '+' : ''}{stats.evolution.toFixed(1)}% vs période préc.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Montant total</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalAmount.toLocaleString()} MAD</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Moyenne par transaction</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.averageAmount.toFixed(0)} MAD</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Taux d'échec</p>
                    <p className={`text-2xl font-bold mt-1 ${stats.failedRate > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {stats.failedRate.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* ============================================================
            GRAPHIQUES
            ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-medium text-white/60 mb-4">Évolution des transactions</h3>
                    <div className="h-40">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                                    <XAxis dataKey="day" stroke="#ffffff30" fontSize={10} />
                                    <YAxis stroke="#ffffff30" fontSize={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }} />
                                    <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/25 text-sm">Aucune donnée disponible</div>
                        )}
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-medium text-white/60 mb-4">Répartition des paiements</h3>
                    <div className="h-40">
                        {paymentDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={paymentDistribution}
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
                                        {paymentDistribution.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color || '#6366f1'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RePieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/25 text-sm">Aucune donnée disponible</div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================================
            TABLEAU PRINCIPAL
            ============================================================ */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {selectedTransactions.length > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
                        <span className="text-sm text-white/60">{selectedTransactions.length} sélectionnée(s)</span>
                        <button className="text-xs text-red-400 hover:text-red-300 transition">Supprimer</button>
                        <button className="text-xs text-blue-400 hover:text-blue-300 transition">Exporter</button>
                        <button className="text-xs text-white/30 hover:text-white/50 transition ml-auto" onClick={() => setSelectedTransactions([])}>
                            Désélectionner tout
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => handleSort('id')}>
                                    ID
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => handleSort('created_at')}>
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => handleSort('client_name')}>
                                    Client
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60 transition" onClick={() => handleSort('amount')}>
                                    Montant
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Paiement</th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Statut</th>
                                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Région</th>
                                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map((transaction) => (
                                    <tr
                                        key={transaction.id}
                                        className={`border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${selectedTransactions.includes(transaction.id) ? 'bg-blue-500/5' : ''}`}
                                        onClick={() => handleViewTransaction(transaction)}
                                    >
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedTransactions.includes(transaction.id)}
                                                onChange={() => toggleSelect(transaction.id)}
                                                className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono text-white/70">{transaction.id?.slice(0, 8) || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm text-white/60">{formatDate(transaction.created_at)}</td>
                                        <td className="px-4 py-3 text-sm text-white/80">{transaction.client_name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-white">
                                            {(transaction.amount || 0).toLocaleString()} {transaction.currency || 'MAD'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">{getTypeLabel(transaction.type)}</td>
                                        <td className="px-4 py-3 text-sm text-white/60">{getPaymentLabel(transaction.payment_method)}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={transaction.status} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">{transaction.region || 'N/A'}</td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition"
                                                    onClick={() => handleViewTransaction(transaction)}
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                <button className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition">
                                                    <Edit size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-white/30">
                                        Aucune transaction trouvée
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ============================================================
                PAGINATION
                ============================================================ */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                    <div className="text-sm text-white/40">
                        {filteredTransactions.length > 0 ? (
                            `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredTransactions.length)} sur ${filteredTransactions.length}`
                        ) : (
                            '0 transaction'
                        )}
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
                            <span className="text-sm text-white/40 px-2">
                                {currentPage} / {totalPages || 1}
                            </span>
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
            </div>

            {/* ============================================================
            PANEL DE DÉTAIL
            ============================================================ */}
            {showDetailPanel && selectedTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Détail de la transaction</h2>
                            <button
                                onClick={() => setShowDetailPanel(false)}
                                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-white/30">ID Transaction</p>
                                    <p className="text-sm font-mono text-white/80">{selectedTransaction.id}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/30">Date</p>
                                    <p className="text-sm text-white/80">{formatDate(selectedTransaction.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/30">Client</p>
                                    <p className="text-sm text-white/80">{selectedTransaction.client_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/30">Montant</p>
                                    <p className="text-sm font-bold text-white">{(selectedTransaction.amount || 0).toLocaleString()} {selectedTransaction.currency || 'MAD'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/30">Type</p>
                                    <p className="text-sm text-white/80">{getTypeLabel(selectedTransaction.type)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/30">Statut</p>
                                    <StatusBadge status={selectedTransaction.status} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/30">Méthode de paiement</p>
                                    <p className="text-sm text-white/80">{getPaymentLabel(selectedTransaction.payment_method)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/30">Région</p>
                                    <p className="text-sm text-white/80">{selectedTransaction.region || 'N/A'}</p>
                                </div>
                            </div>

                            {selectedTransaction.description && (
                                <div className="pt-4 border-t border-white/5">
                                    <p className="text-[10px] text-white/30">Description</p>
                                    <p className="text-sm text-white/60">{selectedTransaction.description}</p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                                {selectedTransaction.invoice_id && (
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition">
                                        <FileText size={14} /> Voir la facture
                                    </button>
                                )}
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition">
                                    <Printer size={14} /> Imprimer
                                </button>
                                {selectedTransaction.status === 'completed' && (
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition">
                                        <RotateCcw size={14} /> Rembourser
                                    </button>
                                )}
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <p className="text-xs font-medium text-white/40 mb-2">Historique</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle size={14} className="text-emerald-400" />
                                        <span className="text-white/60">Transaction créée</span>
                                        <span className="text-[10px] text-white/20 ml-auto">{formatDate(selectedTransaction.created_at)}</span>
                                    </div>
                                    {selectedTransaction.status === 'completed' && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <CheckCircle size={14} className="text-emerald-400" />
                                            <span className="text-white/60">Paiement confirmé</span>
                                            <span className="text-[10px] text-white/20 ml-auto">{formatDate(selectedTransaction.created_at)}</span>
                                        </div>
                                    )}
                                    {selectedTransaction.status === 'failed' && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <AlertOctagon size={14} className="text-red-400" />
                                            <span className="text-white/60">Paiement échoué</span>
                                            <span className="text-[10px] text-white/20 ml-auto">{formatDate(selectedTransaction.created_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <p className="text-xs font-medium text-white/40 mb-2">Notes internes</p>
                                <textarea
                                    placeholder="Ajouter une note..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}