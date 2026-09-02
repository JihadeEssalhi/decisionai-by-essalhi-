'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft, Save, X, Loader2, CheckCircle, AlertCircle,
    FolderTree, Tag, Layers, FileText, Eye, Sparkles,
    Plus, Download, Upload, Database, TrendingUp, DollarSign
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface Category {
    id: string
    name: string
    parent_id?: string
    description?: string
    status: 'active' | 'inactive'
    product_count: number
    revenue: number
    revenue_percentage: number
    evolution: number
    ai_insights: any[]
    ai_recommendations: any[]
    ai_anomalies: any[]
    ai_analyzed_at?: string
}

interface FormData {
    name: string
    description: string
    parent_id: string
    status: string
    product_count: number
    revenue: number
    revenue_percentage: number
    evolution: number
}

interface ToastProps {
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    onClose: () => void
}

// ============================================================
// CATÉGORIES PRÉ-DÉFINIES POUR MAROC TELECOM
// ============================================================

const PREDEFINED_CATEGORIES = {
    main: [
        {
            name: 'Téléphonie Mobile',
            description: 'Tous les produits et services liés à la téléphonie mobile',
            status: 'active'
        },
        {
            name: 'Forfaits Mobile',
            description: 'Offres de forfaits prépayés et postpayés',
            status: 'active'
        },
        {
            name: 'Internet Fixe & Fibre',
            description: "Solutions d'accès internet fixe et fibre optique",
            status: 'active'
        },
        {
            name: 'Télévision & Divertissement',
            description: 'Offres TV et services de streaming',
            status: 'active'
        },
        {
            name: 'Services Entreprises',
            description: 'Solutions B2B pour les professionnels',
            status: 'active'
        },
        {
            name: 'Services Financiers',
            description: 'Services de paiement, assurance et financement',
            status: 'active'
        }
    ],
    sub: [
        // Téléphonie Mobile
        {
            name: 'Smartphones',
            description: 'Tous les smartphones des meilleures marques : iPhone, Samsung, Huawei, Xiaomi, Oppo',
            parent: 'Téléphonie Mobile',
            status: 'active'
        },
        {
            name: 'Téléphones Basiques',
            description: 'Téléphones simples et fonctionnels',
            parent: 'Téléphonie Mobile',
            status: 'active'
        },
        {
            name: 'Accessoires Mobile',
            description: 'Coques, chargeurs, écouteurs, batteries externes et autres accessoires',
            parent: 'Téléphonie Mobile',
            status: 'active'
        },
        // Forfaits Mobile
        {
            name: 'Forfaits Prépayés',
            description: 'Offres prépayées avec recharges et crédits',
            parent: 'Forfaits Mobile',
            status: 'active'
        },
        {
            name: 'Forfaits Postpayés',
            description: 'Offres postpayées avec engagement mensuel',
            parent: 'Forfaits Mobile',
            status: 'active'
        },
        {
            name: 'Roaming & International',
            description: "Offres d'appels et data à l'international",
            parent: 'Forfaits Mobile',
            status: 'active'
        },
        // Internet Fixe & Fibre
        {
            name: 'Fibre Optique',
            description: 'Internet très haut débit jusqu\'à 1 Gbps',
            parent: 'Internet Fixe & Fibre',
            status: 'active'
        },
        {
            name: 'ADSL',
            description: 'Internet haut débit via ADSL',
            parent: 'Internet Fixe & Fibre',
            status: 'active'
        },
        {
            name: 'Équipements Internet',
            description: 'Box, routeurs, répéteurs Wi-Fi et câbles',
            parent: 'Internet Fixe & Fibre',
            status: 'active'
        },
        // Télévision & Divertissement
        {
            name: "TV d'Orange",
            description: 'Abonnements TV et chaînes premium',
            parent: 'Télévision & Divertissement',
            status: 'active'
        },
        {
            name: 'Streaming',
            description: 'Netflix, Disney+, Amazon Prime, Apple TV+',
            parent: 'Télévision & Divertissement',
            status: 'active'
        },
        {
            name: 'Équipements TV',
            description: 'Téléviseurs, barres de son et accessoires',
            parent: 'Télévision & Divertissement',
            status: 'active'
        },
        // Services Entreprises
        {
            name: 'Solutions Cloud',
            description: 'Stockage Cloud, serveurs virtuels et sauvegarde data',
            parent: 'Services Entreprises',
            status: 'active'
        },
        {
            name: 'Connectivité',
            description: 'Liaisons dédiées, VPN et MPLS',
            parent: 'Services Entreprises',
            status: 'active'
        },
        {
            name: 'Téléphonie IP',
            description: 'PBX Cloud, Softphones et centres d\'appels',
            parent: 'Services Entreprises',
            status: 'active'
        },
        {
            name: 'Sécurité IT',
            description: 'Antivirus, pare-feu et sécurité des données',
            parent: 'Services Entreprises',
            status: 'active'
        },
        // Services Financiers
        {
            name: 'Mobile Money',
            description: 'Recharges, transferts d\'argent et paiements mobiles',
            parent: 'Services Financiers',
            status: 'active'
        },
        {
            name: 'Assurance Mobile',
            description: 'Assurance pour mobiles et voyages',
            parent: 'Services Financiers',
            status: 'active'
        },
        {
            name: 'Financement',
            description: 'Crédit mobile et paiement échelonné',
            parent: 'Services Financiers',
            status: 'active'
        }
    ]
}

// ============================================================
// COMPOSANTS
// ============================================================

const Toast = ({ message, type, onClose }: ToastProps) => {
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

interface InputFieldProps {
    label: string
    name: string
    value: string | number
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    type?: 'text' | 'textarea' | 'select' | 'number'
    placeholder?: string
    required?: boolean
    icon?: React.ElementType
    options?: Array<{ label: string; value: string }> | string[]
    error?: string
    className?: string
    disabled?: boolean
    step?: string
}

const InputField = ({
    label,
    name,
    value,
    onChange,
    type = 'text',
    placeholder = '',
    required = false,
    icon: Icon,
    options = [],
    error = '',
    className = '',
    disabled = false,
    step = '1'
}: InputFieldProps) => {
    const hasError = !!error

    const formatOptions = (opts: Array<{ label: string; value: string }> | string[]) => {
        if (opts.length > 0 && typeof opts[0] === 'string') {
            return (opts as string[]).map(opt => ({ label: opt, value: opt }))
        }
        return opts as Array<{ label: string; value: string }>
    }

    const formattedOptions = formatOptions(options)

    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                {Icon && <Icon size={14} className="text-blue-400" />}
                {label}
                {required && <span className="text-red-400">*</span>}
            </label>
            {formattedOptions.length > 0 && type === 'select' ? (
                <select
                    name={name}
                    value={String(value)}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full bg-white/5 border ${hasError ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <option value="">Sélectionnez...</option>
                    {formattedOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : type === 'textarea' ? (
                <textarea
                    name={name}
                    value={String(value)}
                    onChange={onChange}
                    placeholder={placeholder}
                    rows={3}
                    disabled={disabled}
                    className={`w-full bg-white/5 border ${hasError ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none disabled:opacity-50 disabled:cursor-not-allowed`}
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={String(value)}
                    onChange={onChange}
                    placeholder={placeholder}
                    step={step}
                    disabled={disabled}
                    className={`w-full bg-white/5 border ${hasError ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed`}
                />
            )}
            {hasError && (
                <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {error}
                </p>
            )}
        </div>
    )
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function NewCategoryPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [existingCategories, setExistingCategories] = useState<Category[]>([])
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)
    const [importing, setImporting] = useState(false)

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        parent_id: '',
        status: 'active',
        product_count: 0,
        revenue: 0,
        revenue_percentage: 0,
        evolution: 0
    })

    const statusOptions = [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
    ]

    // ============================================================
    // 1. Récupération du company_id et des catégories existantes
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

                // Récupérer les catégories existantes
                const { data: categories, error: categoriesError } = await supabase
                    .from('categories')
                    .select('id, name, parent_id, description, status, product_count, revenue, revenue_percentage, evolution, ai_insights, ai_recommendations, ai_anomalies, ai_analyzed_at')
                    .eq('company_id', company.id)
                    .order('name', { ascending: true })

                if (!categoriesError && categories) {
                    const parentCategories = categories.filter(c => !c.parent_id)
                    setExistingCategories(parentCategories)
                }

            } catch (err: any) {
                console.error('Erreur:', err)
                setError('Impossible de charger les données')
            } finally {
                setLoadingData(false)
            }
        }

        fetchData()
    }, [])

    // ============================================================
    // 2. Gestion du formulaire
    // ============================================================
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        // Convertir les valeurs numériques
        const newValue = name === 'product_count' || name === 'revenue' || name === 'revenue_percentage' || name === 'evolution'
            ? value === '' ? 0 : parseFloat(value)
            : value
        setFormData(prev => ({ ...prev, [name]: newValue }))
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validate = (): boolean => {
        const errors: Record<string, string> = {}

        if (!formData.name.trim()) {
            errors.name = 'Le nom de la catégorie est requis'
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Le nom doit contenir au moins 2 caractères'
        } else if (formData.name.trim().length > 50) {
            errors.name = 'Le nom ne doit pas dépasser 50 caractères'
        }

        const existing = existingCategories.find(
            c => c.name.toLowerCase() === formData.name.trim().toLowerCase()
        )
        if (existing) {
            errors.name = 'Une catégorie avec ce nom existe déjà'
        }

        if (Number(formData.product_count) < 0) {
            errors.product_count = 'Le nombre de produits doit être positif'
        }

        if (Number(formData.revenue) < 0) {
            errors.revenue = 'Le revenu doit être positif'
        }

        if (Number(formData.revenue_percentage) < 0 || Number(formData.revenue_percentage) > 100) {
            errors.revenue_percentage = 'Le pourcentage doit être entre 0 et 100'
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    // ============================================================
    // 3. Soumission d'une seule catégorie
    // ============================================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) return
        if (!companyId) {
            setError('Erreur: entreprise non trouvée')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Utilisateur non connecté')

            const now = new Date().toISOString()
            const categoryData = {
                company_id: companyId,
                user_id: user.id,
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                parent_id: formData.parent_id || null,
                status: formData.status,
                product_count: Number(formData.product_count) || 0,
                revenue: Number(formData.revenue) || 0,
                revenue_percentage: Number(formData.revenue_percentage) || 0,
                evolution: Number(formData.evolution) || 0,
                created_at: now,
                updated_at: now,
                ai_insights: [],
                ai_recommendations: [],
                ai_anomalies: [],
                ai_analyzed_at: null
            }

            const { error: insertError } = await supabase
                .from('categories')
                .insert(categoryData)

            if (insertError) throw new Error(insertError.message)

            setSuccess(true)
            setToast({
                type: 'success',
                message: `✅ La catégorie "${formData.name}" a été créée avec succès !`
            })

            setTimeout(() => {
                router.push('/dashboard/categories')
            }, 2000)

        } catch (err: any) {
            console.error('Erreur:', err)
            setError(err.message || 'Erreur lors de la création de la catégorie')
            setToast({
                type: 'error',
                message: `❌ ${err.message || 'Erreur lors de la création'}`
            })
        } finally {
            setLoading(false)
        }
    }

    // ============================================================
    // 4. IMPORTATION DES CATÉGORIES PRÉ-DÉFINIES
    // ============================================================
    const importPredefinedCategories = async () => {
        if (!companyId) {
            setToast({
                type: 'error',
                message: '❌ Entreprise non trouvée'
            })
            return
        }

        if (existingCategories.length > 0) {
            const confirm = window.confirm(
                '⚠️ Des catégories existent déjà. Voulez-vous quand même importer les catégories prédéfinies ?\n\n' +
                'Cela ajoutera des catégories supplémentaires sans supprimer les existantes.'
            )
            if (!confirm) return
        }

        setImporting(true)
        setToast({
            type: 'info',
            message: '⏳ Importation des catégories en cours...'
        })

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Utilisateur non connecté')

            const now = new Date().toISOString()
            let createdCount = 0
            let skippedCount = 0

            const { data: allExisting } = await supabase
                .from('categories')
                .select('name')
                .eq('company_id', companyId)

            const existingNames = new Set(allExisting?.map(c => c.name.toLowerCase()) || [])

            // 1. Importer les catégories principales
            for (const cat of PREDEFINED_CATEGORIES.main) {
                if (existingNames.has(cat.name.toLowerCase())) {
                    skippedCount++
                    continue
                }

                const { error } = await supabase
                    .from('categories')
                    .insert({
                        company_id: companyId,
                        user_id: user.id,
                        name: cat.name,
                        description: cat.description,
                        status: cat.status,
                        product_count: 0,
                        revenue: 0,
                        revenue_percentage: 0,
                        evolution: 0,
                        created_at: now,
                        updated_at: now,
                        ai_insights: [],
                        ai_recommendations: [],
                        ai_anomalies: [],
                        ai_analyzed_at: null
                    })

                if (error) {
                    console.warn(`Erreur lors de l'import de "${cat.name}":`, error)
                } else {
                    createdCount++
                    existingNames.add(cat.name.toLowerCase())
                }
            }

            // Récupérer les IDs des catégories principales créées
            const { data: mainCategories } = await supabase
                .from('categories')
                .select('id, name')
                .eq('company_id', companyId)
                .in('name', PREDEFINED_CATEGORIES.main.map(c => c.name))

            const mainCategoryMap = new Map()
            mainCategories?.forEach(c => {
                mainCategoryMap.set(c.name, c.id)
            })

            // 2. Importer les sous-catégories
            for (const cat of PREDEFINED_CATEGORIES.sub) {
                if (existingNames.has(cat.name.toLowerCase())) {
                    skippedCount++
                    continue
                }

                const parentId = mainCategoryMap.get(cat.parent) || null

                const { error } = await supabase
                    .from('categories')
                    .insert({
                        company_id: companyId,
                        user_id: user.id,
                        name: cat.name,
                        description: cat.description,
                        parent_id: parentId,
                        status: cat.status,
                        product_count: 0,
                        revenue: 0,
                        revenue_percentage: 0,
                        evolution: 0,
                        created_at: now,
                        updated_at: now,
                        ai_insights: [],
                        ai_recommendations: [],
                        ai_anomalies: [],
                        ai_analyzed_at: null
                    })

                if (error) {
                    console.warn(`Erreur lors de l'import de "${cat.name}":`, error)
                } else {
                    createdCount++
                    existingNames.add(cat.name.toLowerCase())
                }
            }

            // Rafraîchir la liste des catégories
            const { data: updatedCategories } = await supabase
                .from('categories')
                .select('id, name, parent_id, description, status, product_count, revenue, revenue_percentage, evolution, ai_insights, ai_recommendations, ai_anomalies, ai_analyzed_at')
                .eq('company_id', companyId)
                .order('name', { ascending: true })

            if (updatedCategories) {
                const parentCategories = updatedCategories.filter(c => !c.parent_id)
                setExistingCategories(parentCategories)
            }

            setToast({
                type: 'success',
                message: `✅ Importation terminée ! ${createdCount} catégories créées, ${skippedCount} ignorées (doublons)`
            })

            setTimeout(() => {
                router.refresh()
            }, 3000)

        } catch (err: any) {
            console.error('Erreur import:', err)
            setToast({
                type: 'error',
                message: `❌ Erreur lors de l'importation: ${err.message}`
            })
        } finally {
            setImporting(false)
        }
    }

    // ============================================================
    // 5. Rendu
    // ============================================================

    if (loadingData) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Loader2 size={40} className="animate-spin text-blue-400 mx-auto" />
                        <p className="text-white/40 mt-4">Chargement...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white flex items-center justify-center p-4">
                {toast && (
                    <Toast
                        type={toast.type}
                        message={toast.message}
                        onClose={() => setToast(null)}
                    />
                )}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 max-w-md text-center">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
                        <CheckCircle className="h-20 w-20 text-emerald-400 relative animate-bounce" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-6">Catégorie créée !</h2>
                    <p className="text-white/50 mt-2">La catégorie a été enregistrée avec succès.</p>
                    <div className="mt-6 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-full animate-progress" />
                    </div>
                    <p className="text-white/30 text-sm mt-4">Redirection vers la liste des catégories...</p>
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
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Nouvelle catégorie</h1>
                        <p className="text-sm text-white/40">Créez une nouvelle catégorie pour organiser vos produits</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={importPredefinedCategories}
                        disabled={importing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-violet-500/20"
                    >
                        {importing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Importation...
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                Importer les catégories Maroc Telecom
                                <Sparkles size={12} className="text-yellow-300" />
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
                    >
                        <X size={16} />
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Créer la catégorie
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ============================================================
            ERREUR GLOBALE
            ============================================================ */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2 mb-6">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* ============================================================
            BANNIÈRE D'IMPORTATION
            ============================================================ */}
            {existingCategories.length === 0 && (
                <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-violet-500/20">
                                <Sparkles size={24} className="text-violet-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">Catégories prédéfinies Maroc Telecom</h3>
                                <p className="text-sm text-white/40">
                                    Importez toutes les catégories et sous-catégories pré-configurées en un clic
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={importPredefinedCategories}
                            disabled={importing}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-violet-500/20 whitespace-nowrap"
                        >
                            {importing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Importation...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Importer maintenant
                                </>
                            )}
                        </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-white/40">
                            {PREDEFINED_CATEGORIES.main.length} catégories principales
                        </span>
                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-white/40">
                            {PREDEFINED_CATEGORIES.sub.length} sous-catégories
                        </span>
                    </div>
                </div>
            )}

            {/* ============================================================
            FORMULAIRE
            ============================================================ */}
            <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">

                {/* ============================================================
                SECTION INFORMATIONS GÉNÉRALES
                ============================================================ */}
                <div>
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2 mb-4">
                        <FolderTree size={16} className="text-blue-400" />
                        Informations générales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            label="Nom de la catégorie"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ex: Télécommunications, Électronique..."
                            required
                            icon={Tag}
                            error={validationErrors.name}
                        />
                        <InputField
                            label="Catégorie parente"
                            name="parent_id"
                            value={formData.parent_id}
                            onChange={handleChange}
                            type="select"
                            options={[
                                { label: 'Aucune (catégorie principale)', value: '' },
                                ...existingCategories.map((c: Category) => ({
                                    label: c.name,
                                    value: c.id
                                }))
                            ]}
                            icon={Layers}
                        />
                    </div>
                    <div className="mt-4">
                        <InputField
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Décrivez cette catégorie (ex: produits, services, etc.)"
                            type="textarea"
                            icon={FileText}
                        />
                    </div>
                </div>

                {/* ============================================================
                SECTION INDICATEURS FINANCIERS
                ============================================================ */}
                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2 mb-4">
                        <DollarSign size={16} className="text-emerald-400" />
                        Indicateurs financiers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField
                            label="Nombre de produits"
                            name="product_count"
                            value={formData.product_count}
                            onChange={handleChange}
                            type="number"
                            placeholder="0"
                            icon={Database}
                            step="1"
                            error={validationErrors.product_count}
                        />
                        <InputField
                            label="Revenu (MAD)"
                            name="revenue"
                            value={formData.revenue}
                            onChange={handleChange}
                            type="number"
                            placeholder="0.00"
                            icon={TrendingUp}
                            step="0.01"
                            error={validationErrors.revenue}
                        />
                        <InputField
                            label="Pourcentage du revenu (%)"
                            name="revenue_percentage"
                            value={formData.revenue_percentage}
                            onChange={handleChange}
                            type="number"
                            placeholder="0.00"
                            icon={DollarSign}
                            step="0.01"
                            error={validationErrors.revenue_percentage}
                        />
                    </div>
                </div>

                {/* ============================================================
                SECTION STATUT & ÉVOLUTION
                ============================================================ */}
                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2 mb-4">
                        <Layers size={16} className="text-violet-400" />
                        Statut & Évolution
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField
                            label="Statut"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            type="select"
                            options={statusOptions}
                            icon={Eye}
                        />
                        <InputField
                            label="Évolution (%)"
                            name="evolution"
                            value={formData.evolution}
                            onChange={handleChange}
                            type="number"
                            placeholder="0.00"
                            icon={TrendingUp}
                            step="0.01"
                            error={validationErrors.evolution}
                        />
                    </div>
                </div>

                {/* ============================================================
                RÉCAPITULATIF
                ============================================================ */}
                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2 mb-3">
                        <CheckCircle size={16} className="text-emerald-400" />
                        Récapitulatif
                    </h3>
                    <div className="bg-white/5 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-[10px] text-white/30">Nom</p>
                            <p className="text-white/80">{formData.name || 'Non renseigné'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30">Statut</p>
                            <p className={`${formData.status === 'active' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                {formData.status === 'active' ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30">Catégorie parente</p>
                            <p className="text-white/80">
                                {formData.parent_id
                                    ? existingCategories.find(c => c.id === formData.parent_id)?.name || 'Non renseigné'
                                    : 'Aucune (catégorie principale)'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30">Nombre de produits</p>
                            <p className="text-white/80">{formData.product_count}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30">Revenu</p>
                            <p className="text-white/80">{Number(formData.revenue || 0).toFixed(2)} MAD</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30">Évolution</p>
                            <p className="text-white/80">{Number(formData.evolution || 0).toFixed(1)}%</p>
                        </div>
                        {formData.description && (
                            <div className="col-span-1 sm:col-span-2">
                                <p className="text-[10px] text-white/30">Description</p>
                                <p className="text-white/60 text-sm">{formData.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============================================================
                BOUTONS D'ACTION
                ============================================================ */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full sm:w-auto px-4 py-2 text-sm text-white/60 hover:text-white transition text-center"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Créer la catégorie
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* ============================================================
            STYLES ANIMATION
            ============================================================ */}
            <style jsx>{`
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-progress {
                    animation: progress 1.5s ease-out forwards;
                }
                .animate-bounce {
                    animation: bounce 1s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}