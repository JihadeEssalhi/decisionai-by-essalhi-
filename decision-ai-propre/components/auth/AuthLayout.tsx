import { ReactNode } from "react";
import { BrainCircuit, Sparkles } from "lucide-react";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white text-[#0F172A]">
            {/* ─── GAUCHE : Formulaire ─── */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12">
                <div className="w-full max-w-md space-y-8">

                    {/* Logo Compact */}
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                            <BrainCircuit className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-[#0F172A]">DecisionAI</span>
                            <span className="text-[8px] font-medium tracking-wider text-blue-500 uppercase">by Essalhi</span>
                        </div>
                    </div>

                    {/* En-tête */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">{title}</h1>
                        <p className="text-slate-500 text-base">{subtitle}</p>
                    </div>

                    {/* Le formulaire spécifique (Login ou Register) passé en enfant */}
                    {children}

                    {/* Pied de page sécurité */}
                    <div className="text-center text-xs text-slate-400">
                        <span className="flex items-center justify-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Sécurisé par DecisionAI
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── DROITE : Marque Premium (Corporate) ─── */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-indigo-900 items-center justify-center p-12 relative overflow-hidden">
                {/* Ambiance lumineuse */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-center max-w-lg text-white space-y-8">
                    <div className="flex justify-center mb-2">
                        <div className="h-24 w-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                            <BrainCircuit className="h-12 w-12" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight">DecisionAI</h2>
                    <p className="text-blue-100/90 text-xl leading-relaxed font-light">
                        L'intelligence artificielle au service de vos décisions.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                        <div className="space-y-1">
                            <p className="text-2xl font-bold">+15%</p>
                            <p className="text-xs text-blue-200/70">Croissance projetée</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold">99,8%</p>
                            <p className="text-xs text-blue-200/70">Précision IA</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}