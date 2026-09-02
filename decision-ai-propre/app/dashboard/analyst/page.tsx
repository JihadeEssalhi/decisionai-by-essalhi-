'use client'

import { BarChart3, TrendingUp, FileText, Sparkles } from 'lucide-react'

export default function AnalystDashboard() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Analyst Dashboard</h1>
            <p className="text-white/60 mb-8">Analyse, prédiction et reporting</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <BarChart3 className="text-blue-400 mb-3" size={24} />
                    <h3 className="text-white/40 text-sm">Analyses</h3>
                    <p className="text-xl font-bold text-white">24 rapports</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <TrendingUp className="text-violet-400 mb-3" size={24} />
                    <h3 className="text-white/40 text-sm">Prédictions</h3>
                    <p className="text-xl font-bold text-white">+15% croissance</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <FileText className="text-green-400 mb-3" size={24} />
                    <h3 className="text-white/40 text-sm">Reporting</h3>
                    <p className="text-xl font-bold text-white">12 rapports</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <Sparkles className="text-yellow-400 mb-3" size={24} />
                    <h3 className="text-white/40 text-sm">Insights IA</h3>
                    <p className="text-xl font-bold text-white">8 recommandations</p>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Dernières analyses</h2>
                <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                            <div>
                                <h4 className="text-white font-medium">Analyse Q{item}</h4>
                                <p className="text-white/40 text-sm">Performance trimestrielle</p>
                            </div>
                            <span className="text-green-400 text-sm">+15.2%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}