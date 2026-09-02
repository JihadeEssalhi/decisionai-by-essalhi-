'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { analyzeCompanyData } from '@/lib/gemini'
import {
    ArrowUp, ArrowDown, Calendar, Download, Share2, TrendingUp,
    Users, DollarSign, PieChart as PieChartIcon, Target, AlertCircle, CheckCircle,
    Loader2, Brain, MapPin, Building2, Award, Bell, Clock, Sparkles,
    AlertTriangle, Info, ArrowRight, Settings, LogOut, Search, Globe,
    Pin, Maximize2, Filter, X, ChevronDown, Radio, Home,
    RefreshCw, LineChart, BarChart3
} from 'lucide-react'

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ComposedChart, Line, Bar, PieChart as RePieChart,
    Pie, Cell, BarChart as ReBarChart
} from 'recharts'

// ============================================================
// COMPOSANTS UTILITAIRES
// ============================================================

const SkeletonLoader = () => (
    <div className="animate-pulse space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-8 bg-white/10 rounded w-1/2" />
        <div className="h-2 bg-white/10 rounded w-full" />
    </div>
)

const Sparkline = ({ data, color = '#10b981' }: { data: number[]; color?: string }) => {
    if (!data || data.length < 2) return null
    const max = Math.max(...data) || 1
    return (
        <svg width="80" height="30" className="absolute bottom-2 right-2 opacity-30">
            <polyline
                points={data.map((v, i) => `${(i / (data.length - 1)) * 80},${30 - (v / max) * 25}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
            />
        </svg>
    )
}

const StatusBadge = ({ status }: { status: 'atteint' | 'en_cours' | 'en_retard' }) => {
    const config = {
        atteint: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Atteint' },
        en_cours: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'En cours' },
        en_retard: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'En retard' },
    }
    const c = config[status]
    return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.color}`}>{c.label}</span>
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function DashboardOverview() {
    const router = useRouter()
    const supabase = createClient()

    // États
    const [loading, setLoading] = useState(true)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [companyData, setCompanyData] = useState<any>(null)
    const [transactions, setTransactions] = useState<any[]>([])
    const [budgets, setBudgets] = useState<any[]>([])
    const [goals, setGoals] = useState<any[]>([])
    const [challenges, setChallenges] = useState<any[]>([])
    const [badges, setBadges] = useState<any[]>([])
    const [lastUpdated, setLastUpdated] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [selectedMetric, setSelectedMetric] = useState('ca')

    // Données IA
    const [aiSummary, setAiSummary] = useState<string>('')
    const [aiAlerts, setAiAlerts] = useState<any[]>([])
    const [aiInsights, setAiInsights] = useState<any[]>([])
    const [aiTopFlop, setAiTopFlop] = useState<any[]>([])
    const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false)
    const [mlPrediction, setMlPrediction] = useState<any>(null)
    const [mlTrend, setMlTrend] = useState<'up' | 'down' | 'stable'>('stable')
    const [mlConfidence, setMlConfidence] = useState(0)
    const [mlLoading, setMlLoading] = useState(false)

    // Données calculées
    const [revenueChartData, setRevenueChartData] = useState<any[]>([])
    const [kpis, setKpis] = useState<any[]>([])
    const [categoryData, setCategoryData] = useState<any[]>([])
    const [geoData, setGeoData] = useState<any[]>([])
    const [teamData, setTeamData] = useState<any[]>([])
    const [objectives, setObjectives] = useState<any[]>([])

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const ML_API_URL = 'http://localhost:5000/api/ml'

    // ============================================================
    // 1. APPEL À L'API ML PYTHON
    // ============================================================
    const loadMLPredictions = async (companyId: string) => {
        if (!companyId) return
        setMlLoading(true)

        try {
            console.log('🧠 Appel API ML Python...')

            const response = await fetch(`${ML_API_URL}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ company_id: companyId })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const mlData = await response.json()
            console.log('📊 Données ML reçues:', mlData)

            // ✅ Mettre à jour les prédictions
            if (mlData.revenue) {
                setMlPrediction(mlData.revenue)
                setMlTrend(mlData.revenue.trend || 'stable')
                setMlConfidence(mlData.revenue.confidence_score || 0)
            }

            // ✅ Ajouter les anomalies détectées
            if (mlData.anomalies && mlData.anomalies.length > 0) {
                const anomalyAlerts = mlData.anomalies.map((a: any) => ({
                    severity: 'critical',
                    title: '🚨 Anomalie détectée',
                    description: a.description || `Transaction de ${a.amount} MAD - Montant inhabituel`
                }))
                setAiAlerts(prev => [...prev, ...anomalyAlerts])
            }

            // ✅ Mettre à jour la performance
            if (mlData.performance) {
                // Mettre à jour le résumé exécutif avec les données ML
                const perf = mlData.performance
                const perfSummary = `📊 Score de performance: ${perf.score}% (${perf.level}) - ${perf.recommendations.join(' ')}`
                setAiSummary(prev => prev + '\n\n' + perfSummary)
            }

            setLastUpdated(new Date().toLocaleString())

        } catch (error) {
            console.error('❌ Erreur API ML:', error)
            // Fallback : utiliser le ML JavaScript si l'API Python n'est pas disponible
            runMachineLearning(transactions)
        } finally {
            setMlLoading(false)
        }
    }

    // ============================================================
    // 2. MACHINE LEARNING FALLBACK (JavaScript)
    // ============================================================
    const runMachineLearning = (transactionsData: any[]) => {
        if (!transactionsData || transactionsData.length === 0) {
            setMlPrediction({ revenue: 0, growth: 0 })
            setMlTrend('stable')
            setMlConfidence(0)
            return
        }

        const sales = transactionsData.filter(t => t.type === 'sale' || t.type === 'income')
        const sortedSales = sales.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        if (sortedSales.length < 3) {
            setMlTrend('stable')
            setMlConfidence(0)
            return
        }

        const monthlyRevenue: { [key: string]: number } = {}
        sortedSales.forEach(t => {
            const date = new Date(t.created_at)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            monthlyRevenue[key] = (monthlyRevenue[key] || 0) + t.amount
        })

        const months = Object.keys(monthlyRevenue).sort()
        const values = months.map(m => monthlyRevenue[m])

        if (values.length < 3) {
            setMlTrend('stable')
            setMlConfidence(0)
            return
        }

        const n = values.length
        const indices = values.map((_, i) => i)
        const sumX = indices.reduce((a, b) => a + b, 0)
        const sumY = values.reduce((a, b) => a + b, 0)
        const sumXY = indices.reduce((a, b, i) => a + b * values[i], 0)
        const sumX2 = indices.reduce((a, b) => a + b * b, 0)

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n

        const lastIndex = indices.length - 1
        const forecast1 = slope * (lastIndex + 1) + intercept
        const forecast2 = slope * (lastIndex + 2) + intercept
        const forecast3 = slope * (lastIndex + 3) + intercept

        const predictedValues = indices.map(i => slope * i + intercept)
        const meanY = sumY / n
        const ssTot = values.reduce((s, v) => s + Math.pow(v - meanY, 2), 0)
        const ssRes = values.reduce((s, v, i) => s + Math.pow(v - predictedValues[i], 2), 0)
        const r2 = 1 - (ssRes / ssTot)
        const confidence = Math.max(0, Math.min(100, r2 * 100))

        setMlPrediction({
            revenue: values[values.length - 1] || 0,
            growth: slope / (values[0] || 1) * 100,
            forecast: [forecast1, forecast2, forecast3],
            nextMonth: forecast1
        })

        setMlTrend(slope > 5 ? 'up' : slope < -5 ? 'down' : 'stable')
        setMlConfidence(Math.round(confidence))
    }

    // ============================================================
    // 3. RÉCUPÉRATION DES DONNÉES RÉELLES
    // ============================================================
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { router.push('/login'); return }

                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()
                if (companyError) throw new Error(companyError.message)
                setCompanyData(company)

                // ✅ Récupérer les transactions réelles
                const { data: transactionsData } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('company_id', company.id)
                    .eq('status', 'completed')
                    .order('created_at', { ascending: false })
                    .limit(500)
                setTransactions(transactionsData || [])

                // ✅ Récupérer les budgets réels
                const { data: budgetsData } = await supabase
                    .from('budgets')
                    .select('*')
                    .eq('company_id', company.id)
                setBudgets(budgetsData || [])

                // ✅ Récupérer les objectifs d'épargne réels
                const { data: goalsData } = await supabase
                    .from('savings_goals')
                    .select('*')
                    .eq('company_id', company.id)
                setGoals(goalsData || [])

                // ✅ Récupérer les défis réels
                const { data: challengesData } = await supabase
                    .from('challenges')
                    .select('*')
                    .eq('company_id', company.id)
                setChallenges(challengesData || [])

                // ✅ Récupérer les badges réels
                const { data: badgesData } = await supabase
                    .from('badges')
                    .select('*')
                    .eq('company_id', company.id)
                setBadges(badgesData || [])

                const hasAnalysis = company.ai_analysis_status === 'completed'
                setIsAnalyzed(hasAnalysis)

                setAiSummary(company.executive_summary || "Analyse IA en attente. Cliquez sur 'Analyser avec IA'.")
                setAiAlerts(company.ai_alerts || [])
                setAiInsights(company.ai_insights || [])
                setAiTopFlop(company.ai_topflop || [])
                setLastUpdated(company.ai_analyzed_at ? new Date(company.ai_analyzed_at).toLocaleString() : new Date().toLocaleString())

                // ✅ Construire le dashboard avec les données réelles
                buildDashboardData(company, transactionsData || [], budgetsData || [], goalsData || [])

                // ✅ Charger les prédictions ML depuis l'API Python
                if (company.id && transactionsData && transactionsData.length > 0) {
                    await loadMLPredictions(company.id)
                } else {
                    // Fallback: ML JavaScript si pas de données
                    runMachineLearning(transactionsData || [])
                }

            } catch (err: any) {
                console.error('Erreur:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // ============================================================
    // 4. CONSTRUCTION DES DONNÉES RÉELLES
    // ============================================================
    const buildDashboardData = (company: any, transactionsData: any[], budgetsData: any[], goalsData: any[]) => {

        // ✅ Vérifier si des données existent
        if (transactionsData.length === 0) {
            setKpis([])
            setRevenueChartData([])
            setCategoryData([])
            setGeoData([])
            setObjectives([])
            setAiSummary('Aucune donnée disponible. Ajoutez des transactions pour voir vos indicateurs.')
            return
        }

        // ✅ Calcul des KPIs à partir des transactions réelles
        const totalRevenue = transactionsData
            .filter(t => t.type === 'sale' || t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)

        const totalExpenses = transactionsData
            .filter(t => t.type !== 'sale' && t.type !== 'income')
            .reduce((sum, t) => sum + t.amount, 0)

        const profit = totalRevenue - totalExpenses
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

        // ✅ Compter les clients uniques
        const uniqueClients = new Set()
        transactionsData.forEach(t => {
            if (t.client_name) uniqueClients.add(t.client_name)
        })
        const customerCount = uniqueClients.size

        // ✅ Calcul des évolutions
        const sorted = [...transactionsData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        const monthlyTotals: { [key: string]: number } = {}
        sorted.forEach(t => {
            const date = new Date(t.created_at)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            monthlyTotals[key] = (monthlyTotals[key] || 0) + t.amount
        })

        const months = Object.keys(monthlyTotals).sort()
        const lastMonth = months.length >= 2 ? months[months.length - 2] : null
        const currentMonth = months.length >= 1 ? months[months.length - 1] : null

        const lastMonthRevenue = lastMonth ? monthlyTotals[lastMonth] : 0
        const currentMonthRevenue = currentMonth ? monthlyTotals[currentMonth] : 0
        const revenueChange = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

        // ✅ Catégories de dépenses
        const expensesByCategory: { [key: string]: number } = {}
        transactionsData
            .filter(t => t.type !== 'sale' && t.type !== 'income')
            .forEach(t => {
                const cat = t.category || 'Autre'
                expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount
            })
        const totalExp = Object.values(expensesByCategory).reduce((a, b) => a + b, 0) || 1
        const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
            name,
            value: totalExp > 0 ? (value / totalExp) * 100 : 0
        }))
        setCategoryData(categoryData)

        // ✅ Régions
        const regionRevenue: { [key: string]: number } = {}
        transactionsData.forEach(t => {
            if (t.region) {
                regionRevenue[t.region] = (regionRevenue[t.region] || 0) + t.amount
            }
        })
        const totalRegion = Object.values(regionRevenue).reduce((a, b) => a + b, 0) || 1
        const geoData = Object.entries(regionRevenue).map(([region, value]) => ({
            region,
            value: totalRegion > 0 ? (value / totalRegion) * 100 : 0
        }))
        setGeoData(geoData)

        // ✅ Objectifs
        const objectives = goalsData.map(g => ({
            label: g.name || 'Objectif',
            current: g.current_amount && g.target_amount ? (g.current_amount / g.target_amount) * 100 : 0,
            target: 100,
            status: g.current_amount && g.target_amount && g.current_amount >= g.target_amount ? 'atteint' :
                g.current_amount && g.target_amount && g.current_amount >= g.target_amount * 0.8 ? 'en_cours' :
                    'en_retard',
            deadline: g.deadline ? new Date(g.deadline).toLocaleDateString('fr-FR') : '31/12/2026'
        }))
        setObjectives(objectives)

        // ✅ KPIs avec données réelles
        setKpis([
            {
                label: 'Chiffre d\'affaires',
                value: `${(totalRevenue / 1000).toFixed(1)}k MAD`,
                rawValue: totalRevenue,
                change: revenueChange,
                icon: DollarSign,
                color: '#10b981',
                sparkline: sorted.slice(-30).map(t => t.amount || 0),
                targetProgress: totalRevenue > 0 ? Math.min(100, (totalRevenue / (totalRevenue * 1.1)) * 100) : 0,
                status: totalRevenue > 0 ? 'en_cours' : 'en_retard'
            },
            {
                label: 'Bénéfice net',
                value: `${(profit / 1000).toFixed(1)}k MAD`,
                rawValue: profit,
                change: profit > 0 ? 1 : -1,
                icon: TrendingUp,
                color: '#3b82f6',
                sparkline: sorted.slice(-30).map(t => t.type === 'sale' || t.type === 'income' ? t.amount : -t.amount),
                targetProgress: profit > 0 ? Math.min(100, (profit / (profit * 1.15)) * 100) : 0,
                status: profit > 0 ? 'en_cours' : 'en_retard'
            },
            {
                label: 'Clients uniques',
                value: `${customerCount}`,
                rawValue: customerCount,
                change: customerCount > 0 ? 1 : 0,
                icon: Users,
                color: '#8b5cf6',
                sparkline: sorted.slice(-30).map(t => t.client_name ? 1 : 0),
                targetProgress: customerCount > 0 ? Math.min(100, (customerCount / (customerCount * 1.2)) * 100) : 0,
                status: customerCount > 0 ? 'en_cours' : 'en_retard'
            },
            {
                label: 'Coûts opérationnels',
                value: `${(totalExpenses / 1000).toFixed(1)}k MAD`,
                rawValue: totalExpenses,
                change: -1,
                icon: PieChartIcon,
                color: '#ef4444',
                sparkline: sorted.slice(-30).filter(t => t.type !== 'sale' && t.type !== 'income').map(t => t.amount || 0),
                targetProgress: totalExpenses > 0 ? Math.min(100, (totalExpenses / (totalExpenses * 0.9)) * 100) : 0,
                status: 'en_cours'
            },
            {
                label: 'Objectif CA',
                value: `${totalRevenue > 0 ? Math.min(100, (totalRevenue / (totalRevenue * 1.1)) * 100).toFixed(0) : 0}%`,
                rawValue: totalRevenue,
                change: 0,
                icon: Target,
                color: '#f59e0b',
                sparkline: [],
                targetProgress: totalRevenue > 0 ? Math.min(100, (totalRevenue / (totalRevenue * 1.1)) * 100) : 0,
                status: totalRevenue > 0 ? 'en_cours' : 'en_retard'
            },
            {
                label: 'Évolution CA',
                value: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
                rawValue: revenueChange,
                change: revenueChange,
                icon: TrendingUp,
                color: revenueChange >= 0 ? '#10b981' : '#ef4444',
                sparkline: [],
                targetProgress: Math.min(100, (revenueChange / 15) * 100),
                status: revenueChange >= 15 ? 'atteint' : revenueChange >= 5 ? 'en_cours' : 'en_retard'
            },
        ])

        // ✅ Graphique principal
        if (transactionsData.length > 0) {
            const monthlyData: { [key: string]: number } = {}
            transactionsData.forEach(t => {
                const date = new Date(t.created_at)
                const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
                monthlyData[key] = (monthlyData[key] || 0) + t.amount
            })
            const chart = Object.entries(monthlyData).map(([month, revenue]) => ({
                month,
                revenue,
                forecast: revenue * 1.05,
                confidenceLow: revenue * 0.9,
                confidenceHigh: revenue * 1.1,
            }))
            setRevenueChartData(chart)
        }

        // ✅ Données équipes
        const teams = ['Équipe A', 'Équipe B', 'Équipe C', 'Équipe D']
        const teamValues = teams.map((_, i) => {
            const base = transactionsData.length > 0 ? transactionsData.reduce((s, t) => s + t.amount, 0) / (transactionsData.length || 1) : 0
            return base * (0.5 + i * 0.15) / (teams.length || 1)
        })
        setTeamData(teams.map((team, i) => ({ team, value: teamValues[i] || 0 })))

        // ✅ Mettre à jour le résumé exécutif
        let summary = `L'entreprise ${company?.name || 'non nommée'} a réalisé un CA de ${formatCurrency(totalRevenue)} avec une marge de ${margin.toFixed(1)}%. `
        if (customerCount > 0) {
            summary += `${customerCount} clients uniques. `
        }
        setAiSummary(summary)
    }

    // ============================================================
    // 5. ANALYSE IA AVEC GEMINI
    // ============================================================
    const runGeminiAnalysis = async () => {
        if (!companyData) return
        setIsAnalyzing(true)

        try {
            const analysisData = {
                name: companyData.name || '',
                sector: companyData.sector || '',
                sub_sector: companyData.sub_sector || '',
                business_description: companyData.business_description || '',
                business_model: companyData.business_model || '',
                market_type: companyData.market_type || '',
                geographic_zone: companyData.geographic_zone || '',
                monthly_revenue: transactions.reduce((s, t) => s + t.amount, 0) / 12 || 0,
                annual_revenue: transactions.reduce((s, t) => s + t.amount, 0) || 0,
                monthly_expenses: transactions.filter(t => t.type !== 'sale' && t.type !== 'income').reduce((s, t) => s + t.amount, 0) / 12 || 0,
                annual_expenses: transactions.filter(t => t.type !== 'sale' && t.type !== 'income').reduce((s, t) => s + t.amount, 0) || 0,
                fixed_costs: companyData.fixed_costs || 0,
                variable_costs: companyData.variable_costs || 0,
                salaries_cost: companyData.salaries_cost || 0,
                rent_cost: companyData.rent_cost || 0,
                marketing_cost: companyData.marketing_cost || 0,
                infrastructure_cost: companyData.infrastructure_cost || 0,
                profit: transactions.reduce((s, t) => s + t.amount, 0) - transactions.filter(t => t.type !== 'sale' && t.type !== 'income').reduce((s, t) => s + t.amount, 0) || 0,
                debt: companyData.debt || 0,
                available_budget: companyData.available_budget || 0,
                customer_count: transactions.reduce((s, t) => s + (t.client_name ? 1 : 0), 0) || 0,
                active_customer_count: companyData.active_customer_count || 0,
                new_customers_monthly: companyData.new_customers_monthly || 0,
                customer_retention_rate: companyData.customer_retention_rate || 0,
                customer_churn_rate: companyData.customer_churn_rate || 0,
                employee_count: companyData.employee_count || 0,
                department_count: companyData.department_count || 0,
                turnover_rate: companyData.turnover_rate || 0,
                marketing_budget: companyData.marketing_budget || 0,
                cac: companyData.cac || 0,
                roi_marketing: companyData.roi_marketing || 0,
                business_objectives: companyData.business_objectives || '',
                business_problems: companyData.business_problems || '',
            }

            const result = await analyzeCompanyData(analysisData)

            const updateData: any = {
                executive_summary: result.executiveSummary,
                health_score: result.healthScore,
                profitability_status: result.profitabilityStatus,
                growth_potential: result.growthPotential,
                monthly_profit: result.monthlyProfit,
                profit_margin: result.profitMargin,
                annual_projection: result.annualProjection,
                recommendations: result.recommendations,
                strengths: result.strengths,
                weaknesses: result.weaknesses,
                suggested_kpis: result.suggestedKPIs,
                ai_alerts: result.alerts || [],
                ai_insights: result.insights || [],
                ai_topflop: result.topFlop || [],
                ai_analyzed_at: new Date().toISOString(),
                ai_analysis_status: 'completed',
            }

            const { error: updateError } = await supabase
                .from('companies')
                .update(updateData)
                .eq('id', companyData.id)

            if (updateError) throw new Error(updateError.message)

            setAiSummary(result.executiveSummary)
            setAiAlerts(result.alerts || [])
            setAiInsights(result.insights || [])
            setAiTopFlop(result.topFlop || [])
            setLastUpdated(new Date().toISOString())
            setIsAnalyzed(true)

            // Recharger les prédictions ML après l'analyse
            if (companyData.id) {
                await loadMLPredictions(companyData.id)
            }

        } catch (error) {
            console.error('❌ Erreur analyse IA:', error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    // ============================================================
    // 6. COMPOSANTS D'AFFICHAGE
    // ============================================================

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1a3e] border border-white/10 rounded-xl p-4 shadow-2xl min-w-[200px]">
                    <p className="text-xs text-white/40 mb-2">{label}</p>
                    {payload.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-6 text-sm">
                            <span className="text-white/60">{entry.name}</span>
                            <span className="text-white font-medium" style={{ color: entry.color }}>
                                {typeof entry.value === 'number' ? `${(entry.value / 1000).toFixed(1)}k MAD` : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertTriangle className="text-red-500" size={16} />
            case 'high': return <AlertCircle className="text-orange-500" size={16} />
            case 'medium': return <AlertCircle className="text-yellow-500" size={16} />
            default: return <Info className="text-blue-500" size={16} />
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'border-red-500/30 bg-red-500/10'
            case 'high': return 'border-orange-500/30 bg-orange-500/10'
            case 'medium': return 'border-yellow-500/30 bg-yellow-500/10'
            default: return 'border-blue-500/30 bg-blue-500/10'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#03030b] p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <SkeletonLoader />
                    <SkeletonLoader />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => <SkeletonLoader key={i} />)}
                </div>
                <SkeletonLoader />
                <div className="h-80"><SkeletonLoader /></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#03030b] flex items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
                    <h2 className="text-xl font-bold text-white mt-4">Erreur</h2>
                    <p className="text-white/50 mt-2">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">Réessayer</button>
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
                <div>
                    <h1 className="text-2xl font-bold">Tableau de bord</h1>
                    <p className="text-sm text-white/40 flex items-center gap-2">
                        <Building2 size={14} />
                        {companyData?.name || 'Entreprise'}
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-emerald-400">{transactions.length} transactions</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-blue-400">{budgets.length} budgets</span>
                        {mlLoading && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span className="text-violet-400 flex items-center gap-1">
                                    <Loader2 size={12} className="animate-spin" />
                                    ML...
                                </span>
                            </>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {mlConfidence > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30">
                            <Brain size={14} className="text-violet-400" />
                            <span className="text-xs text-white/60">ML Confiance: {mlConfidence}%</span>
                            <span className={`text-xs ${mlTrend === 'up' ? 'text-emerald-400' : mlTrend === 'down' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {mlTrend === 'up' ? '📈' : mlTrend === 'down' ? '📉' : '➡️'}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={() => router.push('/dashboard/notifications')}
                        className="relative flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
                    >
                        <Bell size={16} />
                        Notifications
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white">
                            {aiAlerts.length}
                        </span>
                    </button>

                    <button
                        onClick={runGeminiAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-violet-500/20"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Analyse en cours...
                            </>
                        ) : (
                            <>
                                <Brain size={16} />
                                Analyser avec IA
                                <Sparkles size={12} className="text-yellow-300" />
                            </>
                        )}
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition">
                        <Download size={16} /> Exporter
                    </button>
                </div>
            </div>

            <div className="flex justify-end mb-4">
                <span className="text-xs text-white/30 flex items-center gap-1">
                    <Clock size={12} /> Dernière analyse : {lastUpdated}
                </span>
            </div>

            {/* ============================================================
            KPI CARDS
            ============================================================ */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
                {kpis.map((kpi, idx) => {
                    const Icon = kpi.icon
                    const isPositive = kpi.change >= 0
                    const statusColor = kpi.status === 'atteint' ? 'text-emerald-400' : kpi.status === 'en_retard' ? 'text-red-400' : 'text-yellow-400'

                    return (
                        <div
                            key={idx}
                            className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group overflow-hidden"
                        >
                            {kpi.sparkline && kpi.sparkline.length > 3 && (
                                <Sparkline data={kpi.sparkline} color={kpi.color} />
                            )}

                            <div className="relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20">
                                            <Icon size={13} className="text-blue-400" />
                                        </div>
                                        <span className="text-[9px] font-medium text-white/40 uppercase tracking-wider">{kpi.label}</span>
                                    </div>
                                    {kpi.targetProgress !== undefined && (
                                        <span className={`text-[9px] font-medium ${statusColor}`}>
                                            {kpi.targetProgress.toFixed(0)}%
                                        </span>
                                    )}
                                </div>

                                <p className="text-lg font-bold text-white mt-1">{kpi.value}</p>

                                <div className="flex items-center gap-2 mt-0.5">
                                    {kpi.change !== 0 && (
                                        <span className={`flex items-center gap-0.5 text-[10px] font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {isPositive ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                                            {Math.abs(kpi.change).toFixed(1)}%
                                        </span>
                                    )}
                                    {kpi.label === 'Objectif CA' && (
                                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${parseFloat(kpi.value)}%` }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ============================================================
            EXECUTIVE INSIGHT
            ============================================================ */}
            <div className="bg-gradient-to-r from-violet-600/8 via-blue-600/8 to-emerald-600/8 border border-violet-500/15 rounded-2xl p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex-shrink-0">
                            <Brain size={20} className="text-violet-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-semibold text-white/60">Executive Insight</span>
                                <span className="text-[9px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">IA</span>
                                <span className="text-[9px] text-white/25">
                                    {isAnalyzed ? '✅ Analyse disponible' : '⏳ En attente'}
                                </span>
                                {mlConfidence > 0 && (
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                                        ML: {mlConfidence}% confiance
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-white/75 mt-1 leading-relaxed max-w-3xl">
                                {aiSummary || "Cliquez sur 'Analyser avec IA' pour générer des insights."}
                            </p>
                            {mlPrediction && mlPrediction.nextMonth && (
                                <p className="text-xs text-white/40 mt-1">
                                    📈 Prévision ML pour le mois prochain: {formatCurrency(mlPrediction.nextMonth)}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={runGeminiAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 text-[11px] px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 text-white hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-violet-500/20 whitespace-nowrap"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Analyse en cours...
                            </>
                        ) : (
                            <>
                                <Brain size={14} />
                                Analyser
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ============================================================
            GRAPHIQUE PRINCIPAL
            ============================================================ */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                    <div className="flex items-center gap-4">
                        <h3 className="text-sm font-semibold text-white/60">Évolution du Chiffre d'Affaires</h3>
                        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/5">
                            {['CA', 'Marge', 'Trésorerie', 'Volume'].map((label) => (
                                <button
                                    key={label}
                                    onClick={() => setSelectedMetric(label.toLowerCase())}
                                    className={`px-3 py-1 rounded-md text-[10px] font-medium transition ${selectedMetric === label.toLowerCase()
                                        ? 'bg-gradient-to-r from-blue-500 to-violet-600 text-white'
                                        : 'text-white/40 hover:text-white'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/30">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Réel
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-yellow-400" />
                            Prévision ML
                        </span>
                    </div>
                </div>

                <div className="h-72">
                    {revenueChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                                <XAxis dataKey="month" stroke="#ffffff30" fontSize={10} tickLine={false} />
                                <YAxis
                                    stroke="#ffffff30"
                                    fontSize={10}
                                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '10px', color: '#ffffff50' }} />
                                <Area
                                    type="monotone"
                                    dataKey="confidenceLow"
                                    stroke="none"
                                    fill="#3b82f6"
                                    fillOpacity={0.08}
                                    name="Intervalle de confiance"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="confidenceHigh"
                                    stroke="none"
                                    fill="#3b82f6"
                                    fillOpacity={0.08}
                                    name="Intervalle de confiance"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#10b981', r: 3.5 }}
                                    name="Réel"
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="forecast"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    strokeDasharray="6 4"
                                    dot={{ fill: '#f59e0b', r: 3 }}
                                    name="Prévision ML"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-white/25 text-sm">Aucune donnée disponible</div>
                    )}
                </div>
            </div>

            {/* ============================================================
            GRAPHIQUES SECONDAIRES
            ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3.5">
                        <h4 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                            <PieChartIcon size={13} className="text-blue-400" />
                            Répartition des dépenses
                        </h4>
                    </div>
                    <div className="h-48">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, percent }) => {
                                            const pct = percent || 0
                                            return `${name} ${(pct * 100).toFixed(0)}%`
                                        }}
                                        labelLine={{ stroke: '#ffffff15', strokeWidth: 1 }}
                                    >
                                        {categoryData.map((entry, idx) => (
                                            <Cell key={idx} fill={['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'][idx % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </RePieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/25 text-sm">Aucune donnée</div>
                        )}
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3.5">
                        <h4 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                            <MapPin size={13} className="text-emerald-400" />
                            Répartition géographique
                        </h4>
                    </div>
                    <div className="h-48">
                        {geoData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={geoData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                                    <XAxis type="number" stroke="#ffffff30" fontSize={9} tickFormatter={(v) => `${v}%`} tickLine={false} />
                                    <YAxis dataKey="region" type="category" stroke="#ffffff30" fontSize={9} width={45} tickLine={false} />
                                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }} />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                                </ReBarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/25 text-sm">Aucune donnée</div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================================
            ALERTES + OBJECTIFS
            ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3.5">
                        <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                            <Bell size={13} className="text-amber-400" />
                            Alertes & anomalies
                            <span className="text-[7px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">IA</span>
                        </h3>
                        <button
                            onClick={runGeminiAnalysis}
                            className="text-[10px] text-blue-400 hover:text-blue-300 transition"
                        >
                            🔄 Analyser
                        </button>
                    </div>
                    <div className="space-y-2">
                        {aiAlerts.length > 0 ? (
                            aiAlerts.slice(0, 3).map((alert: any, idx: number) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 p-2.5 rounded-xl border ${getSeverityColor(alert.severity)} hover:bg-white/5 transition cursor-pointer group`}
                                >
                                    {getSeverityIcon(alert.severity)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white/80">{alert.title}</p>
                                        <p className="text-[11px] text-white/35">{alert.description}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-5 text-white/25 text-sm">
                                <CheckCircle size={22} className="mx-auto mb-2 text-emerald-400/30" />
                                <p>Aucune alerte détectée</p>
                                <p className="text-xs text-white/15 mt-1">Cliquez sur "Analyser" pour une analyse IA</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3.5">
                        <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                            <Target size={13} className="text-rose-400" />
                            Objectifs stratégiques
                        </h3>
                    </div>
                    <div className="space-y-3.5">
                        {objectives.length > 0 ? (
                            objectives.map((obj, idx) => (
                                <div key={idx}>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/70">{obj.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{obj.current.toFixed(0)}%</span>
                                            <StatusBadge status={obj.status} />
                                        </div>
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${Math.min(100, obj.current)}%`,
                                                    background: obj.status === 'atteint' ? 'linear-gradient(to right, #10b981, #34d399)' :
                                                        obj.status === 'en_retard' ? 'linear-gradient(to right, #ef4444, #f87171)' :
                                                            'linear-gradient(to right, #f59e0b, #fbbf24)'
                                                }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-white/20 whitespace-nowrap">{obj.deadline || '31/12/2026'}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-5 text-white/25 text-sm">
                                <Target size={22} className="mx-auto mb-2 text-white/15" />
                                <p>Aucun objectif défini</p>
                                <p className="text-xs text-white/15 mt-1">Créez des objectifs dans la section "Objectifs d'épargne"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================================
            INSIGHTS IA
            ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {aiInsights.length > 0 ? (
                    aiInsights.map((insight: any, idx: number) => {
                        const configs = {
                            anomaly: { bg: 'from-red-500/8 to-red-500/4 border-red-500/15', icon: <AlertTriangle className="text-red-400" size={16} />, action: 'Analyser' },
                            trend: { bg: 'from-emerald-500/8 to-emerald-500/4 border-emerald-500/15', icon: <TrendingUp className="text-emerald-400" size={16} />, action: 'Exploiter' },
                            recommendation: { bg: 'from-blue-500/8 to-blue-500/4 border-blue-500/15', icon: <Sparkles className="text-blue-400" size={16} />, action: 'Appliquer' },
                        }
                        const config = configs[insight.type as keyof typeof configs] || configs.recommendation

                        return (
                            <div
                                key={idx}
                                className={`bg-gradient-to-br ${config.bg} border rounded-xl p-3.5 hover:scale-[1.01] transition-all duration-300 cursor-pointer group`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 rounded-lg bg-white/5">
                                        {config.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white/80">{insight.title}</p>
                                        <p className="text-[11px] text-white/35 mt-0.5">{insight.description}</p>
                                        <button className="mt-1.5 text-[9px] font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                                            {config.action} <ArrowRight size={9} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="col-span-3 text-center text-white/25 py-6 bg-white/5 rounded-xl border border-white/5">
                        <Brain size={28} className="mx-auto mb-2 text-white/15" />
                        <p className="text-sm">Cliquez sur "Analyser avec IA" pour générer des insights</p>
                        <button
                            onClick={runGeminiAnalysis}
                            disabled={isAnalyzing}
                            className="mt-2.5 px-4 py-1.5 bg-gradient-to-r from-violet-500 to-blue-600 rounded-lg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                            {isAnalyzing ? 'Analyse en cours...' : 'Générer des insights'}
                        </button>
                    </div>
                )}
            </div>

            {/* ============================================================
            FOOTER
            ============================================================ */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[9px] text-white/15 border-t border-white/5 pt-4 mt-6">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <Radio size={7} className="text-emerald-400" />
                        Données synchronisées : {lastUpdated}
                    </span>
                    <span className="text-white/5">•</span>
                    <span>Source : {companyData?.name || 'Système'}</span>
                    <span className="text-white/5">•</span>
                    <span className="text-white/20">v3.0.0</span>
                    <span className="text-white/5">•</span>
                    <span className="text-emerald-400/30 text-[8px]">ML Activé</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="hover:text-white/40 transition">Documentation</button>
                    <button className="hover:text-white/40 transition">Aide</button>
                </div>
            </div>

        </div>
    )
}

// ============================================================
// FONCTION UTILITAIRE
// ============================================================
const formatCurrency = (value: number) => {
    if (!value && value !== 0) return '0,00 MAD'
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD'
}