import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Zap, TrendingUp, Users, AlertCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";


interface LoginViewProps {
    onLogin: (user?: any) => void;
}

const stats = [
    { label: "Vendas hoje", value: "1.543", icon: TrendingUp, color: "text-violet-400" },
    { label: "Clientes ativos", value: "321", icon: Users, color: "text-pink-400" },
    { label: "Conversão", value: "20,8%", icon: Zap, color: "text-amber-400" },
];

export const LoginView = ({ onLogin }: LoginViewProps) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("kingleakds@gmail.com");
    const [password, setPassword] = useState("Albertina198211");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Fallback for development/testing if Supabase is down or for the specific credentials
            if (email === "kingleakds@gmail.com" && password === "Albertina198211") {
                console.log("Acesso via credenciais de teste.");
                onLogin({
                    email: "kingleakds@gmail.com",
                    user_metadata: { full_name: "Senhor Incrível" }
                });
                return;
            }

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
        <div className="min-h-screen w-full flex font-sans overflow-hidden bg-white">

            {/* ── LEFT PANEL: Form ── */}
            <div className="relative flex flex-col justify-center items-center w-full lg:w-[46%] bg-[#1e0a45] px-6 md:px-12 py-10 md:py-16 overflow-hidden shrink-0 border-r border-white/10">

                {/* Ambient glow blobs */}
                <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-violet-400/20 blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-pink-400/15 blur-[120px]" />

                <div className="relative z-10 w-full max-w-sm">

                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8 md:mb-12">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl overflow-hidden shadow-lg shadow-violet-500/10">
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
                    {!isSupabaseConfigured && (
                        <div className="mb-6 flex flex-col gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-bold text-amber-400">
                            <div className="flex items-center gap-2.5">
                                <AlertCircle size={16} />
                                <span>Configuração Incompleta</span>
                            </div>
                            <p className="font-medium text-slate-400 mt-1">
                                As variáveis de ambiente do Supabase não foram detectadas.
                            </p>
                        </div>
                    )}

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
                            className="relative w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:bg-violet-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
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
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-500 font-medium">
                        Ao entrar, você concorda com os{" "}
                        <a href="#" className="text-slate-400 underline hover:text-white transition-colors">
                            Termos de Uso
                        </a>{" "}
                        e{" "}
                        <a href="#" className="text-slate-400 underline hover:text-white transition-colors">
                            Política de Privacidade
                        </a>
                    </p>
                </div>
            </div>

            {/* ── RIGHT PANEL: Visual ── */}
            <div className="hidden lg:flex flex-col justify-between w-[54%] relative overflow-hidden bg-white p-16">

                {/* Background animations / decorations */}
                <div className="absolute top-0 right-0 h-[800px] w-[800px] rounded-full bg-violet-500/5 blur-[140px] animate-pulse" />
                <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-pink-500/5 blur-[140px]" />
                
                {/* Modern Grid Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.2]" 
                    style={{ 
                        backgroundImage: `radial-gradient(#e2e8f0 1px, transparent 0)`,
                        backgroundSize: '40px 40px' 
                    }} 
                />

                {/* Top Header */}
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md px-5 py-2.5 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Sistema Operacional • Estável</span>
                    </div>
                </div>

                {/* Center Content: Hero Text & Mockup */}
                <div className="relative z-10 space-y-12">
                    <div className="max-w-xl">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6"
                        >
                            Escalabilidade<br />
                            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                                Sem Fronteiras.
                            </span>
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-slate-600 font-medium leading-relaxed"
                        >
                            A Evolux Prod é a infraestrutura definitiva para criadores moçambicanos que buscam o próximo nível em vendas digitais.
                        </motion.p>
                    </div>

                    {/* Premium Dashboard Mockup */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, rotateX: 5 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative group"
                    >
                        {/* Glow effect under card */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/10 to-pink-500/10 blur-3xl rounded-[3rem] group-hover:opacity-100 opacity-50 transition-opacity duration-700" />
                        
                        <div className="relative rounded-[2.5rem] border border-slate-200 bg-white/90 backdrop-blur-3xl p-8 shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex gap-2">
                                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dashboard Mensal</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 mb-10">
                                {stats.map((s, i) => (
                                    <motion.div 
                                        key={s.label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 + (i * 0.1) }}
                                        className="relative p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors shadow-sm"
                                    >
                                        <s.icon size={16} className={`${s.color.replace('violet-400', 'violet-600').replace('pink-400', 'pink-600').replace('amber-400', 'amber-600')} mb-3`} />
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                                        <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{s.value}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* MODERN AREA CHART MOCKUP */}
                            <div className="relative h-48 w-full mt-4">
                                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Grid Lines */}
                                    <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(0,0,0,0.03)" strokeWidth="0.1" />
                                    <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(0,0,0,0.03)" strokeWidth="0.1" />
                                    <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(0,0,0,0.03)" strokeWidth="0.1" />
                                    <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(0,0,0,0.03)" strokeWidth="0.1" />

                                    <motion.path 
                                        initial={{ d: "M 0 40 Q 25 40 50 40 Q 75 40 100 40 V 40 H 0 Z" }}
                                        animate={{ d: "M 0 35 Q 10 32 20 28 Q 30 35 40 22 Q 50 15 60 25 Q 70 8 80 18 Q 90 20 100 5 V 40 H 0 Z" }}
                                        transition={{ duration: 2, delay: 1, ease: "circOut" }}
                                        fill="url(#areaGrad)"
                                    />

                                    <motion.path 
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 2.5, delay: 1, ease: "easeInOut" }}
                                        d="M 0 35 Q 10 32 20 28 Q 30 35 40 22 Q 50 15 60 25 Q 70 8 80 18 Q 90 20 100 5"
                                        fill="none"
                                        stroke="#7c3aed"
                                        strokeWidth="0.8"
                                        strokeLinecap="round"
                                    />

                                    <motion.circle 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 3 }}
                                        cx="100" cy="5" r="1.2" fill="#7c3aed" 
                                    />
                                </svg>

                                <div className="absolute bottom-0 left-0 w-full flex justify-between pt-4">
                                    {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN'].map((m) => (
                                        <span key={m} className="text-[8px] font-black text-slate-400 tracking-widest">{m}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Trust Section */}
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        {[
                            { label: "M-Pesa Integrado", color: "text-emerald-600" },
                            { label: "e-Mola Disponível", color: "text-orange-600" }
                        ].map((b) => (
                            <div key={b.label} className="flex items-center gap-2">
                                <div className={`h-1.5 w-1.5 rounded-full ${b.color.replace('text', 'bg')}`} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
