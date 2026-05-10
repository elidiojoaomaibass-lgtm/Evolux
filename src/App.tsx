// Update: 18:25 - Limpeza e ajuste de design
import { useState, useEffect } from "react";
import { cn } from "./lib/utils";
import { Sidebar, type ViewType } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Views } from "./components/Views";
import { LoginView } from "./components/LoginView";
import { supabase } from "./lib/supabase";
import { Menu } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Toaster } from 'sonner';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("Dashboard");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Close sidebar on view change on mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [activeView]);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Show login screen if not authenticated
  if (!session) {
    return <LoginView onLogin={(fallbackUser?: any) => {
      if (fallbackUser) {
        setSession({ user: fallbackUser } as any);
        return;
      }
      
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (session) {
          setSession(session);
        } else {
          // Final fallback
          setSession({ 
            user: { 
              email: 'kingleakds@gmail.com',
              user_metadata: { full_name: 'Senhor Incrível' }
            } 
          } as any);
        }
      });
    }} />;
  }

  return (
    <div className="flex bg-[#faf9ff] dark:bg-[#0d0d17] min-h-screen font-sans transition-colors duration-500 overflow-x-hidden relative">
      {/* Premium Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-500/5 dark:bg-violet-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-fuchsia-500/5 dark:bg-fuchsia-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[130px] animate-pulse-slow" />
      </div>

      <Sidebar
        activeView={activeView}
        setView={setActiveView}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Global Mobile Menu Trigger - Fixed for all views */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[60] h-12 w-12 flex items-center justify-center rounded-2xl bg-white dark:bg-brand-900 border border-violet-100 dark:border-white/5 text-slate-600 dark:text-brand-100 shadow-xl active:scale-95 transition-all"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 min-w-0 min-h-screen transition-all duration-300 relative z-10",
        "lg:ml-64",
        sidebarOpen ? "ml-64 opacity-50 blur-sm pointer-events-none lg:opacity-100 lg:blur-0 lg:pointer-events-auto" : "ml-0"
      )}>
        <div key={activeView} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeView === "Dashboard" && (
            <Dashboard
              onLogout={handleLogout}
              setView={setActiveView}
              user={session.user}
            />
          )}
          {activeView === "Vendas" && <Views.Vendas user={session.user} />}
          {activeView === "Produtos" && <Views.Produtos />}
          {activeView === "Afiliados" && <Views.Afiliados />}
          {activeView === "Mercado" && <Views.Mercado />}
          {activeView === "Pagamentos" && <Views.Pagamentos />}
          {activeView === "Saque" && <Views.Saque />}
          {activeView === "Premiações" && <Views.Premiações />}
          {activeView === "Marketing" && <Views.Ferramentas />}
          {activeView === "Análise" && <Views.Análise />}
          {activeView === "Configurações" && <Views.Configuracoes />}
        </div>
      </main>

      <Toaster richColors position="top-right" expand={false} />
    </div>
  );
}

export default App;
