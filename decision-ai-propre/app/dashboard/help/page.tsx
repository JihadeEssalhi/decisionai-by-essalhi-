'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Search, X, Loader2, CheckCircle, AlertCircle, AlertTriangle, Info,
    HelpCircle, BookOpen, Video, MessageCircle, Phone, Mail,
    ChevronDown, ChevronUp, ChevronRight, ArrowLeft, ArrowRight,
    Send, Paperclip, FileText, ExternalLink, Clock, Check,
    User, Building2, Wallet, Target, Bell, Settings as SettingsIcon,
    LifeBuoy, MessageSquare, Bot, Sparkles, PlayCircle, FileQuestion,
    Globe, Shield, Award, Users, Star, Calendar, Download,
    Plus, Minus, Headphones, MessageCircle as MessageCircleIcon,
    Zap, Rocket, Book, BarChart3, LineChart, PieChart, Repeat,
    Tag, Trophy, Brain, LogOut, Home, Layers, FileSpreadsheet
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface FAQItem {
    id: string
    category: string
    question: string
    answer: string
    order: number
    created_at: string
    updated_at: string
}

interface SupportTicket {
    id: string
    subject: string
    description: string
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    priority: 'low' | 'medium' | 'high'
    category: string
    created_at: string
    updated_at: string
    messages?: SupportMessage[]
}

interface SupportMessage {
    id: string
    ticket_id: string
    message: string
    is_from_user: boolean
    created_at: string
}

interface Guide {
    id: string
    title: string
    description: string
    category: string
    steps: string[]
    image_url?: string
    video_url?: string
    order: number
    created_at: string
}

// ============================================================
// COMPOSANTS
// ============================================================

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

const FAQAccordion = ({ item, isOpen, onToggle }: {
    item: FAQItem;
    isOpen: boolean;
    onToggle: () => void
}) => {
    return (
        <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition"
            >
                <span className="text-sm font-medium text-white/80">{item.question}</span>
                {isOpen ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
            </button>
            {isOpen && (
                <div className="p-4 pt-0 border-t border-white/5">
                    <p className="text-sm text-white/60 leading-relaxed">{item.answer}</p>
                </div>
            )}
        </div>
    )
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function HelpPage() {
    const router = useRouter()
    const supabase = createClient()

    // États
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

    // Données réelles
    const [faqItems, setFaqItems] = useState<FAQItem[]>([])
    const [filteredFaqItems, setFilteredFaqItems] = useState<FAQItem[]>([])
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [guides, setGuides] = useState<Guide[]>([])

    // Nouveau ticket
    const [showTicketForm, setShowTicketForm] = useState(false)
    const [ticketForm, setTicketForm] = useState({
        subject: '',
        description: '',
        category: '',
        priority: 'medium' as 'low' | 'medium' | 'high'
    })

    // Chatbot IA
    const [showChatbot, setShowChatbot] = useState(false)
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
        { role: 'assistant', content: '👋 Bonjour ! Je suis l\'assistant IA de DecisionIA. Comment puis-je vous aider aujourd\'hui ?' }
    ])
    const [chatInput, setChatInput] = useState('')
    const [isChatProcessing, setIsChatProcessing] = useState(false)

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
    // CATÉGORIES FAQ
    // ============================================================
    const faqCategories = [
        { id: 'all', label: 'Toutes', icon: HelpCircle },
        { id: 'compte', label: 'Compte & Profil', icon: User },
        { id: 'transactions', label: 'Transactions', icon: Repeat },
        { id: 'budgets', label: 'Budgets', icon: Wallet },
        { id: 'previsions', label: 'Prévisions', icon: LineChart },
        { id: 'objectifs', label: 'Objectifs d\'épargne', icon: Target },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'facturation', label: 'Facturation', icon: FileText }
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

                // Récupérer les FAQ
                const { data: faqData } = await supabase
                    .from('faq_items')
                    .select('*')
                    .order('order', { ascending: true })

                if (faqData) {
                    setFaqItems(faqData)
                    setFilteredFaqItems(faqData)
                }

                // Récupérer les guides
                const { data: guidesData } = await supabase
                    .from('help_guides')
                    .select('*')
                    .order('order', { ascending: true })

                if (guidesData) {
                    setGuides(guidesData)
                }

                // Récupérer les tickets de support
                const { data: ticketsData } = await supabase
                    .from('support_tickets')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (ticketsData) {
                    setTickets(ticketsData)
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
    // 2. FILTRAGE DES FAQ
    // ============================================================
    useEffect(() => {
        let result = faqItems

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(item =>
                item.question.toLowerCase().includes(term) ||
                item.answer.toLowerCase().includes(term)
            )
        }

        if (selectedCategory !== 'all') {
            result = result.filter(item => item.category === selectedCategory)
        }

        setFilteredFaqItems(result)
    }, [faqItems, searchTerm, selectedCategory])

    // ============================================================
    // 3. CRÉER UN TICKET DE SUPPORT
    // ============================================================
    const createTicket = async () => {
        if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
            showToast('warning', '⚠️ Veuillez remplir tous les champs')
            return
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Utilisateur non connecté')

            const { data, error } = await supabase
                .from('support_tickets')
                .insert({
                    user_id: user.id,
                    subject: ticketForm.subject,
                    description: ticketForm.description,
                    category: ticketForm.category || 'Général',
                    priority: ticketForm.priority,
                    status: 'open'
                })
                .select()

            if (error) throw error

            setShowTicketForm(false)
            setTicketForm({ subject: '', description: '', category: '', priority: 'medium' })

            // Rafraîchir les tickets
            const { data: ticketsData } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (ticketsData) {
                setTickets(ticketsData)
            }

            showToast('success', '✅ Ticket créé avec succès !')

        } catch (err: any) {
            console.error('Erreur:', err)
            showToast('error', `❌ ${err.message || 'Erreur lors de la création du ticket'}`)
        }
    }

    // ============================================================
    // 4. CHATBOT IA
    // ============================================================
    const sendChatMessage = async () => {
        if (!chatInput.trim() || isChatProcessing) return

        const userMessage = chatInput.trim()
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setChatInput('')
        setIsChatProcessing(true)

        try {
            // Simuler une réponse IA (à remplacer par l'appel à l'API)
            const response = await fetch('/api/groq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Tu es l'assistant IA de DecisionIA. Réponds à cette question d'aide: ${userMessage}`
                })
            })

            const data = await response.json()
            const aiResponse = data.text || "Je suis désolé, je n'ai pas pu traiter votre demande. Veuillez contacter le support."

            setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])

        } catch (err) {
            console.error('Erreur chatbot:', err)
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Désolé, une erreur est survenue. Veuillez réessayer ou contacter le support.'
            }])
        } finally {
            setIsChatProcessing(false)
        }
    }

    // ============================================================
    // 5. RENDU
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-400 mx-auto" />
                    <p className="text-white/40 mt-4">Chargement de l'aide...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#03030b] text-white p-6">

            {/* ============================================================
            TOAST
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
                        <LifeBuoy size={24} className="text-blue-400" />
                        Centre d'aide
                    </h1>
                    <p className="text-sm text-white/40">
                        Trouvez des réponses à vos questions ou contactez notre support
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTicketForm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20"
                    >
                        <MessageCircleIcon size={16} />
                        Contacter le support
                    </button>
                </div>
            </div>

            {/* ============================================================
            BARRE DE RECHERCHE
            ============================================================ */}
            <div className="relative mb-6">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un sujet, une question, un mot-clé..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* ============================================================
            SECTIONS RAPIDES
            ============================================================ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <button className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-blue-500/30 transition group">
                    <div className="p-2 rounded-xl bg-blue-500/20 w-fit mb-2 group-hover:scale-110 transition">
                        <Rocket size={20} className="text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-white/80">Démarrage rapide</p>
                    <p className="text-[10px] text-white/30">Guide pour débuter</p>
                </button>
                <button className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-emerald-500/30 transition group">
                    <div className="p-2 rounded-xl bg-emerald-500/20 w-fit mb-2 group-hover:scale-110 transition">
                        <FileQuestion size={20} className="text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-white/80">Questions fréquentes</p>
                    <p className="text-[10px] text-white/30">FAQ par catégorie</p>
                </button>
                <button className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-violet-500/30 transition group">
                    <div className="p-2 rounded-xl bg-violet-500/20 w-fit mb-2 group-hover:scale-110 transition">
                        <MessageCircleIcon size={20} className="text-violet-400" />
                    </div>
                    <p className="text-sm font-medium text-white/80">Contacter le support</p>
                    <p className="text-[10px] text-white/30">Formulaire de contact</p>
                </button>
                <button className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-yellow-500/30 transition group">
                    <div className="p-2 rounded-xl bg-yellow-500/20 w-fit mb-2 group-hover:scale-110 transition">
                        <PlayCircle size={20} className="text-yellow-400" />
                    </div>
                    <p className="text-sm font-medium text-white/80">Tutoriels vidéo</p>
                    <p className="text-[10px] text-white/30">Apprendre pas à pas</p>
                </button>
            </div>

            {/* ============================================================
            FAQ PAR CATÉGORIE
            ============================================================ */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
                        <HelpCircle size={20} className="text-yellow-400" />
                        Questions fréquentes
                    </h2>
                    <span className="text-xs text-white/30">{filteredFaqItems.length} questions</span>
                </div>

                {/* Filtres FAQ */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {faqCategories.map((cat) => {
                        const Icon = cat.icon
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition ${selectedCategory === cat.id
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/5'
                                    }`}
                            >
                                <Icon size={12} />
                                {cat.label}
                            </button>
                        )
                    })}
                </div>

                {/* Liste FAQ */}
                <div className="space-y-2">
                    {filteredFaqItems.length > 0 ? (
                        filteredFaqItems.map((item) => (
                            <FAQAccordion
                                key={item.id}
                                item={item}
                                isOpen={expandedFAQ === item.id}
                                onToggle={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 text-white/30">
                            <HelpCircle size={32} className="mx-auto mb-3 opacity-20" />
                            <p>Aucune question trouvée</p>
                            <p className="text-xs mt-1">Essayez d'autres mots-clés</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================
            GUIDES ET TUTORIELS
            ============================================================ */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-white/80 mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-emerald-400" />
                    Guides et tutoriels
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {guides.length > 0 ? (
                        guides.map((guide) => (
                            <div key={guide.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-emerald-500/30 hover:bg-white/10 transition cursor-pointer">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/20">
                                        <FileText size={18} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-white/80">{guide.title}</h3>
                                        <p className="text-xs text-white/40 mt-0.5">{guide.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/30">{guide.category}</span>
                                            <span className="text-[10px] text-white/20">{guide.steps.length} étapes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-8 text-white/30">
                            <BookOpen size={32} className="mx-auto mb-3 opacity-20" />
                            <p>Guides bientôt disponibles</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================
            ASSISTANT IA
            ============================================================ */}
            <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-500/20">
                            <Bot size={24} className="text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white/80">Assistant IA</h3>
                            <p className="text-xs text-white/40">Posez une question en langage naturel</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowChatbot(!showChatbot)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition"
                    >
                        {showChatbot ? 'Fermer' : 'Ouvrir'} <Sparkles size={14} className="text-yellow-300" />
                    </button>
                </div>

                {showChatbot && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${msg.role === 'user'
                                            ? 'bg-blue-500/20 text-white'
                                            : 'bg-white/5 text-white/80'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isChatProcessing && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 px-4 py-2 rounded-xl text-sm text-white/40">
                                        <Loader2 size={16} className="animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                                placeholder="Posez votre question..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition"
                                disabled={isChatProcessing}
                            />
                            <button
                                onClick={sendChatMessage}
                                disabled={!chatInput.trim() || isChatProcessing}
                                className="p-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================
            SUIVI DES DEMANDES
            ============================================================ */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-white/80 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-blue-400" />
                    Suivi des demandes
                </h2>
                {tickets.length > 0 ? (
                    <div className="space-y-2">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/80">{ticket.subject}</p>
                                    <p className="text-xs text-white/40">{ticket.category} · {new Date(ticket.created_at).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                                            ticket.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                                ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {ticket.status === 'open' ? 'Ouvert' :
                                            ticket.status === 'in_progress' ? 'En cours' :
                                                ticket.status === 'resolved' ? 'Résolu' : 'Fermé'}
                                    </span>
                                    <ChevronRight size={16} className="text-white/20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-white/30 bg-white/5 rounded-xl border border-white/5">
                        <FileText size={32} className="mx-auto mb-3 opacity-20" />
                        <p>Aucune demande de support</p>
                        <button
                            onClick={() => setShowTicketForm(true)}
                            className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition"
                        >
                            Créer une demande
                        </button>
                    </div>
                )}
            </div>

            {/* ============================================================
            CONTACT ET SUPPORT
            ============================================================ */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white/80 mb-4 flex items-center gap-2">
                    <Headphones size={20} className="text-amber-400" />
                    Contact et support
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <Mail size={24} className="text-blue-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white/80">Email</p>
                        <p className="text-xs text-white/40">support@decisionia.com</p>
                        <p className="text-[10px] text-white/20 mt-1">Réponse sous 24h</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <MessageCircleIcon size={24} className="text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white/80">Chat en direct</p>
                        <p className="text-xs text-white/40">Disponible 9h-18h</p>
                        <p className="text-[10px] text-white/20 mt-1">Lun-Ven</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <Phone size={24} className="text-violet-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white/80">Téléphone</p>
                        <p className="text-xs text-white/40">+212 5XX XX XX XX</p>
                        <p className="text-[10px] text-white/20 mt-1">Urgence uniquement</p>
                    </div>
                </div>
            </div>

            {/* ============================================================
            MODAL FORMULAIRE DE CONTACT
            ============================================================ */}
            {showTicketForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a3e] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <MessageCircleIcon size={20} className="text-blue-400" />
                                Contacter le support
                            </h2>
                            <button onClick={() => setShowTicketForm(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-white/60">Sujet *</label>
                                <input
                                    type="text"
                                    value={ticketForm.subject}
                                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                                    placeholder="Ex: Problème avec les prévisions"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Catégorie</label>
                                <select
                                    value={ticketForm.category}
                                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition mt-1"
                                >
                                    <option value="">Sélectionnez une catégorie</option>
                                    <option value="Compte">Compte</option>
                                    <option value="Transactions">Transactions</option>
                                    <option value="Budgets">Budgets</option>
                                    <option value="Prévisions">Prévisions</option>
                                    <option value="Objectifs">Objectifs d\'épargne</option>
                                    <option value="Notifications">Notifications</option>
                                    <option value="Facturation">Facturation</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Priorité</label>
                                <div className="flex gap-2 mt-1">
                                    {['low', 'medium', 'high'].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setTicketForm({ ...ticketForm, priority: p as any })}
                                            className={`px-3 py-1.5 rounded-lg text-xs transition ${ticketForm.priority === p
                                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                    : 'bg-white/5 text-white/40 border border-white/5'
                                                }`}
                                        >
                                            {p === 'low' ? '🟢 Basse' : p === 'medium' ? '🟡 Moyenne' : '🔴 Haute'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60">Description *</label>
                                <textarea
                                    value={ticketForm.description}
                                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                                    rows={4}
                                    placeholder="Décrivez votre problème en détail..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition mt-1 resize-none"
                                />
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <p className="text-xs text-white/30 flex items-center gap-2">
                                    <Info size={14} className="text-blue-400" />
                                    Notre équipe vous répondra dans les plus brefs délais.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setShowTicketForm(false)}
                                className="flex-1 px-4 py-2 text-sm text-white/60 hover:text-white transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={createTicket}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20"
                            >
                                <Send size={16} />
                                Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}