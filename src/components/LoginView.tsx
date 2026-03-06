import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Zap, TrendingUp, Users, ShieldCheck, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

interface LoginViewProps {
    onLogin: () => void;
}

const stats = [
    { label: "Vendas hoje", value: "1.543", icon: TrendingUp, color: "text-violet-400" },
    { label: "Clientes ativos", value: "321", icon: Users, color: "text-pink-400" },
    { label: "Conversão", value: "20,8%", icon: Zap, color: "text-amber-400" },
];

export const LoginView = ({ onLogin }: LoginViewProps) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                        emailRedirectTo: window.location.origin,
                    },
                });

                if (signUpError) throw signUpError;

                // If session is returned, it means email confirmation is disabled
                if (data.session) {
                    onLogin();
                } else {
                    // If no session but no error, tell the user account is ready
                    alert("Conta criada com sucesso! Você já pode entrar.");
                    setIsSignUp(false);
                }
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;
                onLogin();
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.message || "Ocorreu um erro na autenticação.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex font-sans">

            {/* ── LEFT PANEL: Form ── */}
            <div className="relative flex flex-col justify-center items-center w-full lg:w-[46%] bg-[#0d0d17] px-6 md:px-12 py-10 md:py-16 overflow-hidden">

                {/* Ambient glow blobs */}
                <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-violet-600/20 blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-pink-600/15 blur-[120px]" />

                <div className="relative z-10 w-full max-w-sm">

                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8 md:mb-12">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl overflow-hidden shadow-lg shadow-violet-500/30">
                            <img
                                src="/logo.png"
                                alt="Evolux"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                        "https://ui-avatars.com/api/?name=E&background=7c3aed&color=fff&bold=true&size=128";
                                }}
                            />
                        </div>
                        <div>
                            <p className="text-white font-black text-xl md:text-2xl leading-none tracking-tight">
                                Evolux <span className="text-violet-400">Prod</span>
                            </p>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="mb-8">
                        <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-2 md:mb-3">
                            {isSignUp ? "Criar minha" : "Entrar na"}<br />
                            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                                {isSignUp ? "conta gratuita" : "minha conta"}
                            </span>
                        </h1>
                        <p className="text-xs md:text-sm text-slate-400 font-medium tracking-tight">
                            {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError(null);
                                }}
                                className="text-violet-400 font-bold hover:text-violet-300 transition-colors"
                            >
                                {isSignUp ? "Fazer Login" : "Registar-se"}
                            </button>
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-400">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 group">
                            {/* Google SVG */}
                            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200">
                            {/* Apple SVG */}
                            <svg className="h-4 w-4 shrink-0 fill-white" viewBox="0 0 24 24">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                            </svg>
                            Apple
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">ou</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="João Pedro"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:bg-white/8 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:bg-white/8 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Senha</label>
                                {!isSignUp && (
                                    <a href="#" className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors">
                                        Esqueceu a senha?
                                    </a>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:bg-white/8 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    <span>{isSignUp ? "Criando..." : "Entrando..."}</span>
                                </>
                            ) : (
                                <>
                                    <span>{isSignUp ? "Criar conta" : "Entrar"}</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                            {/* shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-600 font-medium">
                        Ao entrar, você concorda com os{" "}
                        <a href="#" className="text-slate-500 underline hover:text-slate-300 transition-colors">
                            Termos de Uso
                        </a>{" "}
                        e{" "}
                        <a href="#" className="text-slate-500 underline hover:text-slate-300 transition-colors">
                            Política de Privacidade
                        </a>
                    </p>
                </div>
            </div>

            {/* ── RIGHT PANEL: Visual ── */}
            <div className="hidden lg:flex flex-col justify-between w-[54%] relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-900 to-[#0d0d17] p-14">

                {/* Background decorations */}
                <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-pink-500/10 blur-[100px]" />

                {/* Grid pattern */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                        backgroundSize: "40px 40px",
                    }}
                />

                {/* Top badge */}
                <div className="relative z-10 flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        <ShieldCheck size={14} className="text-green-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Plataforma segura</span>
                    </div>
                </div>

                {/* Center content */}
                <div className="relative z-10 flex flex-col gap-8">
                    <div>
                        <h2 className="text-5xl font-black text-white leading-[1.1] mb-4">
                            Venda Mais,<br />
                            <span className="bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">
                                Gerencie Melhor.
                            </span>
                        </h2>
                        <p className="text-base text-slate-400 font-medium leading-relaxed max-w-md">
                            Gerencie suas vendas, produtos e clientes num só lugar.
                            Tenha o controlo total do seu negócio com a Evolux Prod.
                        </p>
                    </div>

                    {/* Dashboard preview card */}
                    <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-2xl">
                        {/* Fake titlebar */}
                        <div className="flex items-center gap-2 mb-5">
                            <div className="h-3 w-3 rounded-full bg-red-500/80" />
                            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                            <div className="h-3 w-3 rounded-full bg-green-500/80" />
                            <div className="flex-1 mx-3 h-5 rounded-md bg-white/5" />
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4 mb-5">
                            {stats.map((s) => (
                                <div key={s.label} className="rounded-xl bg-white/5 border border-white/5 p-3">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <s.icon size={12} className={s.color} />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                                    </div>
                                    <motion.p
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.8 + (stats.indexOf(s) * 0.1) }}
                                        className="text-lg font-black text-white"
                                    >
                                        {s.value}
                                    </motion.p>
                                </div>
                            ))}
                        </div>

                        {/* Fake chart bars */}
                        <div className="flex items-end gap-2 h-20 px-1">
                            {[40, 65, 50, 80, 60, 90, 70, 85, 55, 95, 75, 88].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                    <motion.span
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1 + (i * 0.05) }}
                                        className="text-[7px] font-black text-slate-500"
                                    >
                                        {h}%
                                    </motion.span>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h * 0.7}%` }}
                                        transition={{ delay: 0.5 + (i * 0.05), duration: 1, ease: "easeOut" }}
                                        className="w-full rounded-t-md"
                                        style={{
                                            background: i === 10
                                                ? "linear-gradient(to top, #7c3aed, #a855f7)"
                                                : "rgba(255,255,255,0.08)",
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom trust badges */}
                <div className="relative z-10 flex items-center gap-6">
                    {[
                        { label: "+2.500 criadores", emoji: "🚀" },
                        { label: "M-Pesa integrado", emoji: "💳" },
                        { label: "e-Mola suportado", emoji: "✅" },
                    ].map((b) => (
                        <div key={b.label} className="flex items-center gap-2 text-sm font-bold text-slate-400">
                            <span>{b.emoji}</span>
                            <span>{b.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
