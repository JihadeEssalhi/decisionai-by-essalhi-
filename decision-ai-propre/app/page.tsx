"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Check,
  ChevronDown,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Database,
  FileBarChart,
  Send,
  Menu,
  X,
  BrainCircuit,
  PlayCircle,
  Rocket,
  Star,
  MessageSquare,
  Moon,
  Sun,
} from "lucide-react";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"fr" | "en" | "ar">("fr");

  // ═══ GESTION DU THÈME SOMBRE/CLAIR ═══
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme === "dark" ? "dark" : "";
    } else {
      document.documentElement.className = "dark";
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme === "dark" ? "dark" : "";
  };

  // ═══ GESTION DU CLIC SUR LE BOUTON PRINCIPAL ═══
  const handleStart = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.href = "/register";
    }, 1000);
  };

  // ═══ CHANGEMENT DE LANGUE ═══
  const handleLanguageChange = (code: "fr" | "en" | "ar") => {
    setLanguage(code);
    console.log("Langue changée vers :", code);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030b] text-white dark:bg-[#03030b] dark:text-white transition-colors duration-300">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[35%] top-[15%] h-[500px] w-[500px] rounded-full bg-violet-700/10 blur-[150px]" />
        <div className="absolute right-[5%] top-[35%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[160px]" />
        <div className="absolute bottom-[-200px] left-[35%] h-[500px] w-[700px] rounded-full bg-purple-700/10 blur-[170px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* =====================================================
          NAVBAR
      ====================================================== */}
      <nav className="sticky top-0 z-50 mx-auto flex max-w-[1450px] items-center justify-between border-b border-white/5 bg-[#03030b]/90 px-6 py-4 backdrop-blur-xl lg:px-10">

        {/* LOGO - DAI AVEC TEXTE EN DEUX LIGNES */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <img
              src="/dai-logo.png"
              alt="DAI Logo"
              className="h-16 w-auto object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white">DecisionAI</span>
              <span className="text-[11px] font-medium text-blue-400">By Essalhi</span>
            </div>
          </Link>
        </div>

        {/* DESKTOP NAV */}
        <div className="hidden items-center gap-10 text-sm text-white/65 lg:flex">
          <a href="#fonctionnalites" className="transition hover:text-white">Fonctionnalités</a>
          <a href="#comment" className="transition hover:text-white">Comment ça marche</a>
          <a href="#avis" className="transition hover:text-white">Avis</a>
          <a href="#tarifs" className="transition hover:text-white">Tarifs</a>
        </div>

        {/* ACTIONS */}
        <div className="hidden items-center gap-3 lg:flex">

          {/* Sélecteur de Langue */}
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/5">
              <span className="text-base">🌐</span>
              <span>
                {language === "fr" && "Français"}
                {language === "en" && "English"}
                {language === "ar" && "العربية"}
              </span>
              <ChevronDown size={14} className="ml-1 text-white/40 transition group-hover:rotate-180" />
            </button>

            <div className="absolute right-0 top-full mt-2 w-40 origin-top-right rounded-xl border border-white/10 bg-[#0a0a18]/95 p-1.5 shadow-xl opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible backdrop-blur-xl">
              {[
                { label: "English", code: "en" },
                { label: "Français", code: "fr" },
                { label: "العربية", code: "ar" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as "fr" | "en" | "ar")}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${language === lang.code
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  {lang.label}
                  {language === lang.code && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Sombre/Clair */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition"
          >
            {theme === "dark" ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-blue-400" />}
          </button>

          {/* Espace client */}
          <Link href="/login">
            <button className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/5">
              Espace client
            </button>
          </Link>

          {/* Essayer gratuitement */}
          <Link href="/register">
            <button
              onClick={handleStart}
              disabled={loading}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-violet-600/20 transition hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Chargement..." : "Essayer gratuitement"}
              {!loading && <ArrowRight size={16} className="transition group-hover:translate-x-1" />}
            </button>
          </Link>
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="rounded-xl border border-white/10 p-3 lg:hidden"
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="relative z-50 mx-5 rounded-2xl border border-white/10 bg-[#0a0a18]/95 p-6 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-5 text-white/70">
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#comment">Comment ça marche</a>
            <a href="#avis">Avis</a>
            <a href="#tarifs">Tarifs</a>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleLanguageChange("fr")} className={`flex-1 rounded-xl py-2 text-xs ${language === "fr" ? "bg-violet-600 text-white" : "bg-white/10"}`}>Français</button>
              <button onClick={() => handleLanguageChange("en")} className={`flex-1 rounded-xl py-2 text-xs ${language === "en" ? "bg-violet-600 text-white" : "bg-white/10"}`}>English</button>
              <button onClick={() => handleLanguageChange("ar")} className={`flex-1 rounded-xl py-2 text-xs ${language === "ar" ? "bg-violet-600 text-white" : "bg-white/10"}`}>العربية</button>
            </div>
            <button onClick={toggleTheme} className="flex items-center gap-2 rounded-xl bg-white/10 py-3 justify-center">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Mode Clair" : "Mode Sombre"}
            </button>
            <Link href="/register">
              <button onClick={handleStart} disabled={loading} className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3 font-semibold w-full">
                {loading ? "Chargement..." : "Essayer gratuitement"}
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative mx-auto flex max-w-[1450px] flex-col px-6 pb-16 pt-10 lg:min-h-[790px] lg:flex-row lg:items-center lg:px-10 lg:pt-4">

        {/* LEFT SIDE */}
        <div className="relative z-30 w-full lg:w-[39%]">

          {/* BADGE */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
            <Sparkles size={15} />
            Nouveau — IA Générative & Prédictive
          </div>

          {/* TITLE */}
          <h1 className="max-w-[650px] text-[48px] font-black leading-[0.98] tracking-[-0.045em] sm:text-[60px] lg:text-[68px] xl:text-[76px]">
            Transformez vos <br />
            données en <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
              décisions
            </span> <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
              stratégiques
            </span>
          </h1>

          {/* DESCRIPTION */}
          <p className="mt-7 max-w-[570px] text-[16px] leading-7 text-white/55 lg:text-[17px]">
            DecisionAI by Essalhi est une plateforme de Business Intelligence
            qui vous permet de{" "}
            <span className="font-semibold text-blue-400">
              parler à vos données
            </span>{" "}
            et d'anticiper les tendances du marché grâce à l'IA générative.
          </p>

          {/* BUTTONS */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/register">
              <button
                onClick={handleStart}
                disabled={loading}
                className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-4 font-semibold shadow-xl shadow-violet-600/20 transition hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Zap size={18} />
                {loading ? "Chargement..." : "Commencer gratuitement"}
                {!loading && <ArrowRight size={17} className="transition group-hover:translate-x-1" />}
              </button>
            </Link>

            <button className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.02] px-6 py-4 font-medium text-white/80 transition hover:bg-white/5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
                <span className="ml-[2px] text-[9px]">▶</span>
              </span>
              Voir la démo
            </button>
          </div>

          <div className="mt-4 text-xs text-white/35">
            14 jours offerts · Sans engagement
          </div>
        </div>

        {/* RIGHT SIDE — DASHBOARD */}
        <div className="relative mt-16 w-full lg:mt-0 lg:w-[61%]">

          {/* GLOW */}
          <div className="absolute left-[25%] top-[20%] h-[350px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />

          {/* DASHBOARD CONTAINER */}
          <div className="dashboard-float relative z-10 mx-auto w-full max-w-[850px]">

            {/* DASHBOARD */}
            <div className="relative min-h-[560px] overflow-hidden rounded-[25px] border border-violet-500/25 bg-[#080817]/95 shadow-[0_0_100px_rgba(77,50,255,0.18)] backdrop-blur-xl">

              {/* TOP BAR - AVEC DecisionAI en haut et By Essalhi en bas */}
              <div className="flex h-[70px] items-center border-b border-white/[0.07] px-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/dai-logo.png"
                    alt="DAI Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold text-white">DecisionAI</span>
                    <span className="text-[10px] font-medium text-blue-400">By Essalhi</span>
                  </div>
                </div>
                <div className="ml-6 text-sm text-white/50">
                  Dashboard
                </div>
              </div>

              <div className="flex">
                <aside className="hidden w-[150px] shrink-0 border-r border-white/[0.07] p-4 sm:block">
                  <div className="space-y-2">
                    <SideItem icon={<LayoutDashboard size={15} />} label="Accueil" active />
                    <SideItem icon={<BarChart3 size={15} />} label="Analytics" />
                    <SideItem icon={<TrendingUp size={15} />} label="Prédictions" />
                    <SideItem icon={<FileText size={15} />} label="Rapports" />
                    <SideItem icon={<Database size={15} />} label="Documents" />
                    <SideItem icon={<Bell size={15} />} label="Alertes" />
                    <SideItem icon={<Settings size={15} />} label="Paramètres" />
                  </div>
                  <div className="absolute bottom-5 left-4 hidden items-center gap-2 sm:flex">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-orange-300 text-xs font-bold text-black">
                      JE
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Jihade E.</div>
                      <div className="text-[10px] text-white/40">Admin</div>
                    </div>
                  </div>
                </aside>

                <div className="min-w-0 flex-1 p-5 sm:p-7">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold">Vue d'ensemble</h2>
                    <p className="mt-1 text-xs text-white/35">Suivez vos performances en temps réel</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <StatCard title="Revenu total" value="2,45M MAD" change="+15,2%" icon={<Activity size={14} />} />
                    <StatCard title="Croissance prévue" value="+15%" change="Ce trimestre" purple icon={<TrendingUp size={14} />} />
                    <StatCard title="Clients actifs" value="8,732" change="+8,4%" icon={<Users size={14} />} />
                    <StatCard title="Taux de conversion" value="24,6%" change="+3,1%" icon={<BarChart3 size={14} />} />
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Évolution des revenus</h3>
                        <p className="mt-1 text-[10px] text-white/35">Performance des 7 derniers mois</p>
                      </div>
                      <button className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-white/50">
                        Les 7 derniers mois
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    <RevenueChart />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium">Répartition par canal</span>
                        <BarChart3 size={14} className="text-violet-400" />
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="h-20 w-20 rounded-full" style={{ background: "conic-gradient(#7c3aed 0 45%, #3b82f6 45% 75%, #22c55e 75% 90%, #a855f7 90% 100%)" }}>
                          <div className="m-[11px] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#0b0b1a] text-[9px] text-white/50">
                            100%
                          </div>
                        </div>
                        <div className="space-y-2 text-[10px] text-white/45">
                          <div>● Web — 45%</div>
                          <div>● Mobile — 30%</div>
                          <div>● Email — 15%</div>
                          <div>● Autres — 10%</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-green-400" />
                        <div>
                          <div className="text-xs font-semibold">Données sécurisées</div>
                          <div className="mt-1 text-[10px] text-white/35">Protection avancée</div>
                        </div>
                      </div>
                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
                      </div>
                      <div className="mt-2 text-right text-[10px] text-green-400">
                        100% sécurisé
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ASSISTANT — FLOATING */}
            <div className="assistant-float absolute -bottom-8 right-[-20px] z-30 w-[310px] overflow-hidden rounded-[22px] border border-violet-400/30 bg-[#0b0b1c]/95 shadow-[0_25px_100px_rgba(75,40,255,0.35)] backdrop-blur-2xl sm:right-[-35px]">
              <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-600 shadow-lg shadow-blue-500/20">
                  <Bot size={19} />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0b0b1c] bg-green-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">Assistant DecisionAI</div>
                  <div className="flex items-center gap-1 text-[10px] text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    En ligne
                  </div>
                </div>
                <span className="text-white/30">×</span>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <div className="max-w-[230px] rounded-2xl rounded-tl-md bg-white/[0.06] p-3 text-xs leading-5 text-white/75">
                    Bonjour 👋 <br />
                    Je suis votre assistant. <br />
                    Comment puis-je vous aider ?
                  </div>
                  <div className="mt-1 text-[9px] text-white/20">10:22</div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[230px] rounded-2xl rounded-tr-md bg-gradient-to-br from-blue-500 to-violet-600 p-3 text-xs leading-5">
                    Quelles sont les prévisions pour le prochain trimestre ?
                  </div>
                </div>
                <div>
                  <div className="rounded-2xl rounded-tl-md bg-white/[0.06] p-3 text-xs leading-5 text-white/75">
                    D'après l'analyse, une croissance de <span className="font-bold text-green-400">15%</span> est projetée pour le prochain trimestre.
                  </div>
                  <div className="mt-3 flex h-12 items-end gap-1 rounded-xl bg-white/[0.025] p-2">
                    {[25, 34, 29, 42, 47, 55, 65].map((height, index) => (
                      <div key={index} className="flex-1 rounded-t bg-gradient-to-t from-blue-500/40 to-violet-400" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                  <div className="mt-1 text-[9px] text-white/20">10:23</div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                  <input placeholder="Posez votre question..." className="min-w-0 flex-1 bg-transparent px-2 text-xs text-white outline-none placeholder:text-white/25" />
                  <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FLOATING CHAT BUTTON */}
          <button className="absolute -bottom-14 right-0 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_0_40px_rgba(100,60,255,0.5)] transition hover:scale-110">
            <MessageCircle size={23} />
          </button>
        </div>
      </section>

      {/* =====================================================
          TRUSTED COMPANIES
      ====================================================== */}
      <section className="mx-auto max-w-[1350px] px-6 pb-6 lg:px-10">
        <div className="border-t border-white/[0.06] pt-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1 text-xs text-white/40">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400"></span>
              Base installée
            </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                +20
              </span>
              <span className="text-sm font-medium text-white/60">
                Entreprises en croissance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATS
      ====================================================== */}
      <section
        id="fonctionnalites"
        className="mx-auto max-w-[1350px] px-6 pb-20 lg:px-10"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureStat
            icon={<Users size={24} />}
            value="20+"
            label="Entreprises accompagnées"
          />
          <FeatureStat
            icon={<BarChart3 size={24} />}
            value="99%"
            label="Satisfaction client"
          />
          <FeatureStat
            icon={<Activity size={24} />}
            value="24/24"
            label="Support réactif"
          />
          <FeatureStat
            icon={<ShieldCheck size={24} />}
            value="100%"
            label="Données sécurisées"
          />
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section id="comment" className="mx-auto max-w-[1200px] px-6 py-20 lg:px-10">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-medium text-violet-400 bg-violet-500/10 px-4 py-1.5 rounded-full border border-violet-500/20 mb-4">Comment ça marche</span>
          <h2 className="text-4xl font-bold tracking-tight">En 3 étapes, prenez de meilleures décisions</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-1/2 left-[16%] w-[28%] h-px bg-white/10 transform -translate-y-1/2"></div>
          <div className="hidden md:block absolute top-1/2 left-[58%] w-[28%] h-px bg-white/10 transform -translate-y-1/2"></div>
          {[
            { step: "01", icon: Database, title: "Connectez vos données", desc: "Intégrez vos bases de données, fichiers CSV ou APIs en quelques clics." },
            { step: "02", icon: MessageSquare, title: "Posez vos questions", desc: "Interrogez vos données en langage naturel, comme si vous parliez à un expert." },
            { step: "03", icon: Rocket, title: "Décidez en confiance", desc: "Recevez des insights clairs, des prévisions fiables et des recommandations actionnables." }
          ].map((item, index) => (
            <div key={index} className="text-center p-6 group hover:bg-white/5 rounded-2xl transition-all duration-300">
              <div className="text-6xl font-extrabold text-white/10 mb-4">{item.step}</div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/10">
                <item.icon className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-white/50">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          TESTIMONIALS
      ====================================================== */}

      <section id="avis" className="mx-auto max-w-[1200px] px-6 py-20 lg:px-10 border-t border-white/10">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-medium text-violet-400 bg-violet-500/10 px-4 py-1.5 rounded-full border border-violet-500/20 mb-4">Témoignages</span>
          <h2 className="text-4xl font-bold tracking-tight">Ce que nos utilisateurs pensent</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: "Mohammed Amrani", text: "DecisionAI a révolutionné notre façon de piloter la performance. Nous gagnons un temps précieux et nos décisions sont bien plus éclairées.", initials: "MA" },
            { name: "Ilyas El Fassi", text: "La capacité à poser des questions en langage naturel et à obtenir des prévisions en temps réel est un véritable game-changer.", initials: "IE" },
            { name: "Fatima Zahra", text: "L'interface est magnifique, l'IA est intelligente, et les insights sont toujours pertinents. Un outil indispensable.", initials: "FZ" }
          ].map((testimonial, index) => (
            <div key={index} className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-violet-500/30 transition-all duration-300 hover:bg-white/[0.06]">
              <div className="flex gap-1 text-yellow-500 mb-4 text-sm">{[...Array(5)].map((_, i) => <span key={i}>★</span>)}</div>
              <p className="text-white/60 italic mb-6 leading-relaxed">"{testimonial.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400">{testimonial.initials}</div>
                <div className="font-medium text-white">{testimonial.name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          CTA FINAL
      ====================================================== */}

      <section className="mx-auto max-w-5xl px-6 py-16 mb-12">
        <div className="rounded-3xl bg-gradient-to-br from-violet-900/50 via-blue-900/50 to-purple-900/50 border border-violet-500/30 backdrop-blur-xl shadow-2xl shadow-violet-500/10 overflow-hidden p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            Prêt à <span className="text-yellow-300">révolutionner</span> votre pilotage ?
          </h2>
          <p className="text-blue-100/80 text-lg max-w-xl mx-auto mb-8">
            Rejoignez plus de 500 entreprises qui transforment déjà leur prise de décision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-black hover:bg-slate-200 shadow-lg transition-all duration-300 rounded-full px-8 py-3 font-bold flex items-center gap-2">
              <Rocket className="h-5 w-5" /> Commencer maintenant
            </button>
            <button className="border border-white/30 text-white hover:bg-white/10 transition-all duration-300 rounded-full px-8 py-3 font-bold flex items-center gap-2">
              <PlayCircle className="h-5 w-5" /> Programmer une démo
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          WIDGET IA FLOTTANT
      ====================================================== */}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        {isChatOpen && (
          <div className="w-80 sm:w-96 bg-[#0b0b1c]/95 border border-violet-500/30 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-violet-500/20 mb-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <BrainCircuit className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">Copilot IA</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 min-h-[140px]">
              <div className="bg-white/5 rounded-xl rounded-tl-none p-3 max-w-[85%] border border-white/5">
                <p className="text-sm text-white/70">Bonjour ! Je suis le Copilot de DecisionAI. Posez-moi une question.</p>
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 pt-3 mt-2">
                <input disabled placeholder="Fonctionnalité à venir..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/50 focus:outline-none" />
                <button disabled className="bg-gradient-to-br from-blue-500 to-violet-600 text-white opacity-50 rounded-lg w-8 h-8 flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => setIsChatOpen(!isChatOpen)} className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_0_40px_rgba(100,60,255,0.4)] flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95">
          {isChatOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-white/[0.06] py-12 bg-[#03030b]">
        <div className="mx-auto max-w-[1350px] px-6 lg:px-10">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
                  <img
                    src="/dai-logo.png"
                    alt="DAI Logo"
                    className="h-12 w-auto object-contain"
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold text-white">DecisionAI</span>
                    <span className="text-[10px] font-medium text-blue-400">By Essalhi</span>
                  </div>
                </Link>
              </div>
              <p className="text-sm text-white/40 max-w-xs">La plateforme de décision intelligente qui transforme vos données en insights stratégiques.</p>
            </div>
            {[
              { title: "Plateforme", links: ["Fonctionnalités", "Tarifs", "Documentation", "API"] },
              { title: "Société", links: ["À propos", "Carrières", "Blog", "Contact"] },
              { title: "Légal", links: ["Confidentialité", "CGU", "CGV", "Cookies"] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold mb-4 text-white/60 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}><a href="#" className="text-white/30 hover:text-white text-sm transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/[0.05] text-center text-sm text-white/30">
            <p>&copy; {new Date().getFullYear()} DecisionAI by Essalhi. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ============================================================
   COMPOSANTS
============================================================ */

function SideItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] transition ${active ? "bg-gradient-to-r from-blue-500/90 to-violet-600/80 text-white shadow-lg shadow-blue-500/10" : "text-white/40 hover:bg-white/5 hover:text-white/70"}`}>
      {icon}
      {label}
    </div>
  );
}

function StatCard({ title, value, change, icon, purple = false }: { title: string; value: string; change: string; icon: React.ReactNode; purple?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-white/40">{title}</span>
        <span className={purple ? "text-violet-400" : "text-blue-400"}>{icon}</span>
      </div>
      <div className="mt-3 text-base font-bold">{value}</div>
      <div className="mt-1 text-[9px] text-green-400">{change}</div>
    </div>
  );
}

function RevenueChart() {
  return (
    <div className="relative h-[150px] w-full overflow-hidden">
      <div className="absolute inset-0 flex flex-col justify-between">
        {[1, 2, 3, 4].map((line) => <div key={line} className="border-t border-white/[0.05]" />)}
      </div>
      <svg viewBox="0 0 700 160" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="lineGradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 130 C35 120, 55 115, 80 105 S120 75, 150 92 S190 125, 220 82 S255 100, 285 65 S325 35, 350 65 S390 85, 415 52 S450 70, 480 42 S520 30, 545 47 S585 20, 610 32 S655 12, 700 5 L700 160 L0 160 Z" fill="url(#areaGradient)" />
        <path d="M0 130 C35 120, 55 115, 80 105 S120 75, 150 92 S190 125, 220 82 S255 100, 285 65 S325 35, 350 65 S390 85, 415 52 S450 70, 480 42 S520 30, 545 47 S585 20, 610 32 S655 12, 700 5" fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[9px] text-white/25">
        <span>Jan</span> <span>Fév</span> <span>Mar</span> <span>Avr</span> <span>Mai</span> <span>Juin</span> <span>Juil</span>
      </div>
    </div>
  );
}

function FeatureStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition hover:-translate-y-1 hover:border-violet-500/30 hover:bg-white/[0.035]">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/15 text-violet-400 transition group-hover:bg-violet-600/25">
        {icon}
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-2 text-sm text-white/45">{label}</div>
    </div>
  );
}