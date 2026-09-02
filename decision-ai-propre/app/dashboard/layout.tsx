'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Repeat,
    Tag,
    Wallet,
    Target,
    LineChart,
    FileText,
    Trophy,
    Award,
    Bot,
    Bell,
    User,
    HelpCircle,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    Brain,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp
} from 'lucide-react'

interface MenuItem {
    name: string
    icon: React.ReactNode
    href: string
    active?: boolean
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(true)
    const [theme, setTheme] = useState<'light' | 'dark'>('dark')
    const [user, setUser] = useState<any>(null)
    const [companyName, setCompanyName] = useState<string>('')
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [fullName, setFullName] = useState<string>('')

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.className = savedTheme === 'dark' ? 'dark' : ''
        }

        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)

            // ✅ Récupérer les informations du profil (avatar, nom complet)
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single()

            if (profile) {
                setFullName(profile.full_name || '')
                setAvatarUrl(profile.avatar_url || null)
            }

            const { data: company } = await supabase
                .from('companies')
                .select('name')
                .eq('user_id', user.id)
                .single()

            if (company) {
                setCompanyName(company.name)
            }
        }
        getUser()
    }, [router, supabase])

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.className = newTheme === 'dark' ? 'dark' : ''
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const menuItems: MenuItem[] = [
        { name: 'Tableau de bord', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
        { name: 'Transactions', icon: <Repeat size={20} />, href: '/dashboard/transactions' },
        { name: 'Catégories', icon: <Tag size={20} />, href: '/dashboard/categories' },
        { name: 'Budgets', icon: <Wallet size={20} />, href: '/dashboard/budgets' },
        { name: 'Objectifs d\'épargne', icon: <Target size={20} />, href: '/dashboard/savings-goals' },
        { name: 'Prévisions', icon: <LineChart size={20} />, href: '/dashboard/forecasts' },
        { name: 'Rapports', icon: <FileText size={20} />, href: '/dashboard/reports' },
        { name: 'Défis', icon: <Trophy size={20} />, href: '/dashboard/challenges' },
        { name: 'Badges', icon: <Award size={20} />, href: '/dashboard/badges' },
        { name: 'Assistant', icon: <Bot size={20} />, href: '/dashboard/assistant' },
        { name: 'Notifications', icon: <Bell size={20} />, href: '/dashboard/notifications' },
        { name: 'Profil', icon: <User size={20} />, href: '/dashboard/profile' },
        { name: 'Aide', icon: <HelpCircle size={20} />, href: '/dashboard/help' },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#03030b] via-[#0a0a1a] to-[#1a1a3e] text-white">
            {/* Background Effects */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute top-[10%] right-[20%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[130px]" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#03030b]/80 backdrop-blur-2xl border-b border-white/5">
                <div className="flex items-center justify-between px-4 h-16">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <img src="/dai-logo.png" alt="DAI" className="h-8 w-auto" />
                            <span className="text-sm font-bold text-white">DecisionAI</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        {/* ✅ Avatar mobile */}
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.email?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-[#03030b]/90 backdrop-blur-xl">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <img src="/dai-logo.png" alt="DAI" className="h-8 w-auto" />
                                <span className="text-sm font-bold text-white">DecisionAI</span>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => {
                                            router.push(item.href)
                                            setIsMobileMenuOpen(false)
                                        }}
                                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium
                                            ${isActive
                                                ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-white border border-blue-500/30'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {item.icon}
                                        {item.name}
                                        {isActive && (
                                            <span className="ml-auto w-1.5 h-8 rounded-full bg-gradient-to-b from-blue-400 to-violet-400" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                            >
                                <LogOut size={20} />
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed left-0 top-0 h-full z-40
                bg-[#03030b]/90 backdrop-blur-2xl border-r border-white/5
                transition-all duration-300 ease-in-out
                ${isMenuOpen ? (isCollapsed ? 'w-20' : 'w-64') : 'w-0 overflow-hidden border-0'}
                hidden lg:block
            `}>
                {/* Logo */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-16 px-4 border-b border-white/5`}>
                    <div className={`flex items-center gap-2 ${isCollapsed ? 'hidden' : 'flex'}`}>
                        <img src="/dai-logo.png" alt="DAI" className="h-8 w-auto" />
                        <div className="flex flex-col leading-tight">
                            <span className="text-sm font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">DecisionAI</span>
                            <span className="text-[8px] font-medium text-blue-400 tracking-[0.3em] uppercase">BY ESSALHI</span>
                        </div>
                    </div>
                    {isCollapsed && (
                        <img src="/dai-logo.png" alt="DAI" className="h-8 w-auto" />
                    )}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1" style={{ height: 'calc(100% - 140px)' }}>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <button
                                key={item.name}
                                onClick={() => router.push(item.href)}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium
                                    ${isActive
                                        ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-white border border-blue-500/30'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }
                                    ${isCollapsed ? 'justify-center px-2' : 'px-4'}
                                `}
                                title={isCollapsed ? item.name : ''}
                            >
                                {item.icon}
                                {!isCollapsed && item.name}
                                {isActive && !isCollapsed && (
                                    <span className="ml-auto w-1.5 h-8 rounded-full bg-gradient-to-b from-blue-400 to-violet-400" />
                                )}
                                {isActive && isCollapsed && (
                                    <span className="absolute right-0 w-1.5 h-8 rounded-full bg-gradient-to-b from-blue-400 to-violet-400" />
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Footer - Déconnexion en bas avec Avatar */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 ${isCollapsed ? 'flex justify-center' : ''}`}>
                    <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : 'justify-between w-full'}`}>
                        <div className="flex items-center gap-2">
                            {/* ✅ Avatar utilisateur avec photo */}
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user?.email?.[0]?.toUpperCase() || 'U'
                                )}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-white truncate">
                                        {fullName || companyName || 'Utilisateur'}
                                    </p>
                                    <p className="text-[10px] text-white/40 truncate">{user?.email || ''}</p>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                    {isCollapsed && (
                        <button
                            onClick={handleLogout}
                            className="mt-2 p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </aside>

            {/* Bouton pour afficher/masquer le menu */}
            <button
                onClick={toggleMenu}
                className="hidden lg:fixed lg:block z-50 left-4 top-20 p-2 rounded-lg bg-[#03030b]/80 backdrop-blur-2xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                style={{ left: isMenuOpen ? (isCollapsed ? '76px' : '252px') : '16px' }}
            >
                {isMenuOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            {/* Main Content */}
            <main className={`
                transition-all duration-300 ease-in-out
                ${isMenuOpen ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-64') : 'lg:ml-0'}
                pt-16 lg:pt-0
            `}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    {children}
                </div>
            </main>
        </div>
    )
}