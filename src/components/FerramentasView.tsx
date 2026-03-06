
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Link as LinkIcon,
    Send, Database, ShieldCheck,
    Info, Save,
    Settings2, Code2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export const FerramentasView = () => {
    // Utmify state
    const [utmifyToken, setUtmifyToken] = useState(() => localStorage.getItem('evolux_prod_utmify_token') || '');

    // Webhook state
    const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('evolux_prod_webhook_url') || '');
    const [webhookEvents, setWebhookEvents] = useState({
        sale_approved: true,
        sale_pending: false,
        sale_refunded: false,
        affiliate_request: true
    });

    const handleSaveUtmify = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('evolux_prod_utmify_token', utmifyToken);
        toast.success('Token Utmify salvo!', {
            description: 'A integração com Utmify está agora ativa no seu checkout.'
        });
    };

    const handleSaveWebhook = (e: React.FormEvent) => {
        e.preventDefault();
        if (webhookUrl && !webhookUrl.startsWith('http')) {
            toast.error('URL do Webhook inválida');
            return;
        }
        localStorage.setItem('evolux_prod_webhook_url', webhookUrl);
        toast.success('Webhook configurado!', {
            description: 'Os eventos selecionados serão enviados para a URL informada.'
        });
    };

    const handleTestWebhook = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'A enviar teste...',
                success: 'Teste enviado com sucesso (200 OK)!',
                error: 'Erro ao enviar teste.',
            }
        );
    };

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 w-full max-w-none mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-violet-950 dark:text-white tracking-tight leading-none mb-2">Ferramentas e Integrações</h2>
                    <p className="text-xs text-slate-400 dark:text-brand-400 font-medium italic">
                        Conecte a Evolux Prod com serviços externos para automatizar o seu negócio.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Utmify Integration */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 md:p-6 bg-white dark:bg-brand-900 rounded-[2rem] border border-violet-100 dark:border-brand-800 shadow-sm space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                <Database size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Utmify</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rastreamento de Leads</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
                            Oficial
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-brand-950 border border-slate-100 dark:border-brand-800">
                        <div className="flex gap-2">
                            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] leading-snug text-slate-500 font-medium italic">
                                A melhor ferramenta para rastrear a origem das tuas vendas. Insira o seu Token abaixo.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveUtmify} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Token de Integração</label>
                            <div className="relative">
                                <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="utm_pk_..."
                                    value={utmifyToken}
                                    onChange={(e) => setUtmifyToken(e.target.value)}
                                    className="w-full h-11 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-brand-950 border border-slate-100 dark:border-brand-800 text-xs font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full h-11 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
                        >
                            <Save size={16} />
                            Salvar Configuração
                        </button>
                    </form>
                </motion.div>

                {/* Webhook Integration */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 md:p-6 bg-white dark:bg-brand-900 rounded-[2rem] border border-violet-100 dark:border-brand-800 shadow-sm space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                <Send size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Webhooks</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Notificações Externas</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-brand-950 border border-slate-100 dark:border-brand-800">
                        <div className="flex gap-2">
                            <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] leading-snug text-slate-500 font-medium italic">
                                Enviaremos os dados das tuas vendas para a tua URL de destino automaticamente.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveWebhook} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">URL de Destino</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="url"
                                    placeholder="https://tua-api.com/webhook"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    className="w-full h-11 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-brand-950 border border-slate-100 dark:border-brand-800 text-xs font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Eventos para Disparar</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(webhookEvents).map(([event, active]) => (
                                    <button
                                        key={event}
                                        type="button"
                                        onClick={() => setWebhookEvents(prev => ({ ...prev, [event]: !active }))}
                                        className={cn(
                                            "p-2.5 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all text-left flex items-center justify-between",
                                            active
                                                ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
                                                : "bg-white dark:bg-brand-900 border-slate-100 dark:border-brand-800 text-slate-400"
                                        )}
                                    >
                                        {event.replace('_', ' ')}
                                        {active && <ShieldCheck size={12} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={handleTestWebhook}
                                className="flex-1 h-11 rounded-xl border border-slate-100 dark:border-brand-800 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors"
                            >
                                Testar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 h-11 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
                            >
                                <Save size={16} />
                                Salvar
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* Coming Soon Area */}
            <div className="pt-6 border-t border-slate-100 dark:border-brand-800">
                <div className="flex items-center gap-2 mb-4">
                    <Settings2 size={20} className="text-violet-600" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Próximas Ferramentas</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { name: 'Google Ads', desc: 'Conversões via API.', color: 'text-blue-500' },
                        { name: 'WhatsApp', desc: 'Recuperação automática.', color: 'text-green-500' },
                        { name: 'Email', desc: 'Integração Klaviyo.', color: 'text-violet-500' }
                    ].map((tool, i) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-brand-900/50 rounded-2xl border border-slate-100 dark:border-brand-800 opacity-60">
                            <h4 className={cn("font-black text-[9px] uppercase tracking-widest mb-1.5", tool.color)}>{tool.name}</h4>
                            <p className="text-[10px] font-medium text-slate-400 leading-tight">{tool.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
