'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    TrendingUp,
    Wallet,
    CreditCard,
    PiggyBank,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    ChevronDown,
    Bell,
    Settings,
    LogOut,
    Moon,
    Sun,
    Menu,
    X,
    Home,
    Eye,
    Download,
    FileText,
    Users,
    Activity,
    Sparkles,
    Plus,
    Search,
    DollarSign,
    ShoppingBag,
    Coffee,
    Home as HomeIcon,
    Car,
    Film,
    Gift,
    HelpCircle,
    User,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Types
interface Transaction {
    id: string
    name: string
    amount: number
    type: 'income' | 'expense'
    date: string
    category: string
    icon: any
    color: string
}

interface Stat {
    label: string
    value: number
    change: number
    icon: any
    color: string
}

export default function UserDashboard() {
    const router = useRouter()
    const supabase = createClient()

    // États
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [theme, setTheme] = useState<"light" | "dark">("dark")
    const [activeTab, setActiveTab] = useState('dashboard')
    const [showNotification, setShowNotification] = useState(true)

    // Données dynamiques
    const [stats, setStats] = useState<Stat[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [totalBalance, setTotalBalance] = useState(0)
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [totalExpenses, setTotalExpenses] = useState(0)

    // Icons pour les catégories
    const categoryIcons: Record<string, any> = {
        'Salary': DollarSign,
        'Rent': HomeIcon,
        'Shopping': ShoppingBag,
        'Coffee': Coffee,
        'Transport': Car,
        'Entertainment': Film,
        'Gift': Gift,
        'Food': ShoppingBag,
        'Utilities': HomeIcon,
        'Other': FileText
    }

    // Couleurs par catégorie
    const categoryColors: Record<string, string> = {
        'Salary': 'text-green-400',
        'Rent': 'text-red-400',
        'Shopping': 'text-purple-400',
        'Coffee': 'text-yellow-400',
        'Transport': 'text-blue-400',
        'Entertainment': 'text-pink-400',
        'Gift': 'text-orange-400',
        'Food': 'text-indigo-400',
        'Utilities': 'text-cyan-400',
        'Other': 'text-gray-400'
    }

    // Navigation menu
    const menuItems = [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'transactions', label: 'Transactions', icon: Wallet },
        { id: 'analytics', label: 'Analyses', icon: BarChart3 },
        { id: 'reports', label: 'Rapports', icon: FileText },
        { id: 'settings', label: 'Paramètres', icon: Settings },
        { id: 'help', label: 'Aide', icon: HelpCircle },
    ]

    // Récupérer les vraies données
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Récupérer la session
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    router.push('/login')
                    return
                }

                setUser(session.user)

                // Récupérer le profil
                const { data: profileData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

                if (profileData) {
                    setProfile(profileData)
                }

                // Simuler des données réelles (à remplacer par vos appels API)
                // Dans un vrai projet, vous récupérez ces données de Supabase

                // Statistiques
                const revenue = 24000
                const expenses = 6079
                const balance = revenue - expenses
                const totalUsers = 1
                const totalTransactions = 142
                const growth = 15.2

                setTotalRevenue(revenue)
                setTotalExpenses(expenses)
                setTotalBalance(balance)

                setStats([
                    { label: 'Revenu total', value: revenue, change: 15.2, icon: TrendingUp, color: 'text-green-400' },
                    { label: 'Dépenses', value: expenses, change: -8.2, icon: ArrowDownRight, color: 'text-red-400' },
                    { label: 'Crédit réel', value: balance, change: 12.5, icon: Wallet, color: 'text-blue-400' },
                    { label: 'Transactions', value: totalTransactions, change: 23.4, icon: Activity, color: 'text-purple-400' },
                ])

                // Transactions
                const mockTransactions: Transaction[] = [
                    { id: '1', name: 'Salaire', amount: 15000, type: 'income', date: '2026-08-09', category: 'Salary', icon: DollarSign, color: 'text-green-400' },
                    { id: '2', name: 'Loyer', amount: -3200, type: 'expense', date: '2026-08-08', category: 'Rent', icon: HomeIcon, color: 'text-red-400' },
                    { id: '3', name: 'Carrefour', amount: -850, type: 'expense', date: '2026-08-07', category: 'Shopping', icon: ShoppingBag, color: 'text-red-400' },
                    { id: '4', name: 'Café', amount: -45, type: 'expense', date: '2026-08-07', category: 'Coffee', icon: Coffee, color: 'text-red-400' },
                    { id: '5', name: 'Transport', amount: -120, type: 'expense', date: '2026-08-06', category: 'Transport', icon: Car, color: 'text-red-400' },
                    { id: '6', name: 'Netflix', amount: -79, type: 'expense', date: '2026-08-05', category: 'Entertainment', icon: Film, color: 'text-red-400' },
                    { id: '7', name: 'Cadeau anniversaire', amount: -250, type: 'expense', date: '2026-08-04', category: 'Gift', icon: Gift, color: 'text-red-400' },
                ]
                setTransactions(mockTransactions)

            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router, supabase])

    // Gestion du thème
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.className = savedTheme === "dark" ? "dark" : ""
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark"
        setTheme(newTheme)
        localStorage.setItem("theme", newTheme)
        document.documentElement.className = newTheme === "dark" ? "dark" : ""
    }

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed)
    }

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(amount))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#03030b] text-white flex">

            {/* =====================================================
                SIDEBAR
            ====================================================== */}
            <aside className={`
                fixed lg:relative z-50 h-screen 
                ${sidebarCollapsed ? 'w-20' : 'w-64'} 
                bg-[#0a0a1a]/95 backdrop-blur-xl border-r border-white/5
                transition-all duration-300 ease-in-out
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className={`
                        flex items-center h-16 px-4 border-b border-white/5
                        ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
                    `}>
                        <Link href="/" className="flex items-center gap-3">
                            <img src="/dai-logo.png" alt="DAI" className="h-8 w-auto" />
                            {!sidebarCollapsed && (
                                <div className="flex flex-col leading-tight">
                                    <span className="text-sm font-bold text-white">DecisionAI</span>
                                    <span className="text-[8px] font-medium text-blue-400">BY ESSALHI</span>
                                </div>
                            )}
                        </Link>
                        {!sidebarCollapsed && (
                            <button onClick={toggleSidebar} className="text-white/40 hover:text-white">
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>

                    {/* Menu */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const isActive = activeTab === item.id
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                                        ${sidebarCollapsed ? 'justify-center' : ''}
                                        ${isActive
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                                        }
                                    `}
                                >
                                    <Icon size={20} />
                                    {!sidebarCollapsed && (
                                        <span className="text-sm font-medium">{item.label}</span>
                                    )}
                                    {isActive && !sidebarCollapsed && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 space-y-2">
                        <button
                            onClick={toggleTheme}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                text-white/40 hover:text-white hover:bg-white/5 transition-colors
                                ${sidebarCollapsed ? 'justify-center' : ''}
                            `}
                        >
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                            {!sidebarCollapsed && <span className="text-sm">Mode {theme === "dark" ? 'Clair' : 'Sombre'}</span>}
                        </button>
                        <button
                            onClick={handleLogout}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors
                                ${sidebarCollapsed ? 'justify-center' : ''}
                            `}
                        >
                            <LogOut size={18} />
                            {!sidebarCollapsed && <span className="text-sm">Déconnexion</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* =====================================================
                MAIN CONTENT
            ====================================================== */}
            <div className="flex-1 flex flex-col min-h-screen">

                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-[#03030b]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="lg:hidden text-white/60 hover:text-white"
                            >
                                <Menu size={24} />
                            </button>
                            <h2 className="text-lg font-semibold text-white">
                                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="relative p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                                <Bell size={20} />
                                {showNotification && (
                                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                                )}
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex items-center gap-2">
                                    <span className="text-sm text-white/60">{profile?.full_name || user?.email}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                        {profile?.role || 'USER'}
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                                    <span className="text-sm font-semibold">
                                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">

                    {/* Dashboard Content */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">

                            {/* Welcome */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        Bonjour, {profile?.full_name || 'Utilisateur'} 👋
                                    </h1>
                                    <p className="text-white/40 text-sm">Voici un aperçu de votre activité</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <Calendar size={16} className="text-white/40" />
                                        <span className="text-sm text-white/60">Mois courant</span>
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {stats.map((stat, index) => {
                                    const Icon = stat.icon
                                    return (
                                        <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-white/40">{stat.label}</span>
                                                <Icon className={stat.color} size={20} />
                                            </div>
                                            <p className="text-2xl font-bold text-white">
                                                {stat.label === 'Transactions' ? stat.value : formatCurrency(stat.value)}
                                            </p>
                                            <p className={`text-xs ${stat.change >= 0 ? 'text-green-400' : 'text-red-400'} mt-1`}>
                                                {stat.change >= 0 ? '+' : ''}{stat.change}%
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Dépenses et bénéfices */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Dépenses et bénéfices</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-white/60">Revenu</span>
                                                <span className="text-green-400">{formatCurrency(totalRevenue)}</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-400 rounded-full" style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-white/60">Dépenses</span>
                                                <span className="text-red-400">{formatCurrency(totalExpenses)}</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-400 rounded-full" style={{ width: `${(totalExpenses / totalRevenue) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-white/60">Bénéfice</span>
                                                <span className="text-blue-400">{formatCurrency(totalBalance)}</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(totalBalance / totalRevenue) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Santé financière */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-white">Santé financière</h3>
                                        <Sparkles className="text-yellow-400" size={18} />
                                    </div>
                                    <div className="text-center py-6">
                                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-500/20 border border-green-500/30">
                                            <span className="text-2xl">🟢</span>
                                            <span className="text-lg font-semibold text-green-400">Situation maîtrisée</span>
                                        </div>
                                        <p className="text-white/40 text-sm mt-4">
                                            Score basé sur les revenus, dépenses, budgets et objectifs d'épargne
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Transactions récentes */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">Transactions récentes</h3>
                                    <button
                                        onClick={() => setActiveTab('transactions')}
                                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Voir tout
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {transactions.slice(0, 5).map((transaction) => {
                                        const Icon = transaction.icon
                                        const isIncome = transaction.type === 'income'
                                        return (
                                            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${isIncome ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                        <Icon size={16} className={transaction.color} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white font-medium">{transaction.name}</p>
                                                        <p className="text-xs text-white/40">{transaction.date}</p>
                                                    </div>
                                                </div>
                                                <p className={`text-sm font-semibold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transactions Tab */}
                    {activeTab === 'transactions' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white">Transactions</h2>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                                    <Plus size={16} />
                                    <span className="text-sm">Nouvelle transaction</span>
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher..."
                                        className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400/50"
                                    />
                                </div>
                                <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 transition-colors">
                                    Filtres
                                </button>
                                <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 transition-colors">
                                    Tri
                                </button>
                            </div>

                            {/* Transactions List */}
                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="text-left text-xs font-medium text-white/40 px-6 py-3">Nom</th>
                                            <th className="text-left text-xs font-medium text-white/40 px-6 py-3">Catégorie</th>
                                            <th className="text-left text-xs font-medium text-white/40 px-6 py-3">Date</th>
                                            <th className="text-right text-xs font-medium text-white/40 px-6 py-3">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((transaction) => {
                                            const Icon = transaction.icon
                                            const isIncome = transaction.type === 'income'
                                            return (
                                                <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-full ${isIncome ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                                <Icon size={14} className={transaction.color} />
                                                            </div>
                                                            <span className="text-sm text-white">{transaction.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                                                            {transaction.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-white/60">{transaction.date}</td>
                                                    <td className={`px-6 py-3 text-right text-sm font-semibold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                                                        {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Other Tabs Placeholder */}
                    {['analytics', 'reports', 'settings', 'help'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                {menuItems.find(item => item.id === activeTab) && (
                                    (() => {
                                        const Item = menuItems.find(item => item.id === activeTab)
                                        const Icon = Item?.icon || LayoutDashboard
                                        return <Icon size={32} className="text-white/30" />
                                    })()
                                )}
                            </div>
                            <h2 className="text-xl font-semibold text-white/60">
                                {menuItems.find(item => item.id === activeTab)?.label || 'Page'}
                            </h2>
                            <p className="text-white/30 text-sm mt-2">
                                Cette section sera bientôt disponible
                            </p>
                        </div>
                    )}

                </main>
            </div>
        </div>
    )
}