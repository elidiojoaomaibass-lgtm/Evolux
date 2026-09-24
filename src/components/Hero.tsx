import { ArrowRight, Play } from "lucide-react";

export const Hero = () => {
    return (
        <div className="relative overflow-hidden bg-zinc-900 py-24 sm:py-32">
            {/* Background patterns */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary-500 blur-[120px]" />
                <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-500 blur-[100px]" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                    <div className="flex flex-col items-start gap-8">
                        <div className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-sm font-medium text-primary-400">
                            <span className="mr-2 rounded-full bg-primary-500/20 px-2 py-0.5 text-xs text-primary-500">Novo</span>
                            Descubra artesãos e criadores moçambicanos
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
                            O Mercado Digital de <span className="text-primary-500">Moçambique</span>
                        </h1>
                        <p className="max-w-[600px] text-lg text-zinc-400">
                            O VELORA Prod é a plataforma líder para comprar e vender ativos digitais,
                            artesanato local, eletrónicos e serviços profissionais de todo o país.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="flex items-center gap-2 rounded-full bg-primary-500 px-8 py-4 font-bold text-white transition-all hover:bg-primary-600 hover:scale-105 shadow-lg shadow-primary-500/25">
                                Começar a Comprar <ArrowRight className="h-5 w-5" />
                            </button>
                            <button className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/50 px-8 py-4 font-bold text-white transition-all hover:bg-zinc-800 hover:border-zinc-500">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-900">
                                    <Play className="h-3 w-3 fill-current ml-0.5" />
                                </div>
                                Ver Como Funciona
                            </button>
                        </div>
                    </div>
                    <div className="relative hidden lg:block">
                        <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-800/50 p-4">
                            {/* Mockup of the app grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="aspect-square rounded-xl bg-zinc-700/50 animate-pulse" />
                                ))}
                            </div>
                        </div>
                        {/* Success badge float */}
                        <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-2xl">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">✓</div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-900 leading-tight">Venda Processada</div>
                                    <div className="text-xs text-zinc-500 leading-none">Agora mesmo para Maputo</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
