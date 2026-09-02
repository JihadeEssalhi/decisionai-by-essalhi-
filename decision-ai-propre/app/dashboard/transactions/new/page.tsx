'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft, Save, X, Loader2, CheckCircle, AlertCircle,
    User, Mail, Phone, DollarSign, CreditCard, Building2,
    MapPin, Calendar, FileText, Tag, AlertTriangle, Plus,
    Trash2, Edit, Eye, Printer, Copy, Ban, RotateCcw, Globe
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface FormData {
    client_name: string
    client_email: string
    client_phone: string
    amount: string
    currency: string
    type: string
    payment_method: string
    status: string
    region: string
    agency: string
    channel: string
    description: string
    invoice_id: string
}

// ============================================================
// COMPOSANTS
// ============================================================

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
    className = ''
}: any) => {
    const hasError = !!error

    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                {Icon && <Icon size={14} className="text-blue-400" />}
                {label}
                {required && <span className="text-red-400">*</span>}
            </label>
            {options.length > 0 ? (
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`w-full bg-white/5 border ${hasError ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition`}
                >
                    <option value="">Sélectionnez...</option>
                    {options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full bg-white/5 border ${hasError ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition`}
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

export default function NewTransactionPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState<FormData>({
        client_name: '',
        client_email: '',
        client_phone: '',
        amount: '',
        currency: 'MAD',
        type: 'sale',
        payment_method: 'card',
        status: 'pending',
        region: '',
        agency: '',
        channel: 'online',
        description: '',
        invoice_id: '',
    })

    // Options pour les sélecteurs
    const typeOptions = ['sale', 'subscription', 'refund', 'transfer', 'autre']
    const paymentOptions = ['card', 'bank_transfer', 'cash', 'mobile', 'autre']
    const statusOptions = ['pending', 'completed', 'failed', 'cancelled', 'refunded']
    const regionOptions = ['Grand Casablanca', 'Rabat-Salé', 'Tanger-Tétouan', 'Marrakech-Safi', 'Fès-Meknès', 'Autre']
    const channelOptions = ['online', 'physical', 'mobile']
    const currencyOptions = ['MAD', 'EUR', 'USD', 'CFA']

    const typeLabels: Record<string, string> = {
        sale: 'Vente',
        subscription: 'Abonnement',
        refund: 'Remboursement',
        transfer: 'Transfert',
        autre: 'Autre'
    }

    const paymentLabels: Record<string, string> = {
        card: 'Carte bancaire',
        bank_transfer: 'Virement bancaire',
        cash: 'Espèces',
        mobile: 'Mobile Money',
        autre: 'Autre'
    }

    const statusLabels: Record<string, string> = {
        pending: 'En attente',
        completed: 'Réussi',
        failed: 'Échoué',
        cancelled: 'Annulé',
        refunded: 'Remboursé'
    }

    const channelLabels: Record<string, string> = {
        online: 'En ligne',
        physical: 'Physique',
        mobile: 'Mobile'
    }

    // ============================================================
    // 1. Récupération du company_id
    // ============================================================
    useEffect(() => {
        const fetchCompany = async () => {
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

            } catch (err: any) {
                console.error('Erreur:', err)
                setError('Impossible de charger les données de l\'entreprise')
            }
        }

        fetchCompany()
    }, [])

    // ============================================================
    // 2. Gestion du formulaire
    // ============================================================
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Effacer l'erreur du champ modifié
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validate = (): boolean => {
        const errors: Record<string, string> = {}

        if (!formData.client_name.trim()) {
            errors.client_name = 'Le nom du client est requis'
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            errors.amount = 'Le montant doit être supérieur à 0'
        }
        if (!formData.type) {
            errors.type = 'Le type est requis'
        }
        if (!formData.payment_method) {
            errors.payment_method = 'Le moyen de paiement est requis'
        }
        if (!formData.status) {
            errors.status = 'Le statut est requis'
        }
        if (formData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
            errors.client_email = 'Email invalide'
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    // ============================================================
    // 3. Soumission
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

            const transactionData = {
                company_id: companyId,
                user_id: user.id,
                client_name: formData.client_name.trim(),
                client_email: formData.client_email.trim() || null,
                client_phone: formData.client_phone.trim() || null,
                amount: parseFloat(formData.amount) || 0,
                currency: formData.currency,
                type: formData.type,
                payment_method: formData.payment_method,
                status: formData.status,
                region: formData.region || null,
                agency: formData.agency || null,
                channel: formData.channel || 'online',
                description: formData.description.trim() || null,
                invoice_id: formData.invoice_id.trim() || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            const { error: insertError } = await supabase
                .from('transactions')
                .insert(transactionData)

            if (insertError) throw new Error(insertError.message)

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard/transactions')
            }, 3000)

        } catch (err: any) {
            console.error('Erreur:', err)
            setError(err.message || 'Erreur lors de la création de la transaction')
        } finally {
            setLoading(false)
        }
    }

    // ============================================================
    // 4. Rendu
    // ============================================================

    if (success) {
        return (
            <div className="min-h-screen bg-[#03030b] text-white flex items-center justify-center p-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 max-w-md text-center">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl animate-pulse" />
                        <CheckCircle className="h-20 w-20 text-green-400 relative animate-bounce" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-6">Transaction créée !</h2>
                    <p className="text-white/50 mt-2">La transaction a été enregistrée avec succès.</p>
                    <div className="mt-6 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-full animate-progress" style={{ width: '100%' }} />
                    </div>
                    <p className="text-white/30 text-sm mt-4">Redirection vers la liste des transactions...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#03030b] text-white p-6">
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
                        <h1 className="text-2xl font-bold">Nouvelle transaction</h1>
                        <p className="text-sm text-white/40">Créez une nouvelle transaction</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
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
                                Enregistrer
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ============================================================
            ERREUR
            ============================================================ */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2 mb-6">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* ============================================================
            FORMULAIRE
            ============================================================ */}
            <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
                {/* ============================================================
                SECTION CLIENT
                ============================================================ */}
                <div>
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2 mb-4">
                        <User size={16} className="text-blue-400" />
                        Informations client
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField
                            label="Nom du client"
                            name="client_name"
                            value={formData.client_name}
                            onChange={handleChange}
                            placeholder="Ex: Maroc Telecom"
                            required
                            icon={User}
                            error={validationErrors.client_name}
                        />
                        <InputField
                            label="Email"
                            name="client_email"
                            value={formData.client_email}
                            onChange={handleChange}
                            placeholder="client@exemple.com"
                            type="email"
                            icon={Mail}
                            error={validationErrors.client_email}
                        />
                        <InputField
                            label="Téléphone"
                            name="client_phone"
                            value={formData.client_phone}
                            onChange={handleChange}
                            placeholder="+212 6XX XX XX XX"
                            icon={Phone}
                        />
                    </div>
                </div>

                {/* ============================================================
                SECTION FINANCIÈRE
                ============================================================ */}
                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2 mb-4">
                        <DollarSign size={16} className="text-emerald-400" />
                        Informations financières
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <InputField
                            label="Montant"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            type="number"
                            required
                            icon={DollarSign}
                            error={validationErrors.amount}
                        />
                        <InputField
                            label="Devise"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            options={currencyOptions}
                            icon={DollarSign}
                        />
                        <InputField
                            label="Type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            options={typeOptions}
                            required
                            icon={Tag}
                            error={validationErrors.type}
                        />
                        <InputField
                            label="Méthode de paiement"
                            name="payment_method"
                            value={formData.payment_method}
                            onChange={handleChange}
                            options={paymentOptions}
                            required
                            icon={CreditCard}
                            error={validationErrors.payment_method}
                        />
                    </div>
                </div>

                {/* ============================================================
                SECTION STATUT ET LOCALISATION
                ============================================================ */}
                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2 mb-4">
                        <MapPin size={16} className="text-violet-400" />
                        Statut et localisation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <InputField
                            label="Statut"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            options={statusOptions}
                            required
                            icon={AlertCircle}
                            error={validationErrors.status}
                        />
                        <InputField
                            label="Région"
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            options={regionOptions}
                            icon={MapPin}
                        />
                        <InputField
                            label="Agence"
                            name="agency"
                            value={formData.agency}
                            onChange={handleChange}
                            placeholder="Nom de l'agence"
                            icon={Building2}
                        />
                        <InputField
                            label="Canal"
                            name="channel"
                            value={formData.channel}
                            onChange={handleChange}
                            options={channelOptions}
                            icon={Globe}
                        />
                    </div>
                </div>

                {/* ============================================================
                SECTION INFORMATIONS SUPPLÉMENTAIRES
                ============================================================ */}
                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2 mb-4">
                        <FileText size={16} className="text-cyan-400" />
                        Informations supplémentaires
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            label="Numéro de facture"
                            name="invoice_id"
                            value={formData.invoice_id}
                            onChange={handleChange}
                            placeholder="FACT-2026-001"
                            icon={FileText}
                        />
                        <div className="space-y-1.5 col-span-full">
                            <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                <FileText size={14} className="text-cyan-400" />
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Description détaillée de la transaction..."
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                            />
                        </div>
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
                    <div className="bg-white/5 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                            <p className="text-[10px] text-white/30">Client</p>
                            <p className="text-white/80">{formData.client_name || 'Non renseigné'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30">Montant</p>
                            <p className="text-white/80 font-medium">
                                {formData.amount ? `${parseFloat(formData.amount).toLocaleString()} ${formData.currency}` : 'Non renseigné'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30">Type</p>
                            <p className="text-white/80">{typeLabels[formData.type] || formData.type}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30">Statut</p>
                            <p className="text-white/80">{statusLabels[formData.status] || formData.status}</p>
                        </div>
                    </div>
                </div>

                {/* ============================================================
                BOUTONS D'ACTION (bas)
                ============================================================ */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
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
                                Enregistrer la transaction
                            </>
                        )}
                    </button>
                </div>
            </form>

            <style jsx>{`
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                .animate-progress {
                    animation: progress 1.5s ease-out forwards;
                }
            `}</style>
        </div>
    )
}