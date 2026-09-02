'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Building2, Briefcase, Wallet, Users, Target, AlertCircle,
    ArrowRight, Save, Loader2, CheckCircle, ChevronRight, ChevronLeft,
    Mail, Phone, Globe, MapPin, Calendar, DollarSign, TrendingUp,
    ShoppingCart, Package, Sparkles, Star, Layers, Server,
    Database, GitBranch, Link, Cloud, HardDrive, FileText,
    GraduationCap, Clock, PieChart, BarChart3, Rocket, Shield,
    Zap, Heart, Eye, Users2, Coins, BadgeCheck, CircleCheck,
    Crown, Home, Settings, User, Menu, X, LogOut, Sun, Moon,
    Brain, Sparkle
} from 'lucide-react'

// ============================================================
// SERVICE GEMINI (intégré dans le même fichier)
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';

interface DashboardAnalysis {
    healthScore: number;
    profitabilityStatus: 'excellent' | 'good' | 'warning' | 'critical';
    growthPotential: 'high' | 'medium' | 'low';
    monthlyProfit: number;
    profitMargin: number;
    annualProjection: number;
    recommendations: string[];
    strengths: string[];
    weaknesses: string[];
    suggestedKPIs: string[];
    executiveSummary: string;
}

async function analyzeCompanyData(formData: any): Promise<DashboardAnalysis> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Fallback si pas de clé API
    if (!apiKey) {
        console.warn('🔑 Pas de clé Gemini, utilisation du fallback');
        return generateFallbackAnalysis(formData);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // ✅ Utilisation de gemini-1.5-flash (disponible)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
Analyse les données suivantes d'une entreprise et fournis une analyse stratégique complète.

DONNÉES DE L'ENTREPRISE :
- Nom : ${formData.name || 'Non renseigné'}
- Secteur : ${formData.sector || 'Non renseigné'}
- Sous-secteur : ${formData.sub_sector || 'Non renseigné'}
- Description : ${formData.business_description || 'Non renseigné'}
- Modèle économique : ${formData.business_model || 'Non renseigné'}
- Marché : ${formData.market_type || 'Non renseigné'}
- Zone géographique : ${formData.geographic_zone || 'Non renseigné'}

FINANCES :
- CA mensuel : ${formData.monthly_revenue || 0} MAD
- CA annuel : ${formData.annual_revenue || 0} MAD
- Dépenses mensuelles : ${formData.monthly_expenses || 0} MAD
- Dépenses annuelles : ${formData.annual_expenses || 0} MAD
- Charges fixes : ${formData.fixed_costs || 0} MAD
- Charges variables : ${formData.variable_costs || 0} MAD
- Masse salariale : ${formData.salaries_cost || 0} MAD
- Loyer : ${formData.rent_cost || 0} MAD
- Budget marketing : ${formData.marketing_cost || 0} MAD
- Infrastructure : ${formData.infrastructure_cost || 0} MAD
- Bénéfice : ${formData.profit || 0} MAD
- Dettes : ${formData.debt || 0} MAD
- Budget disponible : ${formData.available_budget || 0} MAD

CLIENTS :
- Total clients : ${formData.customer_count || 0}
- Clients actifs : ${formData.active_customer_count || 0}
- Nouveaux clients/mois : ${formData.new_customers_monthly || 0}
- Taux de fidélisation : ${formData.customer_retention_rate || 0}%
- Taux de perte : ${formData.customer_churn_rate || 0}%

RESSOURCES :
- Employés : ${formData.employee_count || 0}
- Départements : ${formData.department_count || 0}
- Taux de turnover : ${formData.turnover_rate || 0}%

MARKETING :
- Budget marketing : ${formData.marketing_budget || 0} MAD
- CAC : ${formData.cac || 0} MAD
- ROI marketing : ${formData.roi_marketing || 0}%

OBJECTIFS :
- Objectifs : ${formData.business_objectives || 'Non renseigné'}
- Problèmes : ${formData.business_problems || 'Non renseigné'}

Réponds UNIQUEMENT au format JSON suivant (sans aucun autre texte) :
{
  "healthScore": nombre (0-100),
  "profitabilityStatus": "excellent" | "good" | "warning" | "critical",
  "growthPotential": "high" | "medium" | "low",
  "monthlyProfit": nombre,
  "profitMargin": nombre,
  "annualProjection": nombre,
  "recommendations": ["recommandation1", "recommandation2", "recommandation3"],
  "strengths": ["force1", "force2", "force3"],
  "weaknesses": ["faiblesse1", "faiblesse2", "faiblesse3"],
  "suggestedKPIs": ["KPI1", "KPI2", "KPI3"],
  "executiveSummary": "résumé concis en français"
}

Règles d'analyse :
1. HealthScore : basé sur la rentabilité, la croissance, la santé financière
2. ProfitabilityStatus : excellent (>30% marge), good (15-30%), warning (5-15%), critical (<5% ou négatif)
3. GrowthPotential : élevé si CA croissant, clients augmentent, bon ROI
4. Les recommandations doivent être spécifiques et actionnables
5. Le résumé doit faire 2-3 phrases percutantes
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('Aucun JSON valide trouvé');
        }

        const analysis = JSON.parse(jsonMatch[0]);

        return {
            healthScore: analysis.healthScore || 50,
            profitabilityStatus: analysis.profitabilityStatus || 'warning',
            growthPotential: analysis.growthPotential || 'medium',
            monthlyProfit: analysis.monthlyProfit || 0,
            profitMargin: analysis.profitMargin || 0,
            annualProjection: analysis.annualProjection || 0,
            recommendations: analysis.recommendations || [],
            strengths: analysis.strengths || [],
            weaknesses: analysis.weaknesses || [],
            suggestedKPIs: analysis.suggestedKPIs || [],
            executiveSummary: analysis.executiveSummary || 'Analyse non disponible'
        };
    } catch (error) {
        console.error('❌ Erreur Gemini:', error);
        return generateFallbackAnalysis(formData);
    }
}

function generateFallbackAnalysis(formData: any): DashboardAnalysis {
    const revenue = parseFloat(formData.monthly_revenue) || 0;
    const expenses = parseFloat(formData.monthly_expenses) || 0;
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
        healthScore: Math.min(100, 40 + margin / 2),
        profitabilityStatus: margin > 30 ? 'excellent' : margin > 15 ? 'good' : margin > 5 ? 'warning' : 'critical',
        growthPotential: parseInt(formData.new_customers_monthly) > 5 ? 'high' : parseInt(formData.new_customers_monthly) > 2 ? 'medium' : 'low',
        monthlyProfit: profit,
        profitMargin: margin,
        annualProjection: profit * 12,
        recommendations: [
            'Optimisez vos coûts variables pour améliorer la marge',
            'Augmentez votre budget marketing pour accélérer la croissance',
            'Automatisez les processus pour réduire les coûts opérationnels'
        ],
        strengths: [
            'Structure organisationnelle claire',
            'Capacité à générer de la croissance'
        ],
        weaknesses: [
            'Marge bénéficiaire à surveiller',
            'Dépendance potentielle à certains clients'
        ],
        suggestedKPIs: ['CA mensuel', 'Marge bénéficiaire', 'Taux de croissance client'],
        executiveSummary: `L'entreprise ${formData.name || 'non nommée'} génère un CA mensuel de ${revenue} MAD avec une marge de ${margin.toFixed(1)}%. ${margin > 15 ? 'La rentabilité est bonne' : 'La rentabilité nécessite une optimisation'}.`
    };
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function OnboardingForm() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [step, setStep] = useState(1)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [theme, setTheme] = useState<'light' | 'dark'>('dark')
    const [analysisResult, setAnalysisResult] = useState<DashboardAnalysis | null>(null)

    // ✅ EXACTEMENT les colonnes qui existent dans la table (sans company_size, revenue_evolution, profitability)
    const [formData, setFormData] = useState({
        // Identité
        name: '',
        trade_name: '',
        creation_date: '',
        country: '',
        city: '',
        address: '',
        website: '',
        professional_email: '',
        phone: '',
        legal_form: '',
        // ❌ company_size supprimé
        employee_count: '',
        department_count: '',
        // Activité
        sector: '',
        sub_sector: '',
        business_description: '',
        business_model: '',
        market_type: '',
        target_market: '',
        geographic_zone: '',
        countries_served: '',
        cities_served: '',
        // Finances
        monthly_revenue: '',
        annual_revenue: '',
        // ❌ revenue_evolution supprimé
        monthly_expenses: '',
        annual_expenses: '',
        fixed_costs: '',
        variable_costs: '',
        salaries_cost: '',
        rent_cost: '',
        marketing_cost: '',
        infrastructure_cost: '',
        profit: '',
        margin: '',
        // ❌ profitability supprimé
        debt: '',
        available_budget: '',
        planned_budget: '',
        // Clients
        customer_count: '',
        active_customer_count: '',
        new_customers_monthly: '',
        customer_type: '',
        customer_retention_rate: '',
        customer_churn_rate: '',
        top_customers: '',
        acquisition_channels: '',
        // RH
        department_names: '',
        hiring_needs: '',
        turnover_rate: '',
        // Fournisseurs
        supplier_count: '',
        main_suppliers: '',
        supplier_cost: '',
        payment_terms: '',
        // Marketing
        marketing_channels: '',
        marketing_budget: '',
        cac: '',
        roi_marketing: '',
        social_networks: '',
        // Opérations
        main_processes: '',
        production_capacity: '',
        delivery_times: '',
        quality_issues: '',
        return_rate: '',
        // Projets
        project_count: '',
        active_projects: '',
        completed_projects: '',
        delayed_projects: '',
        // Objectifs
        business_objectives: '',
        business_problems: '',
        dashboard_preferences: ''
    })

    const steps = [
        { id: 1, title: 'Identité', icon: Building2, description: 'Informations générales' },
        { id: 2, title: 'Activité', icon: Briefcase, description: 'Secteur et services' },
        { id: 3, title: 'Finances', icon: Coins, description: 'Données financières' },
        { id: 4, title: 'Ressources', icon: Users, description: 'Clients, RH, Marketing' },
        { id: 5, title: 'Objectifs', icon: Rocket, description: 'Ambitions et défis' }
    ]

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.className = savedTheme === 'dark' ? 'dark' : ''
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.className = newTheme === 'dark' ? 'dark' : ''
    }

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }
                const { data: existingCompany } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle()
                if (existingCompany) {
                    setCompanyId(existingCompany.id)
                    const prefillData: any = {}
                    Object.keys(formData).forEach(key => {
                        const value = existingCompany[key]
                        if (value !== undefined && value !== null) {
                            if (Array.isArray(value)) {
                                prefillData[key] = value.join(', ')
                            } else {
                                prefillData[key] = value?.toString() || ''
                            }
                        }
                    })
                    setFormData(prev => ({ ...prev, ...prefillData }))
                }
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return formData.name.trim().length >= 2 &&
                    formData.sector.trim().length > 0 &&
                    formData.business_description.trim().length >= 10
            case 2:
                return formData.business_model.trim().length > 0 &&
                    formData.market_type.trim().length > 0
            case 3: return true
            case 4: return true
            case 5: return formData.business_objectives.trim().length >= 5
            default: return true
        }
    }

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1)
            setError(null)
        } else {
            setError('Veuillez remplir tous les champs obligatoires')
        }
    }

    const handlePrev = () => {
        setStep(step - 1)
        setError(null)
    }

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    // ============================================================
    // SUBMIT AVEC ANALYSE GEMINI
    // ============================================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setAnalyzing(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Utilisateur non connecté')

            // 🧠 ANALYSE GEMINI
            let geminiAnalysis = null
            try {
                geminiAnalysis = await analyzeCompanyData(formData)
                setAnalysisResult(geminiAnalysis)
                console.log('✅ Analyse Gemini terminée:', geminiAnalysis)
            } catch (err) {
                console.warn('⚠️ Analyse Gemini non disponible, continuation...', err)
            }

            // ✅ Exactement les colonnes existantes (sans company_size, revenue_evolution, profitability)
            const data = {
                name: formData.name || null,
                trade_name: formData.trade_name || null,
                creation_date: formData.creation_date || null,
                country: formData.country || null,
                city: formData.city || null,
                address: formData.address || null,
                website: formData.website || null,
                professional_email: formData.professional_email || null,
                phone: formData.phone || null,
                legal_form: formData.legal_form || null,
                // ❌ company_size supprimé
                employee_count: parseInt(formData.employee_count) || 0,
                department_count: parseInt(formData.department_count) || 0,
                sector: formData.sector || null,
                sub_sector: formData.sub_sector || null,
                business_description: formData.business_description || null,
                business_model: formData.business_model || null,
                market_type: formData.market_type || null,
                target_market: formData.target_market || null,
                geographic_zone: formData.geographic_zone || null,
                countries_served: formData.countries_served.split(',').map(s => s.trim()).filter(s => s),
                cities_served: formData.cities_served.split(',').map(s => s.trim()).filter(s => s),
                monthly_revenue: parseFloat(formData.monthly_revenue) || 0,
                annual_revenue: parseFloat(formData.annual_revenue) || 0,
                // ❌ revenue_evolution supprimé
                monthly_expenses: parseFloat(formData.monthly_expenses) || 0,
                annual_expenses: parseFloat(formData.annual_expenses) || 0,
                fixed_costs: parseFloat(formData.fixed_costs) || 0,
                variable_costs: parseFloat(formData.variable_costs) || 0,
                salaries_cost: parseFloat(formData.salaries_cost) || 0,
                rent_cost: parseFloat(formData.rent_cost) || 0,
                marketing_cost: parseFloat(formData.marketing_cost) || 0,
                infrastructure_cost: parseFloat(formData.infrastructure_cost) || 0,
                profit: parseFloat(formData.profit) || 0,
                margin: parseFloat(formData.margin) || 0,
                // ❌ profitability supprimé
                debt: parseFloat(formData.debt) || 0,
                available_budget: parseFloat(formData.available_budget) || 0,
                planned_budget: parseFloat(formData.planned_budget) || 0,
                customer_count: parseInt(formData.customer_count) || 0,
                active_customer_count: parseInt(formData.active_customer_count) || 0,
                new_customers_monthly: parseInt(formData.new_customers_monthly) || 0,
                customer_type: formData.customer_type || null,
                customer_retention_rate: parseFloat(formData.customer_retention_rate) || 0,
                customer_churn_rate: parseFloat(formData.customer_churn_rate) || 0,
                top_customers: formData.top_customers.split(',').map(s => s.trim()).filter(s => s),
                acquisition_channels: formData.acquisition_channels.split(',').map(s => s.trim()).filter(s => s),
                department_names: formData.department_names.split(',').map(s => s.trim()).filter(s => s),
                hiring_needs: formData.hiring_needs.split(',').map(s => s.trim()).filter(s => s),
                turnover_rate: parseFloat(formData.turnover_rate) || 0,
                supplier_count: parseInt(formData.supplier_count) || 0,
                main_suppliers: formData.main_suppliers.split(',').map(s => s.trim()).filter(s => s),
                supplier_cost: parseFloat(formData.supplier_cost) || 0,
                payment_terms: formData.payment_terms || null,
                marketing_channels: formData.marketing_channels.split(',').map(s => s.trim()).filter(s => s),
                marketing_budget: parseFloat(formData.marketing_budget) || 0,
                cac: parseFloat(formData.cac) || 0,
                roi_marketing: parseFloat(formData.roi_marketing) || 0,
                social_networks: formData.social_networks.split(',').map(s => s.trim()).filter(s => s),
                main_processes: formData.main_processes.split(',').map(s => s.trim()).filter(s => s),
                production_capacity: formData.production_capacity || null,
                delivery_times: formData.delivery_times || null,
                quality_issues: formData.quality_issues.split(',').map(s => s.trim()).filter(s => s),
                return_rate: parseFloat(formData.return_rate) || 0,
                project_count: parseInt(formData.project_count) || 0,
                active_projects: parseInt(formData.active_projects) || 0,
                completed_projects: parseInt(formData.completed_projects) || 0,
                delayed_projects: parseInt(formData.delayed_projects) || 0,
                business_objectives: formData.business_objectives.split(',').map(s => s.trim()).filter(s => s),
                business_problems: formData.business_problems.split(',').map(s => s.trim()).filter(s => s),
                dashboard_preferences: formData.dashboard_preferences.split(',').map(s => s.trim()).filter(s => s),

                // ⭐ AJOUT : Données de l'analyse Gemini
                health_score: geminiAnalysis?.healthScore ?? null,
                profitability_status: geminiAnalysis?.profitabilityStatus ?? null,
                growth_potential: geminiAnalysis?.growthPotential ?? null,
                monthly_profit: geminiAnalysis?.monthlyProfit ?? null,
                profit_margin: geminiAnalysis?.profitMargin ?? null,
                annual_projection: geminiAnalysis?.annualProjection ?? null,
                recommendations: geminiAnalysis?.recommendations ?? [],
                strengths: geminiAnalysis?.strengths ?? [],
                weaknesses: geminiAnalysis?.weaknesses ?? [],
                suggested_kpis: geminiAnalysis?.suggestedKPIs ?? [],
                executive_summary: geminiAnalysis?.executiveSummary ?? null,
                ai_analyzed_at: geminiAnalysis ? new Date().toISOString() : null,
                ai_analysis_status: geminiAnalysis ? 'completed' : 'failed',

                onboarding_status: 'completed',
                profile_completed: true,
                updated_at: new Date().toISOString()
            }

            let result
            if (companyId) {
                result = await supabase
                    .from('companies')
                    .update(data)
                    .eq('id', companyId)
                    .select()
                    .single()
            } else {
                result = await supabase
                    .from('companies')
                    .insert({
                        user_id: user.id,
                        ...data,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single()
            }

            if (result.error) {
                console.error('Erreur Supabase:', result.error)
                throw new Error(result.error.message)
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
            }, 3000)

        } catch (err: any) {
            console.error('Erreur:', err)
            setError(err.message || 'Erreur lors de l\'enregistrement')
        } finally {
            setSaving(false)
            setAnalyzing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#03030b] via-[#0a0a1a] to-[#1a1a3e] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
                        <Loader2 className="h-12 w-12 text-blue-500 animate-spin relative" />
                    </div>
                    <p className="text-white/60 animate-pulse">Chargement de votre espace...</p>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#03030b] via-[#0a0a1a] to-[#1a1a3e] flex items-center justify-center p-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-md text-center shadow-2xl shadow-violet-600/10">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl animate-pulse" />
                        <CheckCircle className="h-20 w-20 text-green-400 relative animate-bounce" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mt-6">Configuration terminée !</h2>
                    <p className="text-white/50 mt-2">Votre entreprise est prête.</p>
                    {analysisResult && (
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left">
                            <p className="text-xs text-blue-400 font-medium flex items-center gap-1">
                                <Brain size={14} />
                                Analyse IA réalisée
                            </p>
                            <p className="text-xs text-white/60 mt-1">{analysisResult.executiveSummary}</p>
                        </div>
                    )}
                    <div className="mt-6 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-violet-600 rounded-full animate-progress" style={{ width: '100%' }} />
                    </div>
                    <p className="text-white/30 text-sm mt-4">Redirection vers le tableau de bord...</p>
                </div>
            </div>
        )
    }

    // =====================================================
    // FORMULAIRE (UI)
    // =====================================================
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#03030b] via-[#0a0a1a] to-[#1a1a3e] text-white">
            {/* Background Effects */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute top-[10%] left-[25%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[150px]" />
                <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[130px]" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "40px 40px",
                }} />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#03030b]/80 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 blur-xl opacity-30" />
                                <img src="/dai-logo.png" alt="DAI" className="relative h-9 w-auto" />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">DecisionAI</span>
                                <span className="text-[8px] font-medium text-blue-400 tracking-[0.3em] uppercase">BY ESSALHI</span>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            {/* Badge IA */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-blue-500/20 border border-violet-500/30">
                                <Brain size={14} className="text-violet-400" />
                                <span className="text-xs text-white/60">IA Ready</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {steps.map((s) => {
                                    const Icon = s.icon
                                    const isActive = s.id === step
                                    const isCompleted = s.id < step
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => isCompleted && setStep(s.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium whitespace-nowrap
                                                ${isActive ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-white border border-blue-500/30' :
                                                    isCompleted ? 'text-white/40 hover:text-white/60' :
                                                        'text-white/20'}`}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle size={12} className="text-emerald-400" />
                                            ) : (
                                                <Icon size={12} />
                                            )}
                                            <span className={isActive ? 'text-white' : ''}>{s.title}</span>
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700"
                                    style={{ width: `${(step / steps.length) * 100}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={toggleTheme} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                                </button>
                                <button onClick={handleLogout} className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 md:hidden">
                            <button onClick={toggleTheme} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                    {isMobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-white/5 space-y-2">
                            {steps.map((s) => {
                                const Icon = s.icon
                                const isActive = s.id === step
                                const isCompleted = s.id < step
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => { if (isCompleted) setStep(s.id); setIsMobileMenuOpen(false) }}
                                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-300 text-sm
                                            ${isActive ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-white border border-blue-500/30' :
                                                isCompleted ? 'text-white/60 hover:bg-white/5' :
                                                    'text-white/20'}`}
                                    >
                                        {isCompleted ? <CheckCircle size={16} className="text-emerald-400" /> : <Icon size={16} />}
                                        <span>{s.title}</span>
                                        {isActive && <span className="ml-auto text-xs text-blue-400">{step}/{steps.length}</span>}
                                    </button>
                                )
                            })}
                            <div className="pt-3 border-t border-white/5">
                                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                                    <LogOut size={16} /> Déconnexion
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="lg:w-56 flex-shrink-0 hidden lg:block">
                        <div className="sticky top-24 space-y-1.5">
                            {steps.map((s) => {
                                const Icon = s.icon
                                const isActive = s.id === step
                                const isCompleted = s.id < step
                                return (
                                    <div
                                        key={s.id}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 cursor-pointer group
                                            ${isActive ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10' :
                                                isCompleted ? 'hover:bg-white/5 border border-transparent' :
                                                    'border border-transparent'}`}
                                        onClick={() => isCompleted && setStep(s.id)}
                                    >
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
                                            ${isActive ? 'bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-violet-500/30' :
                                                isCompleted ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-white/5 text-white/30'}`}>
                                            {isCompleted ? <CheckCircle size={14} /> : <Icon size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium transition-colors
                                                ${isActive ? 'text-white' :
                                                    isCompleted ? 'text-white/60' :
                                                        'text-white/30'}`}>
                                                {s.title}
                                            </p>
                                            <p className="text-[10px] text-white/30 truncate">{s.description}</p>
                                        </div>
                                        {isActive && <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-400 to-violet-400" />}
                                    </div>
                                )
                            })}
                            {/* Badge IA dans la sidebar */}
                            <div className="mt-4 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
                                <div className="flex items-center gap-2">
                                    <Sparkle size={14} className="text-violet-400" />
                                    <span className="text-xs text-white/40">Analyse IA à la validation</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="flex-1">
                        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-violet-600/5">
                            {/* Step Header */}
                            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20">
                                    {(() => { const Icon = steps[step - 1].icon; return <Icon className="text-blue-400" size={20} /> })()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                        {steps[step - 1].title}
                                    </h2>
                                    <p className="text-xs text-white/40">{steps[step - 1].description}</p>
                                </div>
                            </div>

                            {/* ===== ÉTAPE 1: IDENTITÉ ===== */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: 'name', label: 'Nom de l\'entreprise *', icon: Building2, color: 'text-blue-400', placeholder: 'ITBIBI' },
                                            { name: 'trade_name', label: 'Nom commercial', icon: Crown, color: 'text-yellow-400', placeholder: 'ITBIBI Solutions' },
                                            { name: 'creation_date', label: 'Date de création', icon: Calendar, color: 'text-violet-400', type: 'date' },
                                            { name: 'country', label: 'Pays *', icon: Globe, color: 'text-emerald-400', placeholder: 'Maroc' },
                                            { name: 'city', label: 'Ville', icon: MapPin, color: 'text-red-400', placeholder: 'Casablanca' },
                                            { name: 'address', label: 'Adresse', icon: Home, color: 'text-orange-400', placeholder: '123, Boulevard Mohammed V' },
                                            { name: 'website', label: 'Site web', icon: Link, color: 'text-cyan-400', placeholder: 'https://www.itbibi.com' },
                                            { name: 'professional_email', label: 'Email professionnel', icon: Mail, color: 'text-blue-400', placeholder: 'contact@itbibi.com' },
                                            { name: 'phone', label: 'Téléphone', icon: Phone, color: 'text-green-400', placeholder: '+212 5XX XX XX XX' },
                                            { name: 'legal_form', label: 'Forme juridique', icon: BadgeCheck, color: 'text-purple-400', placeholder: 'SARL, SA...' },
                                            // ❌ company_size supprimé
                                            { name: 'employee_count', label: 'Nombre d\'employés', icon: Users2, color: 'text-pink-400', placeholder: '12' },
                                            { name: 'department_count', label: 'Nombre de départements', icon: GitBranch, color: 'text-teal-400', placeholder: '4' },
                                        ].map((field) => {
                                            const Icon = field.icon
                                            return (
                                                <div key={field.name} className="space-y-1.5">
                                                    <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                                        <Icon size={14} className={field.color} />
                                                        {field.label}
                                                    </label>
                                                    <input
                                                        type={field.type || 'text'}
                                                        name={field.name}
                                                        value={formData[field.name as keyof typeof formData] as string}
                                                        onChange={handleChange}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                            <Briefcase size={14} className="text-violet-400" />
                                            Secteur d'activité *
                                        </label>
                                        <select
                                            name="sector"
                                            value={formData.sector}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                        >
                                            <option value="">Sélectionnez un secteur</option>
                                            <option value="Technologie / Informatique">Technologie / Informatique</option>
                                            <option value="Finance / Assurance">Finance / Assurance</option>
                                            <option value="Santé / Médical">Santé / Médical</option>
                                            <option value="Éducation / Formation">Éducation / Formation</option>
                                            <option value="Commerce / Distribution">Commerce / Distribution</option>
                                            <option value="Industrie / Manufacturing">Industrie / Manufacturing</option>
                                            <option value="Construction / BTP">Construction / BTP</option>
                                            <option value="Transport / Logistique">Transport / Logistique</option>
                                            <option value="Tourisme / Hôtellerie">Tourisme / Hôtellerie</option>
                                            <option value="Médias / Communication">Médias / Communication</option>
                                            <option value="Agriculture / Agroalimentaire">Agriculture / Agroalimentaire</option>
                                            <option value="Énergie / Environnement">Énergie / Environnement</option>
                                            <option value="Immobilier">Immobilier</option>
                                            <option value="Services">Services</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                            <FileText size={14} className="text-cyan-400" />
                                            Sous-secteur
                                        </label>
                                        <input
                                            type="text"
                                            name="sub_sector"
                                            value={formData.sub_sector}
                                            onChange={handleChange}
                                            placeholder="Développement Web / SaaS"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                            <FileText size={14} className="text-emerald-400" />
                                            Description de l'activité *
                                        </label>
                                        <textarea
                                            name="business_description"
                                            value={formData.business_description}
                                            onChange={handleChange}
                                            required
                                            rows={4}
                                            placeholder="Décrivez précisément ce que fait votre entreprise..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ===== ÉTAPE 2: ACTIVITÉ ===== */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: 'business_model', label: 'Modèle économique *', icon: Briefcase, color: 'text-violet-400', type: 'select', options: ['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'Service', 'E-commerce', 'Hybride'] },
                                            { name: 'market_type', label: 'Type de marché *', icon: Users2, color: 'text-pink-400', type: 'select', options: ['B2B', 'B2C', 'B2B2C'] },
                                            { name: 'target_market', label: 'Marché cible', icon: Target, color: 'text-red-400', placeholder: 'Entreprises marocaines de taille moyenne' },
                                            { name: 'geographic_zone', label: 'Zone géographique', icon: Globe, color: 'text-emerald-400', placeholder: 'Maroc, Afrique de l\'Ouest' },
                                            { name: 'countries_served', label: 'Pays servis', icon: Globe, color: 'text-cyan-400', placeholder: 'Maroc, France, Côte d\'Ivoire' },
                                            { name: 'cities_served', label: 'Villes servies', icon: MapPin, color: 'text-orange-400', placeholder: 'Casablanca, Rabat, Tanger' },
                                        ].map((field) => {
                                            const Icon = field.icon
                                            if (field.type === 'select') {
                                                return (
                                                    <div key={field.name} className="space-y-1.5">
                                                        <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                                            <Icon size={14} className={field.color} />
                                                            {field.label}
                                                        </label>
                                                        <select
                                                            name={field.name}
                                                            value={formData[field.name as keyof typeof formData] as string}
                                                            onChange={handleChange}
                                                            required={field.name.includes('_model') || field.name.includes('market_type')}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                        >
                                                            <option value="">Sélectionnez</option>
                                                            {field.options?.map((opt) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )
                                            }
                                            return (
                                                <div key={field.name} className="space-y-1.5">
                                                    <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                                        <Icon size={14} className={field.color} />
                                                        {field.label}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name={field.name}
                                                        value={formData[field.name as keyof typeof formData] as string}
                                                        onChange={handleChange}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                    />
                                                    {field.name === 'countries_served' || field.name === 'cities_served' ? (
                                                        <p className="text-[10px] text-white/30">Séparez par des virgules</p>
                                                    ) : null}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ===== ÉTAPE 3: FINANCES ===== */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: 'monthly_revenue', label: 'CA mensuel (MAD)', icon: DollarSign, color: 'text-green-400', placeholder: '24000' },
                                            { name: 'annual_revenue', label: 'CA annuel (MAD)', icon: TrendingUp, color: 'text-blue-400', placeholder: '288000' },
                                            // ❌ revenue_evolution supprimé
                                            { name: 'monthly_expenses', label: 'Dépenses mensuelles (MAD)', icon: TrendingUp, color: 'text-red-400', placeholder: '6079' },
                                            { name: 'annual_expenses', label: 'Dépenses annuelles (MAD)', icon: TrendingUp, color: 'text-red-400', placeholder: '72948' },
                                            { name: 'fixed_costs', label: 'Charges fixes (MAD)', icon: Shield, color: 'text-indigo-400', placeholder: '4500' },
                                            { name: 'variable_costs', label: 'Charges variables (MAD)', icon: Zap, color: 'text-yellow-400', placeholder: '1579' },
                                            { name: 'salaries_cost', label: 'Masse salariale (MAD)', icon: Users2, color: 'text-pink-400', placeholder: '3200' },
                                            { name: 'rent_cost', label: 'Loyer (MAD)', icon: Home, color: 'text-orange-400', placeholder: '1200' },
                                            { name: 'marketing_cost', label: 'Budget marketing (MAD)', icon: TrendingUp, color: 'text-purple-400', placeholder: '500' },
                                            { name: 'infrastructure_cost', label: 'Infrastructure (MAD)', icon: Server, color: 'text-cyan-400', placeholder: '600' },
                                            { name: 'profit', label: 'Bénéfice (MAD)', icon: Coins, color: 'text-emerald-400', placeholder: '17921' },
                                            { name: 'margin', label: 'Marge (%)', icon: PieChart, color: 'text-teal-400', placeholder: '74.6' },
                                            // ❌ profitability supprimé
                                            { name: 'debt', label: 'Dettes (MAD)', icon: Shield, color: 'text-red-400', placeholder: '0' },
                                            { name: 'available_budget', label: 'Budget disponible (MAD)', icon: Wallet, color: 'text-blue-400', placeholder: '15000' },
                                            { name: 'planned_budget', label: 'Budget prévu (MAD)', icon: Rocket, color: 'text-violet-400', placeholder: '25000' },
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
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <p className="text-xs text-white/30 italic flex items-center gap-2">
                                        <Clock size={14} />
                                        Ces informations sont optionnelles. Vous pourrez les importer plus tard.
                                    </p>
                                </div>
                            )}

                            {/* ===== ÉTAPE 4: RESSOURCES ===== */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Users size={18} />
                                        <h3 className="text-sm font-semibold">Clients</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: 'customer_count', label: 'Nombre total de clients', icon: Users, color: 'text-blue-400', placeholder: '45' },
                                            { name: 'active_customer_count', label: 'Clients actifs', icon: CircleCheck, color: 'text-green-400', placeholder: '38' },
                                            { name: 'new_customers_monthly', label: 'Nouveaux clients par mois', icon: Users, color: 'text-emerald-400', placeholder: '3' },
                                            { name: 'customer_retention_rate', label: 'Taux de fidélisation (%)', icon: Heart, color: 'text-pink-400', placeholder: '92' },
                                            { name: 'customer_churn_rate', label: 'Taux de perte clients (%)', icon: AlertCircle, color: 'text-red-400', placeholder: '8' },
                                            { name: 'customer_type', label: 'Type de clients', icon: User, color: 'text-violet-400', placeholder: 'Entreprises B2B' },
                                            { name: 'top_customers', label: 'Top clients', icon: Crown, color: 'text-yellow-400', placeholder: 'Orange, Maroc Telecom' },
                                            { name: 'acquisition_channels', label: 'Canaux d\'acquisition', icon: GitBranch, color: 'text-teal-400', placeholder: 'LinkedIn, Google Ads' },
                                        ].map((field) => {
                                            const Icon = field.icon
                                            return (
                                                <div key={field.name} className="space-y-1.5">
                                                    <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                                        <Icon size={14} className={field.color} />
                                                        {field.label}
                                                    </label>
                                                    <input
                                                        type={field.name.includes('rate') || field.name.includes('count') || field.name.includes('monthly') ? 'number' : 'text'}
                                                        name={field.name}
                                                        value={formData[field.name as keyof typeof formData] as string}
                                                        onChange={handleChange}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="flex items-center gap-2 text-violet-400 mt-6">
                                        <Users2 size={18} />
                                        <h3 className="text-sm font-semibold">Ressources Humaines</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: 'department_names', label: 'Départements', icon: Building2, color: 'text-blue-400', placeholder: 'Développement, Commercial' },
                                            { name: 'hiring_needs', label: 'Besoins en recrutement', icon: User, color: 'text-pink-400', placeholder: 'Développeur senior' },
                                            { name: 'turnover_rate', label: 'Taux de turnover (%)', icon: TrendingUp, color: 'text-red-400', placeholder: '5' },
                                        ].map((field) => {
                                            const Icon = field.icon
                                            return (
                                                <div key={field.name} className="space-y-1.5">
                                                    <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                                        <Icon size={14} className={field.color} />
                                                        {field.label}
                                                    </label>
                                                    <input
                                                        type={field.name === 'turnover_rate' ? 'number' : 'text'}
                                                        name={field.name}
                                                        value={formData[field.name as keyof typeof formData] as string}
                                                        onChange={handleChange}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="flex items-center gap-2 text-emerald-400 mt-6">
                                        <Link size={18} />
                                        <h3 className="text-sm font-semibold">Fournisseurs</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: 'supplier_count', label: 'Nombre de fournisseurs', icon: Users, color: 'text-blue-400', placeholder: '5' },
                                            { name: 'main_suppliers', label: 'Principaux fournisseurs', icon: Link, color: 'text-cyan-400', placeholder: 'AWS, DigitalOcean' },
                                            { name: 'supplier_cost', label: 'Coût fournisseurs (MAD)', icon: Coins, color: 'text-yellow-400', placeholder: '600' },
                                            { name: 'payment_terms', label: 'Délais de paiement', icon: Clock, color: 'text-purple-400', placeholder: '30 jours' },
                                        ].map((field) => {
                                            const Icon = field.icon
                                            return (
                                                <div key={field.name} className="space-y-1.5">
                                                    <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                                        <Icon size={14} className={field.color} />
                                                        {field.label}
                                                    </label>
                                                    <input
                                                        type={field.name === 'supplier_count' || field.name === 'supplier_cost' ? 'number' : 'text'}
                                                        name={field.name}
                                                        value={formData[field.name as keyof typeof formData] as string}
                                                        onChange={handleChange}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="flex items-center gap-2 text-purple-400 mt-6">
                                        <TrendingUp size={18} />
                                        <h3 className="text-sm font-semibold">Marketing</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: 'marketing_channels', label: 'Canaux marketing', icon: GitBranch, color: 'text-teal-400', placeholder: 'LinkedIn, Google Ads' },
                                            { name: 'marketing_budget', label: 'Budget marketing (MAD)', icon: Coins, color: 'text-yellow-400', placeholder: '500' },
                                            { name: 'cac', label: 'Coût d\'acquisition client (CAC)', icon: DollarSign, color: 'text-green-400', placeholder: '200' },
                                            { name: 'roi_marketing', label: 'ROI marketing (%)', icon: BarChart3, color: 'text-blue-400', placeholder: '320' },
                                            { name: 'social_networks', label: 'Réseaux sociaux', icon: Globe, color: 'text-cyan-400', placeholder: 'LinkedIn, Twitter' },
                                        ].map((field) => {
                                            const Icon = field.icon
                                            return (
                                                <div key={field.name} className="space-y-1.5">
                                                    <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                                        <Icon size={14} className={field.color} />
                                                        {field.label}
                                                    </label>
                                                    <input
                                                        type={field.name === 'marketing_budget' || field.name === 'cac' || field.name === 'roi_marketing' ? 'number' : 'text'}
                                                        name={field.name}
                                                        value={formData[field.name as keyof typeof formData] as string}
                                                        onChange={handleChange}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <p className="text-xs text-white/30 italic flex items-center gap-2">
                                        <Clock size={14} />
                                        Ces informations sont optionnelles.
                                    </p>
                                </div>
                            )}

                            {/* ===== ÉTAPE 5: OBJECTIFS ===== */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-rose-400">
                                        <Rocket size={18} />
                                        <h3 className="text-sm font-semibold">Objectifs stratégiques</h3>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                            <Target size={14} className="text-red-400" />
                                            Objectifs pour les 12 prochains mois *
                                        </label>
                                        <textarea
                                            name="business_objectives"
                                            value={formData.business_objectives}
                                            onChange={handleChange}
                                            required
                                            rows={3}
                                            placeholder="Ex: Augmenter le CA de 30%, Lancer un nouveau produit..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                                        />
                                        <p className="text-[10px] text-white/30">Séparez par des virgules</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                            <AlertCircle size={14} className="text-orange-400" />
                                            Principaux défis ou problèmes
                                        </label>
                                        <textarea
                                            name="business_problems"
                                            value={formData.business_problems}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Ex: Je ne sais pas quel projet est rentable..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                                        />
                                        <p className="text-[10px] text-white/30">Séparez par des virgules</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                                            <Eye size={14} className="text-violet-400" />
                                            Préférences pour le dashboard
                                        </label>
                                        <textarea
                                            name="dashboard_preferences"
                                            value={formData.dashboard_preferences}
                                            onChange={handleChange}
                                            rows={2}
                                            placeholder="Ex: Revenus mensuels, Dépenses par catégorie..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                                        />
                                        <p className="text-[10px] text-white/30">Séparez par des virgules</p>
                                    </div>

                                    <div className="flex items-center gap-2 text-cyan-400 mt-6">
                                        <Database size={18} />
                                        <h3 className="text-sm font-semibold">Projets</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: 'project_count', label: 'Nombre total de projets', placeholder: '8' },
                                            { name: 'active_projects', label: 'Projets actifs', placeholder: '5' },
                                            { name: 'completed_projects', label: 'Projets terminés', placeholder: '3' },
                                            { name: 'delayed_projects', label: 'Projets en retard', placeholder: '1' },
                                        ].map((field) => (
                                            <div key={field.name} className="space-y-1.5">
                                                <label className="text-xs font-medium text-white/60">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="number"
                                                    name={field.name}
                                                    value={formData[field.name as keyof typeof formData] as string}
                                                    onChange={handleChange}
                                                    placeholder={field.placeholder}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 text-indigo-400 mt-6">
                                        <Settings size={18} />
                                        <h3 className="text-sm font-semibold">Opérations</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: 'main_processes', label: 'Processus principaux', placeholder: 'Développement Agile, CI/CD' },
                                            { name: 'production_capacity', label: 'Capacité de production', placeholder: '5 projets simultanés' },
                                            { name: 'delivery_times', label: 'Délais de livraison', placeholder: '2-4 semaines' },
                                            { name: 'quality_issues', label: 'Problèmes de qualité', placeholder: 'Défauts mineurs' },
                                            { name: 'return_rate', label: 'Taux de retour (%)', placeholder: '2' },
                                        ].map((field) => (
                                            <div key={field.name} className="space-y-1.5">
                                                <label className="text-xs font-medium text-white/60">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type={field.name === 'return_rate' ? 'number' : 'text'}
                                                    name={field.name}
                                                    value={formData[field.name as keyof typeof formData] as string}
                                                    onChange={handleChange}
                                                    placeholder={field.placeholder}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors group"
                                    >
                                        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                                        Retour
                                    </button>
                                ) : (
                                    <div />
                                )}

                                {step < steps.length ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 group"
                                    >
                                        Suivant
                                        <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={saving || analyzing}
                                        className="flex items-center gap-3 px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-emerald-500/20 group"
                                    >
                                        {analyzing ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Analyse IA en cours...</span>
                                                <Brain size={16} className="text-white/60" />
                                            </>
                                        ) : saving ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} />
                                                Terminer
                                                <Brain size={14} className="text-white/60" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Indicateur d'analyse IA */}
                            {step === steps.length && !saving && !analyzing && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/30">
                                    <Sparkle size={12} className="text-violet-400" />
                                    L'IA analysera vos données à la validation
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

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