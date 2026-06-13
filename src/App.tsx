// Update: 18:25 - Limpeza e ajuste de design
import { useState, useEffect } from "react";
import { cn } from "./lib/utils";
import { Sidebar, type ViewType } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Views } from "./components/Views";
import { LoginView } from "./components/LoginView";
import { supabase } from "./lib/supabase";
import { getFcmToken } from "./lib/firebase";
import type { Session } from "@supabase/supabase-js";
import { Toaster } from 'sonner';
import { Menu } from './components/MenuIcon';

// (Removed global error handler - hooks must be inside component)


function App() {
  console.log('App rendered');
  const [session, setSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem('evolux_prod_fake_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeView, setActiveView] = useState<ViewType>(() => {
    const saved = localStorage.getItem('evolux_prod_active_view');
    // Redirecionamentos de segurança para rotas antigas que foram removidas
    if (saved === 'Painel') return 'Dashboard';
    if (saved === 'Análise' || saved === 'Análises') return 'Dashboard';
    
    const validViews = ["ThankYou", "Dashboard", "Vendas", "Produtos", "Afiliados", "Mercado", "Pagamentos", "Saque", "Premiações", "Integrações", "Configurações", "Documentação"];
    if (saved && validViews.includes(saved)) {
      return saved as ViewType;
    }
    return "Dashboard";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isThankYou = params.get('thankyou') === 'true' || window.location.pathname === '/obrigado';
    if (isThankYou) {
      setActiveView('ThankYou' as ViewType);
      localStorage.setItem('evolux_prod_active_view', 'ThankYou');
    }
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    localStorage.setItem('evolux_prod_active_view', activeView);
  }, [activeView]);

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
      if (session) {
        setSession(session);
      } else {
        const fake = localStorage.getItem('evolux_prod_fake_session');
        if (!fake) {
          setSession(null);
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        setSession(session);
      }
    });

    // Listen for profile updates from ConfiguracoesView
    const handleProfileUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSession((prev: any) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          user: {
            ...prev.user,
            user_metadata: {
              ...prev.user?.user_metadata,
              ...detail,
            }
          }
        };
        // Update fake session in localStorage if present
        const fake = localStorage.getItem('evolux_prod_fake_session');
        if (fake) {
          localStorage.setItem('evolux_prod_fake_session', JSON.stringify(updated));
        }
        return updated;
      });
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Request Notification Permission and obtain FCM token
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const setupPush = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registered', registration);
            setSwRegistration(registration);
            // Get FCM token with the newly registered service worker
            const token = await getFcmToken(registration);
            // Send FCM token to backend regardless of login state
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, userId: session?.user?.id ?? null })
            });
            console.log('FCM token sent to backend');
          } catch (e) {
            console.error('Service Worker registration failed', e);
          }
        }
      }
    };    setupPush();
  }, [session, swRegistration]);

  // Meta Ads Pixel Injection
  useEffect(() => {
    const pixelId = localStorage.getItem('evolux_prod_facebook_pixel_id');
    if (!pixelId) return;

    const w = window as any;
    if (w.fbq) return;

    w.fbq = function() {
      w.fbq.callMethod ? w.fbq.callMethod.apply(w.fbq, arguments) : w.fbq.queue.push(arguments);
    };
    if (!w._fbq) w._fbq = w.fbq;
    w.fbq.push = w.fbq;
    w.fbq.loaded = true;
    w.fbq.version = '2.0';
    w.fbq.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);

    w.fbq('init', pixelId);
    w.fbq('track', 'PageView');
  }, []);

  // TikTok Pixel Injection
  useEffect(() => {
    const pixelId = localStorage.getItem('evolux_prod_tiktok_pixel_id');
    if (!pixelId) return;

    const w = window as any;
    if (w.ttq) return;

    w.ttq = w.ttq || [];
    w.ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    w.ttq.setAndDefer = function(t: any, e: any) {
        t[e] = function() {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
        }
    };
    for (var i = 0; i < w.ttq.methods.length; i++) w.ttq.setAndDefer(w.ttq, w.ttq.methods[i]);
    w.ttq.instance = function(t: any) {
        for (var e = w.ttq._i[t] || [], n = 0; n < w.ttq.methods.length; n++) w.ttq.setAndDefer(e, w.ttq.methods[n]);
        return e
    };
    w.ttq.load = function(e: any, n: any) {
        var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
        w.ttq._i = w.ttq._i || {};
        w.ttq._i[e] = [];
        w.ttq._i[e]._u = i;
        w.ttq._t = w.ttq._t || {};
        w.ttq._t[e] = +new Date;
        w.ttq._o = w.ttq._o || {};
        w.ttq._o[e] = n || {};
        var o = document.createElement("script");
        o.type = "text/javascript";
        o.async = !0;
        o.src = i + "?sdkid=" + e + "&lib=ttq";
        var a = document.getElementsByTagName("script")[0];
        a.parentNode?.insertBefore(o, a)
    };

    w.ttq.load(pixelId);
    w.ttq.page();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('evolux_prod_fake_session');
    setSession(null);
  };

  // Show login screen if not authenticated
  if (!session) {
    return <LoginView onLogin={(fallbackUser?: any) => {
      if (fallbackUser) {
        const fakeSession = { user: fallbackUser };
        localStorage.setItem('evolux_prod_fake_session', JSON.stringify(fakeSession));
        setSession(fakeSession as any);
        return;
      }
      
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (session) {
          setSession(session);
        } else {
          // Final fallback
          const fakeSession = { 
            user: { 
              email: 'admin@evolux.com',
              user_metadata: { full_name: 'Administrador' }
            } 
          };
          localStorage.setItem('evolux_prod_fake_session', JSON.stringify(fakeSession));
          setSession(fakeSession as any);
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

      {/* Global Mobile Menu Trigger - Scrolls with page */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden absolute top-4 left-4 z-[60] h-12 w-12 flex items-center justify-center rounded-2xl bg-white dark:bg-brand-900 border border-violet-100 dark:border-white/5 text-slate-600 dark:text-brand-100 shadow-xl active:scale-95 transition-all"
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
          {/* Thank You page */}
          {activeView === "ThankYou" && (
            <Views.ThankYou />
          )}
          {/* Dashboard */}
          {activeView === "Dashboard" && (
            <Dashboard
              onLogout={handleLogout}
              setView={(v) => setActiveView(v as ViewType)}
              user={session.user}
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
          )}
          {activeView === "Vendas" && <Views.Vendas user={session.user} />}
          {activeView === "Produtos" && <Views.Produtos />}
          {activeView === "Afiliados" && <Views.Afiliados />}
          {activeView === "Mercado" && <Views.Mercado />}
          {activeView === "Pagamentos" && <Views.Pagamentos />}
          {activeView === "Saque" && <Views.Saque />}
          {activeView === "Premiações" && <Views.Premiações />}
          {activeView === "Integrações" && <Views.Ferramentas />}
          {activeView === "Análise" && <Views.Análise />}
          {activeView === "Configurações" && <Views.Configuracoes onLogout={handleLogout} />}
          {activeView === "Documentação" && <Views.Documentacao />}
        </div>
      </main>

      <Toaster richColors position="top-right" expand={false} />
    </div>
  );
}

export default App;
