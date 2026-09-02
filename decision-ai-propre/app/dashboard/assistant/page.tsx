'use client'

import React from 'react'
import { useState, useEffect, useRef } from 'react'
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
    Maximize2 as MaximizeIcon, Minimize2 as MinimizeIcon
} from 'lucide-react'

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ComposedChart, Line, Bar,
    PieChart as RePieChart, Pie, Cell, BarChart as ReBarChart
} from 'recharts'

// ============================================================
// TYPES
// ============================================================

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    chartData?: any[]
    tableData?: any[]
    actions?: string[]
    isTyping?: boolean
}

interface Conversation {
    id: string
    title: string
    messages: Message[]
    created_at: string
    updated_at: string
}

interface QuickSuggestion {
    id: string
    text: string
    icon: React.ElementType
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return 'N/A'
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'N/A'
    }
}

const formatCurrency = (value: number) => {
    if (!value && value !== 0) return '0,00 MAD'
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD'
}

// ============================================================
// COMPOSANTS
// ============================================================

const MessageBubble = ({ message, onActionClick }: {
    message: Message;
    onActionClick?: (action: string) => void
}) => {
    const isUser = message.role === 'user'

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-500/20' : 'bg-violet-500/20'}`}>
                    {isUser ? <UserIcon size={16} className="text-blue-400" /> : <Bot size={16} className="text-violet-400" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-blue-500/20 text-white' : 'bg-white/5 text-white/90'}`}>
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    {message.chartData && message.chartData.length > 0 && (
                        <div className="mt-4 h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={message.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} />
                                    <YAxis stroke="#ffffff30" fontSize={10} />
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" />
                                </ReBarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {message.tableData && message.tableData.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        {Object.keys(message.tableData[0]).map((key) => (
                                            <th key={key} className="px-3 py-1 text-left text-white/40 font-medium">
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {message.tableData.map((row: any, i: number) => (
                                        <tr key={i} className="border-b border-white/5">
                                            {Object.values(row).map((val: any, j: number) => (
                                                <td key={j} className="px-3 py-1 text-white/60">
                                                    {typeof val === 'number' ? formatCurrency(val) : val}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {message.actions && message.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {message.actions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => onActionClick?.(action)}
                                    className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition text-white/70"
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="text-[10px] text-white/30 mt-2">
                        {message.timestamp.toLocaleTimeString('fr-FR')}
                    </div>
                </div>
            </div>
        </div>
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
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md p-4 rounded-xl shadow-2xl backdrop-blur-xl border ${colors[type]}`}>
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

export default function AssistantPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [showHistory, setShowHistory] = useState(false)

    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // ============================================================
    // QUESTIONS RAPIDES
    // ============================================================
    const quickSuggestions: QuickSuggestion[] = [
        { id: '1', text: '📊 Résumé de ma situation financière', icon: BarChart3 },
        { id: '2', text: '💰 Quels sont mes revenus ce mois-ci ?', icon: TrendingUp },
        { id: '3', text: '💸 Quelles sont mes principales dépenses ?', icon: TrendingDown },
        { id: '4', text: '🎯 Quels sont mes objectifs d\'épargne ?', icon: Target },
        { id: '5', text: '📈 Prévisions de trésorerie', icon: LineChart },
        { id: '6', text: '🏆 Mes badges et défis en cours', icon: Trophy },
    ]

    // ============================================================
    // FONCTION TOAST
    // ============================================================
    const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 5000)
    }

    // ============================================================
    // SCROLL AUTO
    // ============================================================
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

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
                setUserId(user.id)

                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()

                if (companyError) throw new Error(companyError.message)
                setCompanyId(company.id)

                await fetchConversations(company.id)

                if (messages.length === 0) {
                    const welcomeMessage: Message = {
                        id: 'welcome',
                        role: 'assistant',
                        content: `👋 Bonjour ! Je suis Aria, votre assistant décisionnel.\n\nJe peux vous aider à analyser vos données financières, prévoir votre trésorerie, identifier des risques, et vous recommander des actions.\n\n**Voici ce que je sais faire :**\n- 📊 Résumé de votre situation financière\n- 💰 Analyse de vos revenus et dépenses\n- 📈 Prévisions de trésorerie\n- ⚠️ Détection des risques\n- 🎯 Suivi de vos objectifs d'épargne\n- 🏆 Progression de vos défis et badges\n- 💡 Recommandations personnalisées\n\nQue puis-je faire pour vous aujourd'hui ?`,
                        timestamp: new Date(),
                        actions: ['📊 Résumé financier', '💰 Analyse des dépenses', '📈 Prévisions']
                    }
                    setMessages([welcomeMessage])
                }

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
    // 2. RÉCUPÉRATION DES CONVERSATIONS
    // ============================================================
    const fetchConversations = async (companyId: string) => {
        if (!userId) return
        const { data } = await supabase
            .from('conversations')
            .select('*')
            .eq('company_id', companyId)
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })

        if (data && data.length > 0) {
            setConversations(data.map(c => ({
                ...c,
                messages: c.messages || []
            })))
        }
    }

    // ============================================================
    // 3. SAUVEGARDE DE LA CONVERSATION
    // ============================================================
    const saveConversation = async (messages: Message[]) => {
        if (!companyId || !userId) return

        const messagesToSave = messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString(),
            chartData: m.chartData || [],
            tableData: m.tableData || [],
            actions: m.actions || [],
            isTyping: m.isTyping || false
        }))

        const title = messages.length > 0 && messages[0].role === 'user'
            ? messages[0].content.slice(0, 50)
            : 'Nouvelle conversation'

        try {
            const now = new Date().toISOString()
            const conversationData = {
                company_id: companyId,
                user_id: userId,
                title: title,
                messages: messagesToSave,
                created_at: now,
                updated_at: now
            }

            let result
            if (currentConversation?.id) {
                result = await supabase
                    .from('conversations')
                    .update(conversationData)
                    .eq('id', currentConversation.id)
                    .select()
            } else {
                result = await supabase
                    .from('conversations')
                    .insert([conversationData])
                    .select()
            }

            if (result.error) throw result.error

            if (result.data && result.data.length > 0) {
                const newConv = {
                    ...result.data[0],
                    messages: messages
                }
                setConversations(prev => {
                    const filtered = prev.filter(c => c.id !== newConv.id)
                    return [newConv, ...filtered]
                })
                setCurrentConversation(newConv)
            }

        } catch (err) {
            console.error('Erreur sauvegarde:', err)
            showToast('error', '❌ Erreur lors de la sauvegarde')
        }
    }

    // ============================================================
    // 4. APPEL À L'API ASSISTANT (CORRIGÉ)
    // ============================================================
    const callAssistantAPI = async (question: string): Promise<any> => {
        try {
            console.log('📤 Envoi de la question à /api/assistant:', question)

            const response = await fetch('/api/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question,
                    conversationHistory: messages.slice(-5),
                    companyId,
                    userId
                })
            })

            console.log('📥 Statut de la réponse:', response.status)

            // Lire le corps de la réponse
            const text = await response.text()
            console.log('📥 Corps de la réponse:', text.substring(0, 200) + (text.length > 200 ? '...' : ''))

            // Essayer de parser JSON
            let data
            try {
                data = JSON.parse(text)
            } catch (e) {
                console.error('❌ La réponse n\'est pas du JSON valide')
                // Si c'est une page HTML (404), afficher un message clair
                if (text.includes('<!DOCTYPE html>')) {
                    throw new Error('La route /api/assistant n\'existe pas. Créez le fichier app/api/assistant/route.ts')
                }
                throw new Error(`Réponse invalide: ${text.substring(0, 100)}`)
            }

            if (!response.ok) {
                throw new Error(data.error || `Erreur serveur (${response.status})`)
            }

            return data

        } catch (error) {
            console.error('❌ Erreur API assistant:', error)
            throw error
        }
    }

    // ============================================================
    // 5. ENVOYER UN MESSAGE
    // ============================================================
    const sendMessage = async () => {
        if (!inputValue.trim() || isProcessing) return

        const userMessage: Message = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        setIsProcessing(true)

        const loadingMessage: Message = {
            id: 'loading',
            role: 'assistant',
            content: '🤔 Analyse en cours...',
            timestamp: new Date(),
            isTyping: true
        }
        setMessages(prev => [...prev, loadingMessage])

        try {
            const data = await callAssistantAPI(userMessage.content)

            const assistantMessage: Message = {
                id: `msg_${Date.now()}_assistant`,
                role: 'assistant',
                content: data.answer || 'Je n\'ai pas pu générer une réponse.',
                timestamp: new Date(),
                chartData: data.chartData || [],
                tableData: data.tableData || [],
                actions: data.actions || ['📊 Voir les détails', '💡 Plus d\'analyses', '📤 Exporter']
            }

            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== 'loading')
                return [...filtered, assistantMessage]
            })

            await saveConversation([...messages, userMessage, assistantMessage])

        } catch (error: any) {
            console.error('Erreur:', error)
            const errorMsg = error.message || 'Erreur inconnue'
            showToast('error', `❌ ${errorMsg}`)

            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== 'loading')
                return [...filtered, {
                    id: `msg_${Date.now()}_error`,
                    role: 'assistant',
                    content: `❌ Désolé, une erreur est survenue : ${errorMsg}`,
                    timestamp: new Date()
                }]
            })
        } finally {
            setIsProcessing(false)
            setTimeout(scrollToBottom, 100)
        }
    }

    // ============================================================
    // 6. NOUVELLE CONVERSATION
    // ============================================================
    const newConversation = () => {
        const welcomeMessage: Message = {
            id: 'welcome',
            role: 'assistant',
            content: `👋 Bonjour ! Je suis Aria, votre assistant décisionnel.\n\nComment puis-je vous aider aujourd'hui ?`,
            timestamp: new Date(),
            actions: ['📊 Résumé financier', '💰 Analyse des dépenses', '📈 Prévisions']
        }
        setMessages([welcomeMessage])
        setCurrentConversation(null)
        setShowHistory(false)
        if (inputRef.current) inputRef.current.focus()
    }

    // ============================================================
    // 7. CHARGER UNE CONVERSATION
    // ============================================================
    const loadConversation = (conversation: Conversation) => {
        setCurrentConversation(conversation)
        setMessages(conversation.messages)
        setShowHistory(false)
    }

    // ============================================================
    // 8. SUPPRIMER UNE CONVERSATION
    // ============================================================
    const deleteConversation = async (id: string) => {
        if (!id) return

        try {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', id)
                .eq('user_id', userId)

            if (error) throw error

            setConversations(prev => prev.filter(c => c.id !== id))
            if (currentConversation?.id === id) newConversation()
            showToast('success', '✅ Conversation supprimée')
        } catch (err) {
            console.error('Erreur suppression:', err)
            showToast('error', '❌ Erreur lors de la suppression')
        }
    }

    // ============================================================
    // 9. ACTION RAPIDE
    // ============================================================
    const handleQuickAction = (action: string) => {
        const actionMap: Record<string, string> = {
            '📊 Voir mon résumé': '📊 Résumé de ma situation financière',
            '💰 Analyser mes dépenses': '💰 Analyse de mes dépenses',
            '🎯 Mes objectifs': '🎯 Mes objectifs d\'épargne',
            '📊 Voir les détails': '📊 Plus de détails sur ce sujet',
            '💡 Plus d\'analyses': '💡 Analyse plus approfondie',
            '📤 Exporter': '📤 Exporter ces données',
            '📊 Résumé financier': '📊 Résumé de ma situation financière',
            '📈 Prévisions': '📈 Prévisions de trésorerie'
        }
        const query = actionMap[action] || action
        setInputValue(query)
        setTimeout(() => sendMessage(), 100)
    }

    // ============================================================
    // 10. RENDU
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-400 mx-auto" />
                    <p className="text-white/40 mt-4">Chargement de l'assistant...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#03030b] text-white flex">

            {/* ============================================================
            PANEL LATÉRAL - HISTORIQUE
            ============================================================ */}
            <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-[#0a0a1a] border-r border-white/10 transition-transform duration-300 ${showHistory ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative`}>
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="font-semibold text-white/80">Historique</h2>
                    <button onClick={newConversation} className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition">
                        <Plus size={16} />
                    </button>
                </div>

                <div className="overflow-y-auto h-[calc(100%-4rem)] p-2">
                    {conversations.length > 0 ? (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`p-3 rounded-xl cursor-pointer transition group ${currentConversation?.id === conv.id
                                    ? 'bg-blue-500/20 border border-blue-500/30'
                                    : 'hover:bg-white/5'
                                    }`}
                                onClick={() => loadConversation(conv)}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-white/70 truncate flex-1">
                                        {conv.title || 'Conversation sans titre'}
                                    </p>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition"
                                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                                    >
                                        <TrashIcon size={14} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-white/30 mt-1">{formatDate(conv.created_at)}</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-white/30 text-sm">
                            <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                            <p>Aucune conversation</p>
                            <p className="text-xs mt-1">Commencez à discuter avec l'IA</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================
            OVERLAY MOBILE
            ============================================================ */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setShowHistory(false)} />
            )}

            {/* ============================================================
            ZONE PRINCIPALE
            ============================================================ */}
            <div className="flex-1 flex flex-col min-h-screen">

                {/* ============================================================
                EN-TÊTE
                ============================================================ */}
                <div className="border-b border-white/10 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowHistory(!showHistory)} className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Brain size={24} className="text-violet-400" />
                            <h1 className="text-lg font-bold text-white">Aria</h1>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">● En ligne</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={newConversation} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition text-sm">
                            <Plus size={16} /> Nouvelle conversation
                        </button>
                        <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                            <SettingsIcon size={18} />
                        </button>
                    </div>
                </div>

                {/* ============================================================
                TOAST
                ============================================================ */}
                {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

                {/* ============================================================
                MESSAGES
                ============================================================ */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} onActionClick={handleQuickAction} />
                    ))}
                    {isProcessing && (
                        <div className="flex items-center gap-2 text-white/40 text-sm">
                            <Loader2 size={16} className="animate-spin" />
                            <span>L'IA réfléchit...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ============================================================
                SUGGESTIONS RAPIDES
                ============================================================ */}
                {messages.length <= 2 && (
                    <div className="px-4 pb-2">
                        <div className="flex flex-wrap gap-2">
                            {quickSuggestions.map((suggestion) => {
                                const Icon = suggestion.icon
                                return (
                                    <button
                                        key={suggestion.id}
                                        onClick={() => { setInputValue(suggestion.text); setTimeout(() => sendMessage(), 100) }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition text-xs text-white/70"
                                    >
                                        <Icon size={14} /> {suggestion.text}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ============================================================
                ZONE DE SAISIE
                ============================================================ */}
                <div className="border-t border-white/10 p-4">
                    <div className="flex items-end gap-3 max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        sendMessage()
                                    }
                                }}
                                placeholder="Posez votre question en langage naturel..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition resize-none min-h-[52px] max-h-32"
                                rows={1}
                                disabled={isProcessing}
                            />
                            <button
                                onClick={() => showToast('info', '🎤 Fonction vocale en développement')}
                                className="absolute right-3 bottom-3 p-1.5 rounded-lg text-white/30 hover:text-white/60 transition"
                            >
                                <Mic size={18} />
                            </button>
                        </div>
                        <button
                            onClick={sendMessage}
                            disabled={!inputValue.trim() || isProcessing}
                            className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition flex-shrink-0"
                        >
                            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                    <p className="text-[10px] text-white/20 text-center mt-2">
                        L'IA a accès à vos données financières · Les conversations sont sécurisées
                    </p>
                </div>

            </div>

        </div>
    )
}