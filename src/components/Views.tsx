import { VendasView } from './VendasView';
import { ProdutosView } from './ProdutosView';
import { AfiliadosView } from './AfiliadosView';
import { MercadoView } from './MercadoView';
import { PagamentosView } from './PagamentosView';
import { SaqueView } from './SaqueView';
import { PremiacoesView } from './PremiacoesView';
import { FerramentasView } from './FerramentasView';
import { AnalyticsView } from './AnalyticsView';
import { ConfiguracoesView } from './ConfiguracoesView';
import type { User } from '@supabase/supabase-js';

export const Views = {
    Vendas: ({ user }: { user: User }) => <VendasView user={user} />,
    Produtos: () => <ProdutosView />,
    Afiliados: () => <AfiliadosView />,
    Mercado: () => <MercadoView />,
    Pagamentos: () => <PagamentosView />,
    Saque: () => <SaqueView />,
    Premiações: () => <PremiacoesView />,
    Ferramentas: () => <FerramentasView />,
    Analytics: () => <AnalyticsView />,
    Configuracoes: () => <ConfiguracoesView />,
};
