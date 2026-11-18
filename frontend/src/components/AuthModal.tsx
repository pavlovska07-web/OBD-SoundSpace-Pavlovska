import React, { useState } from 'react';
import { X, LogIn, UserPlus, Music2, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../api';
import { User } from '../types';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (token: string, user: User) => void;
}

const GENRES = [
  'Rock',
  'Pop',
  'Indie',
  'Metal',
  'Alternative',
  'Punk',
  'Jazz',
  'Funk',
  'Hip-Hop',
  'Electronic',
];

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'user' | 'admin'>('user');

  const [fullName, setFullName] = useState('');
  const [bandName, setBandName] = useState('');
  const [genre, setGenre] = useState('Rock');
  const [phone, setPhone] = useState('+380');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '');
    let subscriber = digitsOnly.startsWith('380') ? digitsOnly.slice(3) : digitsOnly;
    subscriber = subscriber.slice(0, 9);

    let formatted = '+380';
    if (subscriber.length > 0) formatted += ' ' + subscriber.slice(0, 2);
    if (subscriber.length > 2) formatted += ' ' + subscriber.slice(2, 5);
    if (subscriber.length > 5) formatted += ' ' + subscriber.slice(5, 7);
    if (subscriber.length > 7) formatted += ' ' + subscriber.slice(7, 9);

    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await apiFetch<{ token: string; user: User }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
            role,
            band_name: role === 'user' ? bandName : undefined,
            genre: role === 'user' ? genre : undefined,
            phone,
            admin_code: role === 'admin' ? adminCode : undefined,
          }),
        });
        onSuccess(res.token, res.user);
      } else {
        const res = await apiFetch<{ token: string; user: User }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            role,
            admin_code: role === 'admin' ? adminCode : undefined,
          }),
        });
        onSuccess(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Помилка авторизації');
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`glass-panel relative w-full ${
          isRegister ? 'max-w-2xl' : 'max-w-md'
        } rounded-3xl border border-white/15 p-5 sm:p-6 shadow-2xl transition-all duration-200`}
      >
        {/* Заголовок та кнопка закриття */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold neon-text">
              {isRegister ? 'Реєстрація в системі' : 'Вхід у SoundSpace'}
            </h2>
            <p className="text-xs text-slate-300/80 mt-0.5">
              {isRegister
                ? 'Створіть акаунт музиканта або адміністратора за 30 секунд'
                : 'Увійдіть для керування бронюваннями та розкладом'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/15 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Перемикачі режиму та ролі в компактному вигляді */}
        <div className={`grid gap-2.5 mb-4 ${isRegister ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
                mode === 'login'
                  ? 'neon-gradient-btn text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" /> Вхід
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
                mode === 'register'
                  ? 'neon-gradient-btn text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" /> Реєстрація
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setRole('user');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-xs font-semibold transition ${
                role === 'user'
                  ? 'border-pink-500/60 bg-pink-500/20 text-pink-200'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Music2 className="h-3.5 w-3.5 text-pink-400" /> Музикант / гурт
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-xs font-semibold transition ${
                role === 'admin'
                  ? 'border-cyan-500/60 bg-cyan-500/20 text-cyan-200'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Адміністратор
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* ФОРМА */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* ЛІВА КОЛОНКА РЕЄСТРАЦІЇ */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-200">
                    ПІБ контактної особи *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Павловська Олеся Олегівна"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:border-pink-400 focus:outline-none"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    2 або 3 слова, кожне з великої літери
                  </p>
                </div>

                {role === 'user' ? (
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <label className="mb-1 block text-xs font-medium text-slate-200">
                        Назва гурту *
                      </label>
                      <input
                        type="text"
                        required
                        value={bandName}
                        onChange={(e) => setBandName(e.target.value)}
                        placeholder="Neon Pulse"
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-pink-400 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-200">
                        Жанр *
                      </label>
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-[#12121f] px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      >
                        {GENRES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-cyan-300">
                      Код доступу адміністратора *
                    </label>
                    <input
                      type="password"
                      required
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      placeholder="Введіть секретний код студії"
                      className="w-full rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-200">
                    Номер телефону *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+380 XX XXX XX XX"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Вводьте 9 цифр після +380 (пробіли додаються самі)
                  </p>
                </div>
              </div>

              {/* ПРАВА КОЛОНКА РЕЄСТРАЦІЇ */}
              <div className="flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-200">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@soundspace.ua"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-200">
                      Пароль *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Мінімум 6 символів"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="neon-gradient-btn w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Реєстрація...' : 'Зареєструватися'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ФОРМА ВХОДУ */
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-200">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@soundspace.ua"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-pink-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-200">Пароль *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none"
                />
              </div>

              {role === 'admin' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-cyan-300">
                    Код доступу адміністратора *
                  </label>
                  <input
                    type="password"
                    required
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Введіть код адміністратора"
                    className="w-full rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="neon-gradient-btn w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 mt-1"
              >
                {loading ? 'Вхід...' : 'Увійти в акаунт'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};