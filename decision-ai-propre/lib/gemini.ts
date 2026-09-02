// lib/gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================
// TYPES
// ============================================================

export interface DashboardAnalysis {
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
    summary: string;
    alerts: { severity: 'critical' | 'high' | 'medium' | 'info'; title: string; description: string }[];
    insights: { type: 'anomaly' | 'trend' | 'recommendation'; title: string; description: string }[];
    topFlop: { name: string; change: number; type: 'top' | 'flop' }[];
}

// ✅ Types pour l'analyse des catégories
interface CategoryInsight {
    type: string;
    title: string;
    description: string;
}

interface CategoryRecommendation {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

interface CategoryAnomaly {
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
}

interface CategoryAnalysisResult {
    insights: CategoryInsight[];
    recommendations: CategoryRecommendation[];
    anomalies: CategoryAnomaly[];
}

// ============================================================
// ANALYSE DE L'ENTREPRISE
// ============================================================

export async function analyzeCompanyData(formData: any): Promise<DashboardAnalysis> {
    console.log('📤 [analyzeCompanyData] Début de l\'analyse...');

    try {
        if (!formData || typeof formData !== 'object') {
            console.warn('⚠️ Données invalides, utilisation du fallback');
            return generateFallbackAnalysis(formData || {});
        }

        const prompt = buildPrompt(formData);
        console.log('📝 Prompt construit, longueur:', prompt.length);

        const response = await fetch('/api/groq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                model: 'openai/gpt-oss-120b'
            }),
        });

        console.log('📥 Statut de la réponse:', response.status);

        const text = await response.text();
        console.log('📥 Réponse brute (200 premiers caractères):', text.substring(0, 200) + '...');

        if (!text || text.trim() === '') {
            console.warn('⚠️ Réponse vide, utilisation du fallback');
            return generateFallbackAnalysis(formData);
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('❌ Erreur parsing JSON:', parseError);
            if (text.includes('<!DOCTYPE html>')) {
                console.error('❌ L\'API /api/groq n\'est pas accessible (404)');
                return generateFallbackAnalysis(formData);
            }
            return generateFallbackAnalysis(formData);
        }

        if (!response.ok) {
            console.error('❌ Erreur HTTP:', response.status, data);
            return generateFallbackAnalysis(formData);
        }

        if (data.success === false) {
            console.error('❌ Erreur API:', data.error || 'Erreur inconnue');
            return generateFallbackAnalysis(formData);
        }

        if (!data.text) {
            console.error('❌ Pas de texte dans la réponse');
            return generateFallbackAnalysis(formData);
        }

        console.log('✅ Réponse reçue, parsing...');
        return parseAIResponse(data.text, formData);

    } catch (error) {
        console.error('❌ Erreur analyse:', error);
        return generateFallbackAnalysis(formData);
    }
}

// ============================================================
// FONCTION DE PARSING
// ============================================================

function parseAIResponse(text: string, formData: any): DashboardAnalysis {
    try {
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('⚠️ Aucun JSON trouvé, utilisation du fallback');
            return generateFallbackAnalysis(formData);
        }

        const analysis = JSON.parse(jsonMatch[0]);
        console.log('✅ Analyse parsée avec succès');

        return {
            healthScore: analysis.healthScore || 50,
            profitabilityStatus: analysis.profitabilityStatus || 'warning',
            growthPotential: analysis.growthPotential || 'medium',
            monthlyProfit: analysis.monthlyProfit || 0,
            profitMargin: analysis.profitMargin || 0,
            annualProjection: analysis.annualProjection || 0,
            recommendations: analysis.recommendations || ['Optimiser les coûts', 'Développer les ventes'],
            strengths: analysis.strengths || ['Structure stable'],
            weaknesses: analysis.weaknesses || ['Marge à améliorer'],
            suggestedKPIs: analysis.suggestedKPIs || ['CA mensuel', 'Marge', 'Taux de rétention'],
            executiveSummary: analysis.executiveSummary || 'Analyse non disponible',
            summary: analysis.summary || analysis.executiveSummary || 'Analyse non disponible',
            alerts: analysis.alerts || [],
            insights: analysis.insights || [],
            topFlop: analysis.topFlop || [],
        };
    } catch (error) {
        console.error('❌ Erreur parsing:', error);
        return generateFallbackAnalysis(formData);
    }
}

// ============================================================
// BUILD PROMPT
// ============================================================

function buildPrompt(formData: any): string {
    return `
Analyse les données suivantes d'une entreprise marocaine et fournis une analyse stratégique complète.

DONNÉES DE L'ENTREPRISE :
- Nom : ${formData.name || 'Non renseigné'}
- Secteur : ${formData.sector || 'Non renseigné'}
- CA mensuel : ${formData.monthly_revenue || 0} MAD
- Dépenses mensuelles : ${formData.monthly_expenses || 0} MAD
- Bénéfice : ${(formData.monthly_revenue || 0) - (formData.monthly_expenses || 0)} MAD
- Clients : ${formData.customer_count || 0}
- Employés : ${formData.employee_count || 0}

Génère UNIQUEMENT un JSON valide avec :
{
  "healthScore": 0-100,
  "profitabilityStatus": "excellent|good|warning|critical",
  "growthPotential": "high|medium|low",
  "monthlyProfit": 0,
  "profitMargin": 0,
  "annualProjection": 0,
  "recommendations": ["rec1", "rec2", "rec3"],
  "strengths": ["force1", "force2", "force3"],
  "weaknesses": ["faiblesse1", "faiblesse2"],
  "suggestedKPIs": ["KPI1", "KPI2", "KPI3"],
  "executiveSummary": "résumé en français",
  "summary": "résumé court",
  "alerts": [],
  "insights": [],
  "topFlop": []
}`;
}

// ============================================================
// FALLBACK
// ============================================================

function generateFallbackAnalysis(formData: any): DashboardAnalysis {
    const revenue = parseFloat(formData?.monthly_revenue) || 0;
    const expenses = parseFloat(formData?.monthly_expenses) || 0;
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
        healthScore: Math.min(100, 40 + margin / 2),
        profitabilityStatus: margin > 30 ? 'excellent' : margin > 15 ? 'good' : margin > 5 ? 'warning' : 'critical',
        growthPotential: margin > 20 ? 'high' : margin > 10 ? 'medium' : 'low',
        monthlyProfit: profit,
        profitMargin: margin,
        annualProjection: profit * 12,
        recommendations: [
            profit > 0 ? 'Continuez à optimiser vos coûts' : 'Réduisez vos coûts opérationnels',
            'Développez votre base de clients',
            'Améliorez votre présence digitale'
        ],
        strengths: [
            revenue > 0 ? 'Génération de revenus' : 'Activité en développement',
            'Structure en place'
        ],
        weaknesses: [
            margin < 15 ? 'Marge à améliorer' : 'Aucune faiblesse majeure',
            'Optimisation possible'
        ],
        suggestedKPIs: ['Chiffre d\'affaires mensuel', 'Marge brute', 'Taux de croissance'],
        executiveSummary: `L'entreprise ${formData?.name || 'non nommée'} génère un CA mensuel de ${revenue} MAD avec une marge de ${margin.toFixed(1)}%. ${margin > 15 ? 'La rentabilité est bonne' : 'La rentabilité nécessite une optimisation'}.`,
        summary: `CA mensuel: ${revenue} MAD, Marge: ${margin.toFixed(1)}%`,
        alerts: [],
        insights: [],
        topFlop: []
    };
}

// ============================================================
// ANALYSE DES CATÉGORIES - VERSION CORRIGÉE
// ============================================================

export async function analyzeCategories(categoriesData: any[]): Promise<CategoryAnalysisResult> {
    try {
        // ✅ Types explicites pour les tableaux
        const insights: CategoryInsight[] = [];
        const recommendations: CategoryRecommendation[] = [];
        const anomalies: CategoryAnomaly[] = [];

        // ✅ Vérifier que les données sont valides
        if (!categoriesData || !Array.isArray(categoriesData) || categoriesData.length === 0) {
            console.warn('⚠️ Aucune catégorie à analyser');
            return { insights, recommendations, anomalies };
        }

        // ✅ Analyser chaque catégorie
        categoriesData.forEach((c: any) => {
            // ✅ Catégories en croissance
            if (c.evolution > 15) {
                insights.push({
                    type: 'trend',
                    title: `📈 ${c.name} en forte croissance`,
                    description: `La catégorie ${c.name} a augmenté de ${c.evolution.toFixed(1)}%, dépassant la moyenne.`
                });
            }

            // ✅ Catégories en baisse
            if (c.evolution < -10) {
                anomalies.push({
                    severity: 'high',
                    title: `⚠️ Baisse sur ${c.name}`,
                    description: `La catégorie ${c.name} a chuté de ${Math.abs(c.evolution).toFixed(1)}%. Une attention est nécessaire.`
                });
            }

            // ✅ Catégories dominantes
            if (c.revenue_percentage > 25) {
                insights.push({
                    type: 'opportunity',
                    title: `💪 ${c.name} est dominante`,
                    description: `Cette catégorie représente ${c.revenue_percentage.toFixed(1)}% du CA total.`
                });
            }
        });

        // ✅ Recommandations
        if (categoriesData.length > 0) {
            const topCategory = categoriesData.reduce((a, b) => (a.revenue > b.revenue ? a : b), categoriesData[0]);
            if (topCategory && topCategory.revenue > 0) {
                recommendations.push({
                    title: `🚀 Développer ${topCategory.name}`,
                    description: `Cette catégorie est la plus performante avec ${topCategory.revenue} MAD. Investissez davantage.`,
                    priority: 'high'
                });
            }

            const declining = categoriesData.filter((c: any) => c.evolution < -5);
            if (declining.length > 0) {
                recommendations.push({
                    title: `🔍 Analyser ${declining.map((d: any) => d.name).join(', ')}`,
                    description: `Ces catégories sont en baisse, analysez les causes.`,
                    priority: 'medium'
                });
            }
        }

        // ✅ Si aucun insight n'a été généré
        if (insights.length === 0) {
            insights.push({
                type: 'trend',
                title: '📊 Stabilité générale',
                description: 'Toutes les catégories sont stables, aucune tendance majeure détectée.'
            });
        }

        return { insights, recommendations, anomalies };

    } catch (error) {
        console.error('❌ Erreur analyse catégories:', error);
        return { insights: [], recommendations: [], anomalies: [] };
    }
}