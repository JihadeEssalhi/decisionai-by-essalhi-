import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

// ============================================================
// TYPES
// ============================================================

interface Intent {
    type: string;
    entities: string[];
    period: string;
    indicators: string[];
    calculations: string[];
    specificEntities: string[];
    additionalContext: string;
}

interface Transaction {
    id: string;
    company_id: string;
    amount: number;
    type: string;
    category?: string;
    status?: string;
    created_at: string;
}

interface Budget {
    id: string;
    company_id: string;
    name: string;
    allocated: number;
    spent: number;
    category: string;
}

interface Goal {
    id: string;
    company_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    status: string;
}

interface Challenge {
    id: string;
    company_id: string;
    name: string;
    status: string;
}

interface Badge {
    id: string;
    company_id: string;
    name: string;
    status: string;
}

interface Forecast {
    id: string;
    company_id: string;
    predicted_value: number;
    date: string;
}

interface DataContext {
    transactions: Transaction[];
    budgets: Budget[];
    goals: Goal[];
    challenges: Challenge[];
    badges: Badge[];
    forecasts: Forecast[];
}

// ============================================================
// INITIALISATION
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials missing');
}
if (!groqApiKey) {
    console.error('❌ GROQ_API_KEY missing');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
const groq = new Groq({ apiKey: groqApiKey! });

// ============================================================
// API ROUTE
// ============================================================

export async function POST(request: NextRequest) {
    console.log('📨 [Assistant API] Requête reçue');
    try {
        const body = await request.json();
        console.log('📦 Body reçu:', body);

        const { question, conversationHistory, companyId, userId } = body;

        if (!question || typeof question !== 'string') {
            console.warn('⚠️ Question manquante');
            return NextResponse.json({ error: 'Question manquante' }, { status: 400 });
        }
        if (!companyId || !userId) {
            console.warn('⚠️ companyId ou userId manquant');
            return NextResponse.json({ error: 'companyId ou userId manquant' }, { status: 400 });
        }

        // 1. Analyser l'intention
        console.log('🔍 Analyse de l\'intention...');
        const intent = await analyzeIntent(question);
        console.log('🎯 Intention:', intent);

        // 2. Récupérer les données
        console.log('📊 Récupération des données...');
        const dataContext = await fetchRelevantData(companyId, intent);
        console.log(`📊 Données: ${dataContext.transactions.length} transactions, ${dataContext.budgets.length} budgets`);

        // 3. Calculer les indicateurs
        console.log('📈 Calcul des indicateurs...');
        const computedData = computeDerivedData(dataContext, intent);
        console.log('📈 Indicateurs calculés:', Object.keys(computedData));

        // 4. Générer la réponse
        console.log('🤖 Génération de la réponse...');
        const answer = await generateAnswer(question, conversationHistory, dataContext, computedData, intent);
        console.log('✅ Réponse générée');

        // 5. Enrichir
        const enriched = enrichAnswer(answer, dataContext, intent);

        return NextResponse.json(enriched);
    } catch (error) {
        console.error('❌ Erreur API assistant:', error);
        return NextResponse.json(
            {
                error: 'Erreur interne du serveur',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
}

// ============================================================
// FONCTIONS AUXILIAIRES
// ============================================================

async function analyzeIntent(question: string): Promise<Intent> {
    const prompt = `
    Tu es un expert en analyse financière. Pour la question suivante, détermine :
    - type : résumé, détail, prévision, comparaison, analyse, recommandation, what-if, simple
    - entities : liste des entités (chiffre d'affaires, dépenses, trésorerie, clients, fournisseurs, budgets, objectifs, défis, badges, prévisions, risques)
    - period : mois en cours, mois dernier, trimestre, année, 30 jours, etc.
    - indicators : CA, marge, bénéfice, coûts, nombre de transactions, panier moyen, etc.
    - calculations : somme, moyenne, projection, comparaison
    - specificEntities : précisions (ex: un client en particulier, un nom de budget)
    - additionalContext : contexte supplémentaire

    Question: "${question}"

    Retourne UNIQUEMENT un JSON valide avec ces champs.
    Exemple : {"type":"résumé","entities":["chiffre d'affaires","dépenses"],"period":"mois en cours","indicators":["CA","dépenses totales"],"calculations":["somme"],"specificEntities":[],"additionalContext":""}
    `;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: 'Tu es un analyste. Réponds uniquement en JSON valide.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500,
        });
        const content = completion.choices[0]?.message?.content || '{}';
        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson) as Intent;
    } catch (error) {
        console.error('Erreur analyse intention:', error);
        return {
            type: 'analyse',
            entities: ['chiffre d\'affaires', 'dépenses', 'trésorerie'],
            period: 'mois en cours',
            indicators: ['CA', 'dépenses totales', 'trésorerie nette'],
            calculations: ['somme', 'moyenne'],
            specificEntities: [],
            additionalContext: ''
        };
    }
}

async function fetchRelevantData(companyId: string, intent: Intent): Promise<DataContext> {
    const context: DataContext = {
        transactions: [],
        budgets: [],
        goals: [],
        challenges: [],
        badges: [],
        forecasts: []
    };

    const entities = intent.entities || [];
    const shouldFetch = (key: string) => entities.some((e: string) => e.includes(key) || key.includes(e));

    // Toujours récupérer les transactions
    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(500);

    if (txError) {
        console.error('Erreur récupération transactions:', txError);
    } else {
        context.transactions = (transactions || []) as Transaction[];
    }

    if (shouldFetch('budget') || shouldFetch('budgets')) {
        const { data: budgets, error: bError } = await supabase
            .from('budgets')
            .select('*')
            .eq('company_id', companyId);
        if (!bError) context.budgets = (budgets || []) as Budget[];
    }

    if (shouldFetch('objectif') || shouldFetch('objectifs') || shouldFetch('épargne')) {
        const { data: goals, error: gError } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('company_id', companyId);
        if (!gError) context.goals = (goals || []) as Goal[];
    }

    if (shouldFetch('défi') || shouldFetch('défis')) {
        const { data: challenges, error: cError } = await supabase
            .from('challenges')
            .select('*')
            .eq('company_id', companyId);
        if (!cError) context.challenges = (challenges || []) as Challenge[];
    }

    if (shouldFetch('badge') || shouldFetch('badges')) {
        const { data: badges, error: bdgError } = await supabase
            .from('badges')
            .select('*')
            .eq('company_id', companyId);
        if (!bdgError) context.badges = (badges || []) as Badge[];
    }

    if (shouldFetch('prévision') || shouldFetch('prévisions') || shouldFetch('forecast')) {
        const { data: forecasts, error: fError } = await supabase
            .from('forecasts')
            .select('*')
            .eq('company_id', companyId)
            .order('date', { ascending: true });
        if (!fError) context.forecasts = (forecasts || []) as Forecast[];
    }

    return context;
}

function computeDerivedData(context: DataContext, intent: Intent): any {
    const result: any = {};
    const transactions = context.transactions || [];

    // Calculs de base
    const totalRevenue = transactions
        .filter((t: Transaction) => t.type === 'sale' || t.type === 'income')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter((t: Transaction) => t.type !== 'sale' && t.type !== 'income')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    const netCash = totalRevenue - totalExpenses;
    const sales = transactions.filter((t: Transaction) => t.type === 'sale');
    const avgBasket = sales.length > 0 ? totalRevenue / sales.length : 0;

    result.totalRevenue = totalRevenue;
    result.totalExpenses = totalExpenses;
    result.netCash = netCash;
    result.averageBasket = avgBasket;
    result.transactionCount = transactions.length;

    // Prévision de trésorerie à 30 jours
    if (transactions.length > 5) {
        const sorted = [...transactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const dailyCash: { [key: string]: number } = {};
        sorted.forEach((t: Transaction) => {
            const date = new Date(t.created_at).toDateString();
            dailyCash[date] = (dailyCash[date] || 0) + (t.type === 'sale' || t.type === 'income' ? t.amount : -t.amount);
        });
        const days = Object.keys(dailyCash).slice(-30);
        const values = days.map((d: string) => dailyCash[d]);
        const last7 = values.slice(-7);
        const avgDaily = last7.reduce((a: number, b: number) => a + b, 0) / (last7.length || 1);
        result.forecast30Days = avgDaily * 30;
    } else {
        result.forecast30Days = null;
    }

    // Top catégories de dépenses
    const expensesByCategory: { [key: string]: number } = {};
    transactions
        .filter((t: Transaction) => t.type !== 'sale' && t.type !== 'income')
        .forEach((t: Transaction) => {
            const cat = t.category || 'Autre';
            expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount;
        });
    const sortedCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
    result.topExpenseCategories = sortedCategories.slice(0, 5);

    // Taux de complétion des objectifs
    if (context.goals && context.goals.length > 0) {
        const totalGoals = context.goals.length;
        const completedGoals = context.goals.filter((g: Goal) => g.status === 'achieved').length;
        result.goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    }

    return result;
}

async function generateAnswer(
    question: string,
    history: any[],
    dataContext: DataContext,
    computed: any,
    intent: Intent
): Promise<string> {
    const dataSummary = `
    Données disponibles :
    - Chiffre d'affaires total : ${computed.totalRevenue ?? 'non disponible'} MAD
    - Dépenses totales : ${computed.totalExpenses ?? 'non disponible'} MAD
    - Trésorerie nette : ${computed.netCash ?? 'non disponible'} MAD
    - Panier moyen : ${computed.averageBasket ?? 'non disponible'} MAD
    - Prévision trésorerie 30 jours : ${computed.forecast30Days !== null ? computed.forecast30Days + ' MAD' : 'non disponible'}
    - Nombre de transactions : ${computed.transactionCount ?? 'non disponible'}
    - Top catégories de dépenses : ${computed.topExpenseCategories ? computed.topExpenseCategories.map(([c, m]: [string, number]) => `${c} (${m} MAD)`).join(', ') : 'non disponible'}
    - Budgets : ${dataContext.budgets?.length || 0} budgets
    - Objectifs d'épargne : ${dataContext.goals?.length || 0} objectifs (taux de complétion : ${computed.goalCompletionRate?.toFixed(1) || '0'}%)
    - Défis : ${dataContext.challenges?.length || 0} défis
    - Badges : ${dataContext.badges?.length || 0} badges
    - Prévisions : ${dataContext.forecasts?.length || 0} prévisions enregistrées
    `;

    const prompt = `
    Tu es Aria, l'assistant IA de DecisionIA. Tu es un expert en finance et gestion d'entreprise.

    Voici les données réelles disponibles :
    ${dataSummary}

    Question de l'utilisateur : "${question}"

    Historique de la conversation (derniers échanges) : ${JSON.stringify(history.slice(-3))}

    Consignes :
    - Utilise UNIQUEMENT les données fournies.
    - Si une donnée demandée n'est pas disponible, dis-le clairement : "Je n'ai pas trouvé cette information."
    - Distingue les données réelles, les calculs, les prévisions et les recommandations.
    - Propose des actions concrètes si pertinent.
    - Réponds de manière claire, structurée (puces, paragraphes), avec des émojis.
    - Adapte le niveau de détail : si la question est large, résumé ; si précise, détail.
    - Si la question est simple (salutation, demande de capacité), réponds en présentant tes capacités.
    - Pour les questions "what-if", propose une simulation basée sur les données disponibles.
    - Pour les questions de risque, identifie les signaux d'alerte et suggère des actions.

    Réponse :
    `;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: 'Tu es un assistant financier expert. Réponds en français, utilise les données fournies, sois précis et utile.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.5,
            max_tokens: 1500,
        });
        return completion.choices[0]?.message?.content || 'Je n\'ai pas pu générer une réponse.';
    } catch (error) {
        console.error('Erreur génération réponse:', error);
        return '❌ Je rencontre un problème technique. Veuillez réessayer.';
    }
}

function enrichAnswer(answer: string, dataContext: DataContext, intent: Intent): any {
    const entities = intent.entities || [];
    const hasChart = entities.some((e: string) => e.includes('répartition') || e.includes('évolution') || e.includes('comparaison'));

    let chartData = null;
    let tableData = null;

    if (hasChart && dataContext.transactions) {
        const expenses = dataContext.transactions.filter((t: Transaction) => t.type !== 'sale' && t.type !== 'income');
        const catMap: { [key: string]: number } = {};
        expenses.forEach((t: Transaction) => {
            const cat = t.category || 'Autre';
            catMap[cat] = (catMap[cat] || 0) + t.amount;
        });
        chartData = Object.entries(catMap).map(([name, value]) => ({ name, value }));
        tableData = chartData.slice(0, 10);
    }

    return {
        answer,
        chartData,
        tableData,
        actions: ['📊 Voir les détails', '💡 Plus d\'analyses', '📤 Exporter']
    };
}