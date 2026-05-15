import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Bell, Shield, Save, Loader2, Camera, Eye, EyeOff, LogOut, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export const ConfiguracoesView = ({ onLogout }: { onLogout: () => void }) => {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'payments'>('profile');

    // E2Payments settings states
    const [e2ClientId, setE2ClientId] = useState('');
    const [e2ClientSecret, setE2ClientSecret] = useState('');
    const [e2WalletMpesa, setE2WalletMpesa] = useState('');
    const [e2WalletEmola, setE2WalletEmola] = useState('');

    // Form states
    const [fullName, setFullName] = useState('');
    const [nickname, setNickname] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Try real Supabase session first, fallback to fake localStorage session
        const loadUser = async () => {
            const { data: { user: realUser } } = await supabase.auth.getUser() as any;
            if (realUser) {
                setUser(realUser);
                const m = realUser.user_metadata || {};
                if (m.full_name) setFullName(m.full_name);
                if (m.nickname) setNickname(m.nickname);
                if (m.phone_number) setPhoneNumber(m.phone_number);
                if (m.photo_url) setPhotoUrl(m.photo_url);
            } else {
                // Fake session fallback
                const fake = localStorage.getItem('evolux_prod_fake_session');
                if (fake) {
                    const fakeUser = JSON.parse(fake).user;
                    setUser(fakeUser);
                    const m = fakeUser?.user_metadata || {};
                    if (m.full_name) setFullName(m.full_name);
                    if (m.nickname) setNickname(m.nickname);
                    if (m.phone_number) setPhoneNumber(m.phone_number);
                    if (m.photo_url) setPhotoUrl(m.photo_url);
                }
            }
        };
        loadUser();

        // Load E2Payments settings from localStorage
        const savedClientId = localStorage.getItem('evolux_e2_client_id');
        const savedClientSecret = localStorage.getItem('evolux_e2_client_secret');
        const savedWalletMpesa = localStorage.getItem('evolux_e2_wallet_mpesa');
        const savedWalletEmola = localStorage.getItem('evolux_e2_wallet_emola');

        if (savedClientId) setE2ClientId(savedClientId);
        if (savedClientSecret) setE2ClientSecret(savedClientSecret);
        if (savedWalletMpesa) setE2WalletMpesa(savedWalletMpesa);
        if (savedWalletEmola) setE2WalletEmola(savedWalletEmola);
    }, []);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const url = ev.target?.result as string;
            setPhotoUrl(url);
            // Save photo locally and propagate
            const detail = { full_name: fullName, nickname, phone_number: phoneNumber, photo_url: url };
            const fake = localStorage.getItem('evolux_prod_fake_session');
            if (fake) {
                const parsed = JSON.parse(fake);
                parsed.user = { ...parsed.user, user_metadata: { ...parsed.user?.user_metadata, ...detail } };
                localStorage.setItem('evolux_prod_fake_session', JSON.stringify(parsed));
            }
            window.dispatchEvent(new CustomEvent('user-profile-updated', { detail }));
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Payment save logic (E2Payments)
        if (activeTab === 'payments') {
            const cleanId = e2ClientId.trim();
            const cleanSecret = e2ClientSecret.trim();
            const cleanMpesa = e2WalletMpesa.trim();
            const cleanEmola = e2WalletEmola.trim();

            localStorage.setItem('evolux_e2_client_id', cleanId);
            localStorage.setItem('evolux_e2_client_secret', cleanSecret);
            localStorage.setItem('evolux_e2_wallet_mpesa', cleanMpesa);
            localStorage.setItem('evolux_e2_wallet_emola', cleanEmola);
            
            // Update local state to show trimmed values
            setE2ClientId(cleanId);
            setE2ClientSecret(cleanSecret);
            setE2WalletMpesa(cleanMpesa);
            setE2WalletEmola(cleanEmola);

            setMessage({ type: 'success', text: 'Credenciais E2Payments salvas com sucesso!' });
            setLoading(false);
            return;
        }

        const metadata = { full_name: fullName, nickname, phone_number: phoneNumber, photo_url: photoUrl };

        // Check if we are using a fake session
        const fake = localStorage.getItem('evolux_prod_fake_session');
        
        if (fake) {
            // Update fake session in localStorage
            try {
                const parsed = JSON.parse(fake);
                parsed.user = { 
                    ...parsed.user, 
                    user_metadata: { 
                        ...parsed.user?.user_metadata, 
                        ...metadata 
                    } 
                };
                localStorage.setItem('evolux_prod_fake_session', JSON.stringify(parsed));
                
                // Dispatch event and show success
                window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: metadata }));
                setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            } catch (err) {
                setMessage({ type: 'error', text: 'Erro ao processar sessão local.' });
            } finally {
                setLoading(false);
            }
            return;
        }

        // Real Supabase update
        try {
            const { error } = await supabase.auth.updateUser({ data: metadata });
            if (error) throw error;
            
            window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: metadata }));
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Erro ao atualizar perfil.' });
        } finally {
            setLoading(false);
        }
    };


    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 8 caracteres.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            // In a real scenario with Supabase, you might want to re-authenticate 
            // the user with the currentPassword before updating.
            // For now, we update directly as it's the standard flow for logged-in sessions.
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Erro ao atualizar senha.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 md:px-6 pt-2 pb-20 space-y-3 md:space-y-4 w-full max-w-none mx-auto">
            <div>
                <h2 className="text-xl md:text-2xl font-black text-violet-950 dark:text-white tracking-tight">Configurações</h2>
                <p className="text-[10px] md:text-xs text-slate-400 dark:text-brand-400 font-medium">Gira as preferências da tua conta e segurança.</p>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl flex items-center gap-2 font-bold text-[10px] md:text-xs ${message.type === 'success'
                        ? 'bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/10 dark:border-green-900/20'
                        : 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/10 dark:border-red-900/20'
                        }`}
                >
                    {message.type === 'success' ? <Shield size={14} /> : <AlertCircle size={14} />}
                    <span className="flex-1">{message.text}</span>
                </motion.div>
            )}

            <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-3">
                {/* Navigation */}
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                    {[
                        { id: 'profile', label: 'Perfil', icon: User },
                        { id: 'payments', label: 'Pagamentos', icon: Wallet },
                        { id: 'security', label: 'Segurança', icon: Lock },
                        { id: 'notifications', label: 'Avisos', icon: Bell },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-lg font-bold text-[11px] md:text-xs transition-all whitespace-nowrap shrink-0 md:w-full ${activeTab === item.id
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                                : 'text-slate-500 hover:bg-violet-50 dark:text-brand-400 dark:hover:bg-brand-800'
                                }`}
                        >
                            <item.icon size={14} />
                            {item.label}
                        </button>
                    ))}

                    {/* Logout Button in Settings */}
                    <div className="mt-auto pt-2 border-t border-slate-100 dark:border-white/5 hidden md:block">
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-bold text-[11px] md:text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full text-left uppercase tracking-widest"
                        >
                            <LogOut size={14} />
                            Encerrar Sessão
                        </button>
                    </div>

                    {/* Mobile Logout Button */}
                    <button
                        onClick={onLogout}
                        className="flex md:hidden items-center gap-2 px-3 py-2 rounded-lg font-bold text-[11px] text-red-500 hover:bg-red-50 whitespace-nowrap shrink-0"
                    >
                        <LogOut size={14} />
                    </button>
                </div>

                {/* Forms Area */}
                <div className="md:col-span-2">
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-brand-900 rounded-2xl border border-violet-100 dark:border-brand-800 p-4 md:p-6 shadow-sm"
                            >
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="relative group shrink-0">
                                        <div className="h-14 w-14 rounded-2xl overflow-hidden ring-4 ring-violet-50 dark:ring-brand-800">
                                            {photoUrl ? (
                                                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-2xl">
                                                    {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-violet-600 border-2 border-white dark:border-brand-900 text-white flex items-center justify-center shadow-md hover:scale-110 transition-all"
                                        >
                                            <Camera size={12} />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white truncate">
                                            {fullName || user?.email?.split('@')[0] || 'Utilizador'}
                                        </h3>
                                        <p className="text-[10px] md:text-xs text-slate-400 font-medium truncate">{user?.email}</p>
                                        <p className="text-[9px] text-violet-400 font-medium mt-0.5">Clique na câmara para trocar a foto</p>
                                    </div>
                                </div>





                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="João Pedro"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-800 shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-white text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apelido (Username)</label>
                                        <input
                                            type="text"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            placeholder="@joao_pedro"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-800 shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-white text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Telefone</label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="+258 8X XXX XXXX"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-800 shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-white text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email da Conta</label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-100 dark:bg-brand-950/50 text-slate-400 cursor-not-allowed outline-none text-xs"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-violet-600 text-white px-6 py-2.5 rounded-xl font-black text-[11px] md:text-xs hover:bg-violet-700 transition-all shadow-md shadow-violet-500/20 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                        Salvar Mudanças
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-brand-900 rounded-2xl border border-violet-100 dark:border-brand-800 p-4 md:p-6 shadow-sm"
                            >
                                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Lock className="text-violet-500" size={16} />
                                    Alterar Senha
                                </h3>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 mb-5">
                                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 leading-relaxed italic">
                                        Dica de segurança: Recomendamos senhas com no mínimo 8 caracteres, incluindo números e símbolos para maior proteção.
                                    </p>
                                </div>

                                <form onSubmit={handleUpdatePassword} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual</label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-800 shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-white text-xs pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors"
                                            >
                                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-800 shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-white text-xs pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-800 shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-white text-xs pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-brand-900 text-white px-6 py-2.5 rounded-xl font-black text-[11px] md:text-xs hover:opacity-90 transition-all shadow-md shadow-black/10 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={14} /> : <Lock size={14} />}
                                        Atualizar Senha
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'payments' && (
                            <motion.div
                                key="payments"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-brand-900 rounded-2xl border border-violet-100 dark:border-brand-800 p-4 md:p-6 shadow-sm space-y-8"
                            >
                                {/* E2Payments Section */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                            <Shield className="text-emerald-500" size={20} />
                                            Integração E2Payments
                                        </h3>
                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest">Ativo</span>
                                    </div>
                                    
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                        Configure as suas credenciais da E2Payments. Você pode encontrar o <b>ID da Carteira</b> no menu <a href="https://mpesaemolatech.com/admin/mpesa" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline">Carteiras</a> do painel e2Payments.
                                    </p>

                                    <div className="grid gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client ID</label>
                                            <input
                                                type="text"
                                                value={e2ClientId}
                                                onChange={(e) => setE2ClientId(e.target.value)}
                                                placeholder="Introduza o Client ID"
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-800 shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-white text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Secret</label>
                                            <input
                                                type="password"
                                                value={e2ClientSecret}
                                                onChange={(e) => setE2ClientSecret(e.target.value)}
                                                placeholder="••••••••••••••••"
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-800 shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-white text-xs"
                                            />
                                        </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Carteira M-Pesa (Vodacom)</label>
                                            <input
                                                type="text"
                                                value={e2WalletMpesa}
                                                onChange={(e) => setE2WalletMpesa(e.target.value)}
                                                placeholder="Ex: 12345"
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-800 shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-white text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Carteira e-Mola (Movitel)</label>
                                            <input
                                                type="text"
                                                value={e2WalletEmola}
                                                onChange={(e) => setE2WalletEmola(e.target.value)}
                                                placeholder="Ex: 67890"
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-violet-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-800 shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-white text-xs"
                                            />
                                        </div>
                                    </div>
                                    </div>

                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                        <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 leading-relaxed">
                                            <b>Atenção:</b> Não insira o seu número de telefone. Use o <b>ID Numérico</b> disponível em <a href="https://mpesaemolatech.com/admin/mpesa" target="_blank" className="underline"> mpeseamolatech.com/admin/mpesa</a>.
                                        </p>
                                    </div>
                                </section>

                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={loading}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[11px] md:text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    Salvar Credenciais E2Payments
                                </button>
                            </motion.div>
                        )}

                        {activeTab === 'notifications' && (
                            <motion.div
                                key="notifications"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-brand-900 rounded-2xl border border-violet-100 dark:border-brand-800 p-6 space-y-6 shadow-sm"
                            >
                                <div className="text-center space-y-4">
                                    <div className="h-16 w-16 bg-violet-50 dark:bg-brand-800 rounded-full flex items-center justify-center mx-auto text-violet-600">
                                        <Bell size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Alertas do Sistema</h3>
                                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Você receberá notificações sobre novas vendas, saques e atualizações de segurança.</p>
                                    <button className="text-[10px] font-black text-violet-600 uppercase tracking-widest border border-violet-100 px-4 py-2 rounded-lg hover:bg-violet-50 transition-colors">Gerenciar Preferências</button>
                                </div>

                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 text-left max-h-96 overflow-y-auto custom-scrollbar">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-black text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Shield size={14} />
                                                TERMOS DA EVOLUX PROD
                                            </h4>
                                            <ul className="text-[10px] md:text-xs font-medium text-amber-700 dark:text-amber-400 space-y-2 list-none">
                                                <li>• A Evolux Prod é uma plataforma de venda de produtos digitais e físicos.</li>
                                                <li>• O usuário deve fornecer informações verdadeiras no cadastro.</li>
                                                <li>• Cada vendedor é responsável pelo produto que publica.</li>
                                                <li>• A plataforma atua apenas como intermediadora.</li>
                                                <li>• Não garantimos resultados prometidos por vendedores.</li>
                                                <li>• Contas podem ser suspensas em caso de violação das regras.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <AlertCircle size={14} />
                                                POLÍTICA DE USO
                                            </h4>
                                            <ul className="text-[10px] md:text-xs font-medium text-amber-700 dark:text-amber-400 space-y-2 list-none">
                                                <li>• É proibida a venda de conteúdos pornográficos.</li>
                                                <li>• É proibida qualquer prática de golpe ou fraude.</li>
                                                <li>• Não são permitidos esquemas de pirâmide ou lucro garantido.</li>
                                                <li>• Produtos ilegais são estritamente proibidos.</li>
                                                <li>• Conteúdos ofensivos ou discriminatórios não são permitidos.</li>
                                                <li>• A plataforma pode remover conteúdos que violem as regras.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const AlertCircle = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);
