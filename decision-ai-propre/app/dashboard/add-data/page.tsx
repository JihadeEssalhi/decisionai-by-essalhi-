'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { analyzeCompanyData } from '@/lib/gemini'
import {
    Loader2, CheckCircle, AlertCircle, Calendar, DollarSign,
    TrendingUp, Users, Coins, Wallet, Building2, Save, X,
    ArrowLeft, Sparkles, Brain, Plus, Shield  // ✅ Ajout de Shield
} from 'lucide-react'

export default function AddDataPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [currentData, setCurrentData] = useState<any>(null)
    const [existingMonths, setExistingMonths] = useState<{ month: number, year: number }[]>([])

    const [formData, setFormData] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        monthly_revenue: '',
        monthly_expenses: '',
        monthly_profit: '',
        profit_margin: '',
        customer_count: '',
        active_customer_count: '',
        new_customers_monthly: '',
        customer_retention_rate: '',
        employee_count: '',
        department_count: '',
        salaries_cost: '',
        marketing_cost: '',
        infrastructure_cost: '',
        rent_cost: '',
        supplier_cost: '',
        variable_costs: '',
        fixed_costs: '',
        debt: '',
        available_budget: '',
        planned_budget: '',
    })

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                // Récupérer les données de l'entreprise
                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (companyError) throw new Error(companyError.message)

                setCompanyId(company.id)
                setCurrentData(company)

                // Récupérer les mois déjà enregistrés
                const { data: monthlyData, error: monthlyError } = await supabase
                    .from('monthly_data')
                    .select('month, year')
                    .eq('company_id', company.id)
                    .order('year', { ascending: false })
                    .order('month', { ascending: false })

                if (!monthlyError && monthlyData) {
                    setExistingMonths(monthlyData)
                }

            } catch (err: any) {
                console.error('Erreur:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router, supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setAnalyzing(true)
        setError(null)

        try {
            // 1. Vérifier si le mois existe déjà
            const exists = existingMonths.some(
                m => m.month === formData.month && m.year === formData.year
            )

            if (exists) {
                setError(`Les données pour ${monthNames[formData.month - 1]} ${formData.year} existent déjà. Utilisez le bouton Modifier.`)
                setSaving(false)
                setAnalyzing(false)
                return
            }

            // 2. Préparer les données
            const monthlyData = {
                company_id: companyId,
                month: formData.month,
                year: formData.year,
                monthly_revenue: parseFloat(formData.monthly_revenue) || 0,
                monthly_expenses: parseFloat(formData.monthly_expenses) || 0,
                monthly_profit: parseFloat(formData.monthly_profit) || 0,
                profit_margin: parseFloat(formData.profit_margin) || 0,
                customer_count: parseInt(formData.customer_count) || 0,
                active_customer_count: parseInt(formData.active_customer_count) || 0,
                new_customers_monthly: parseInt(formData.new_customers_monthly) || 0,
                customer_retention_rate: parseFloat(formData.customer_retention_rate) || 0,
                employee_count: parseInt(formData.employee_count) || 0,
                department_count: parseInt(formData.department_count) || 0,
                salaries_cost: parseFloat(formData.salaries_cost) || 0,
                marketing_cost: parseFloat(formData.marketing_cost) || 0,
                infrastructure_cost: parseFloat(formData.infrastructure_cost) || 0,
                rent_cost: parseFloat(formData.rent_cost) || 0,
                supplier_cost: parseFloat(formData.supplier_cost) || 0,
                variable_costs: parseFloat(formData.variable_costs) || 0,
                fixed_costs: parseFloat(formData.fixed_costs) || 0,
                debt: parseFloat(formData.debt) || 0,
                available_budget: parseFloat(formData.available_budget) || 0,
                planned_budget: parseFloat(formData.planned_budget) || 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            // 3. Sauvegarder dans la table monthly_data
            const { error: insertError } = await supabase
                .from('monthly_data')
                .insert(monthlyData)

            if (insertError) throw new Error(insertError.message)

            // 4. 🧠 ANALYSE GEMINI avec les nouvelles données
            try {
                const analysis = await analyzeCompanyData({
                    ...formData,
                    ...monthlyData,
                    name: currentData?.name || '',
                    sector: currentData?.sector || '',
                    business_description: currentData?.business_description || '',
                    business_model: currentData?.business_model || '',
                    market_type: currentData?.market_type || '',
                    geographic_zone: currentData?.geographic_zone || '',
                    business_objectives: currentData?.business_objectives || '',
                    business_problems: currentData?.business_problems || '',
                })

                // 5. Sauvegarder l'analyse dans la table principale
                await supabase
                    .from('companies')
                    .update({
                        health_score: analysis.healthScore,
                        profitability_status: analysis.profitabilityStatus,
                        growth_potential: analysis.growthPotential,
                        monthly_profit: analysis.monthlyProfit,
                        profit_margin: analysis.profitMargin,
                        annual_projection: analysis.annualProjection,
                        recommendations: analysis.recommendations,
                        strengths: analysis.strengths,
                        weaknesses: analysis.weaknesses,
                        suggested_kpis: analysis.suggestedKPIs,
                        executive_summary: analysis.executiveSummary,
                        ai_analyzed_at: new Date().toISOString(),
                        ai_analysis_status: 'completed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', companyId)

            } catch (err) {
                console.warn('⚠️ Analyse Gemini non disponible:', err)
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)

        } catch (err: any) {
            console.error('Erreur:', err)
            setError(err.message)
            setAnalyzing(false)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        )
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl animate-pulse" />
                    <CheckCircle className="h-16 w-16 text-green-400 animate-bounce relative" />
                </div>
                <h2 className="text-2xl font-bold text-white">Données enregistrées !</h2>
                <p className="text-white/50">Analyse IA en cours...</p>
                <div className="flex items-center gap-2 text-sm text-white/30">
                    <Loader2 size={14} className="animate-spin" />
                    Redirection vers le dashboard...
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Retour
                    </button>
                    <h1 className="text-2xl font-bold text-white mt-1">
                        Ajouter les données mensuelles
                    </h1>
                    <p className="text-sm text-white/40">
                        {currentData?.name} · Suivi mensuel des performances
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-1.5">
                    <Brain size={14} />
                    Analyse IA automatique
                </div>
            </div>

            {/* Alertes */}
            {existingMonths.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-sm text-blue-300">
                        📊 {existingMonths.length} mois déjà enregistrés : {existingMonths.slice(0, 3).map(m =>
                            `${monthNames[m.month - 1]} ${m.year}`
                        ).join(', ')}
                        {existingMonths.length > 3 && ` et ${existingMonths.length - 3} autres...`}
                    </p>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
                {/* Ligne 1 : Mois et Année */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-white/5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                            <Calendar size={14} className="text-blue-400" />
                            Mois *
                        </label>
                        <select
                            name="month"
                            value={formData.month}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        >
                            {monthNames.map((m, index) => (
                                <option key={m} value={index + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                            <Calendar size={14} className="text-violet-400" />
                            Année *
                        </label>
                        <input
                            type="number"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            min={2020}
                            max={new Date().getFullYear() + 1}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        />
                    </div>
                </div>

                {/* Finances */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
                        <Coins size={16} className="text-emerald-400" />
                        Données financières
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { name: 'monthly_revenue', label: 'CA mensuel (MAD)', icon: DollarSign, color: 'text-emerald-400' },
                            { name: 'monthly_expenses', label: 'Dépenses mensuelles (MAD)', icon: TrendingUp, color: 'text-red-400' },
                            { name: 'monthly_profit', label: 'Bénéfice mensuel (MAD)', icon: Coins, color: 'text-emerald-400' },
                            { name: 'profit_margin', label: 'Marge (%)', icon: TrendingUp, color: 'text-blue-400' },
                            { name: 'debt', label: 'Dettes (MAD)', icon: Wallet, color: 'text-red-400' },
                            { name: 'available_budget', label: 'Budget disponible (MAD)', icon: Wallet, color: 'text-blue-400' },
                            { name: 'planned_budget', label: 'Budget prévu (MAD)', icon: Wallet, color: 'text-violet-400' },
                        ].map((field) => {
                            const Icon = field.icon
                            return (
                                <div key={field.name} className="space-y-1.5">
                                    <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                        <Icon size={14} className={field.color} />
                                        {field.label}
                                    </label>
                                    <input
                                        type="number"
                                        name={field.name}
                                        value={formData[field.name as keyof typeof formData] as string}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Clients */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
                        <Users size={16} className="text-blue-400" />
                        Données clients
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { name: 'customer_count', label: 'Nombre total de clients', icon: Users, color: 'text-blue-400' },
                            { name: 'active_customer_count', label: 'Clients actifs', icon: Users, color: 'text-emerald-400' },
                            { name: 'new_customers_monthly', label: 'Nouveaux clients / mois', icon: Users, color: 'text-violet-400' },
                            { name: 'customer_retention_rate', label: 'Taux de fidélisation (%)', icon: TrendingUp, color: 'text-pink-400' },
                        ].map((field) => {
                            const Icon = field.icon
                            return (
                                <div key={field.name} className="space-y-1.5">
                                    <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                        <Icon size={14} className={field.color} />
                                        {field.label}
                                    </label>
                                    <input
                                        type="number"
                                        name={field.name}
                                        value={formData[field.name as keyof typeof formData] as string}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Ressources */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
                        <Building2 size={16} className="text-violet-400" />
                        Ressources
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { name: 'employee_count', label: "Nombre d'employés", icon: Users, color: 'text-pink-400' },
                            { name: 'department_count', label: 'Nombre de départements', icon: Building2, color: 'text-blue-400' },
                            { name: 'salaries_cost', label: 'Masse salariale (MAD)', icon: Coins, color: 'text-purple-400' },
                            { name: 'marketing_cost', label: 'Budget marketing (MAD)', icon: TrendingUp, color: 'text-orange-400' },
                            { name: 'infrastructure_cost', label: 'Infrastructure (MAD)', icon: Building2, color: 'text-cyan-400' },
                            { name: 'rent_cost', label: 'Loyer (MAD)', icon: Building2, color: 'text-yellow-400' },
                            { name: 'supplier_cost', label: 'Coût fournisseurs (MAD)', icon: Coins, color: 'text-indigo-400' },
                            { name: 'variable_costs', label: 'Charges variables (MAD)', icon: TrendingUp, color: 'text-red-400' },
                            { name: 'fixed_costs', label: 'Charges fixes (MAD)', icon: Shield, color: 'text-blue-400' },
                        ].map((field) => {
                            const Icon = field.icon
                            return (
                                <div key={field.name} className="space-y-1.5">
                                    <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                        <Icon size={14} className={field.color} />
                                        {field.label}
                                    </label>
                                    <input
                                        type="number"
                                        name={field.name}
                                        value={formData[field.name as keyof typeof formData] as string}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Boutons */}
                <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/5">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                        <X size={16} />
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-3 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {analyzing ? 'Analyse IA en cours...' : 'Enregistrement...'}
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Enregistrer le mois
                                <Sparkles size={14} className="text-white/60" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}