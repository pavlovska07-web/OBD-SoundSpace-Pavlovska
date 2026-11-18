import React, { useEffect, useState } from 'react';
import { Guitar, LogOut, LayoutDashboard, Home, MapPin, Phone, Clock, Mail } from 'lucide-react';
import { User, BookingPrefill } from './types';
import { LandingPage } from './components/LandingPage';
import { ContactsPage } from './components/ContactsPage';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'contacts' | 'dashboard'>('landing');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [bookingPrefill, setBookingPrefill] = useState<BookingPrefill | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const navigateTo = (nextView: 'landing' | 'contacts' | 'dashboard') => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (token: string, loggedUser: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    setAuthModalMode(null);
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setBookingPrefill(null);
    navigateTo('landing');
  };

  const handleSelectBookingFromLanding = (prefill: BookingPrefill) => {
    setBookingPrefill(prefill);
    if (user) {
      navigateTo('dashboard');
    } else {
      setAuthModalMode('login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100 selection:bg-pink-500/30 selection:text-pink-200">
      {/* НАПІВПРОЗОРА НАВІГАЦІЙНА ПАНЕЛЬ */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0a1e]/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          {/* Ліва частина: Лого + Навігація по сторінках */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigateTo('landing')}
              className="flex items-center gap-3 text-left group shrink-0"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 shadow-lg shadow-purple-500/25 transition-transform duration-300 group-hover:scale-105">
                <Guitar className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Sound<span className="neon-text">Space</span>
              </span>
            </button>

            <nav className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => navigateTo('landing')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  view === 'landing'
                    ? 'bg-white/12 text-white border border-white/15'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Home className="h-3.5 w-3.5 text-pink-400" />
                <span className="hidden xs:inline sm:inline">Головна</span>
              </button>

              <button
                onClick={() => navigateTo('contacts')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  view === 'contacts'
                    ? 'bg-white/12 text-white border border-white/15'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>Контакти та локації</span>
              </button>
            </nav>
          </div>

          {/* Права частина: Авторизація / Кабінет */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                {view !== 'dashboard' && (
                  <button
                    onClick={() => navigateTo('dashboard')}
                    className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                  >
                    <LayoutDashboard className="h-4 w-4 text-pink-400" />
                    <span className="hidden sm:inline">Мій кабінет</span>
                  </button>
                )}

                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-white">{user.full_name}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-pink-400">
                    {user.role === 'admin' ? 'Адміністратор' : 'Музикант'}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Вийти з акаунту"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-300 hover:bg-rose-500/20 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthModalMode('login')}
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white transition"
                >
                  Увійти
                </button>
                <button
                  onClick={() => setAuthModalMode('register')}
                  className="neon-gradient-btn rounded-xl px-4 sm:px-5 py-2.5 text-xs font-bold text-white shadow-lg"
                >
                  Реєстрація
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <main className="flex-1">
        {view === 'contacts' ? (
          <ContactsPage onGoToRooms={() => navigateTo('landing')} />
        ) : view === 'dashboard' && user ? (
          user.role === 'admin' ? (
            <AdminDashboard user={user} />
          ) : (
            <UserDashboard user={user} prefill={bookingPrefill} />
          )
        ) : (
          <LandingPage
            user={user}
            onOpenAuth={(mode) => setAuthModalMode(mode)}
            onGoToDashboard={() => navigateTo('dashboard')}
            onSelectBooking={handleSelectBookingFromLanding}
          />
        )}
      </main>

      {/* МІНІ-ФУТЕР */}
      <footer className="border-t border-white/10 bg-[#080614]/65 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Логотип і короткий слоган */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400">
                <Guitar className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-white">
                  Sound<span className="neon-text">Space</span> Studio
                </div>
                <div className="text-[11px] text-slate-400">
                  Музичний репетиційний комплекс нового покоління
                </div>
              </div>
            </div>

            {/* Швидкі посилання */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-300">
              <button
                onClick={() => navigateTo('landing')}
                className="hover:text-white transition"
              >
                Головна
              </button>
              <button
                onClick={() => navigateTo('contacts')}
                className="hover:text-cyan-300 transition"
              >
                Контакти та локації
              </button>
              {user ? (
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="hover:text-pink-300 transition"
                >
                  {user.role === 'admin' ? 'Адмін-панель' : 'Кабінет музиканта'}
                </button>
              ) : (
                <button
                  onClick={() => setAuthModalMode('register')}
                  className="hover:text-pink-300 transition"
                >
                  Забронювати зал
                </button>
              )}
            </div>

            {/* Контактна інформація */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-400" /> 09:00 – 22:00
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-pink-400" /> +380 (67) 555-35-35
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-purple-400" /> booking@soundspace.ua
              </span>
            </div>
          </div>

          <div className="mt-5 border-t border-white/5 pt-4 text-center text-[11px] text-slate-500">
            © 2026 SoundSpace Studio. Система автоматизації репетиційної бази • Усі права захищено.
          </div>
        </div>
      </footer>

      {/* МОДАЛЬНЕ ВІКНО АВТОРИЗАЦІЇ */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

export default App;