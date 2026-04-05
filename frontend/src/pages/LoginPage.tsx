import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ValidationErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setValidationErrors(prev => ({ ...prev, email: 'Email обязателен' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setValidationErrors(prev => ({ ...prev, email: 'Некорректный формат email' }));
      return false;
    }
    setValidationErrors(prev => ({ ...prev, email: undefined }));
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setValidationErrors(prev => ({ ...prev, password: 'Пароль обязателен' }));
      return false;
    }
    if (password.length < 6) {
      setValidationErrors(prev => ({ ...prev, password: 'Пароль должен содержать минимум 6 символов' }));
      return false;
    }
    setValidationErrors(prev => ({ ...prev, password: undefined }));
    return true;
  };

  const handleEmailBlur = () => {
    if (email) validateEmail(email);
  };

  const handlePasswordBlur = () => {
    if (password) validatePassword(password);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Анимированные фоновые элементы */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className={`relative max-w-md w-full transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
        {/* Карточка входа */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Логотип и заголовок */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Вход в систему
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              B2B Tender Management System
            </p>
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fade-in">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Форма входа */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Поле Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`h-5 w-5 ${validationErrors.email ? 'text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    validationErrors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm`}
                  placeholder="you@example.com"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-2 text-sm text-red-600 animate-fade-in">{validationErrors.email}</p>
              )}
            </div>

            {/* Поле Пароль */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`h-5 w-5 ${validationErrors.password ? 'text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm`}
                  placeholder="••••••••"
                />
              </div>
              {validationErrors.password && (
                <p className="mt-2 text-sm text-red-600 animate-fade-in">{validationErrors.password}</p>
              )}
            </div>

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Вход...
                </div>
              ) : (
                'Войти'
              )}
            </button>
          </form>

          {/* Ссылка на регистрацию */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>

          {/* Тестовые пользователи */}
          <div className="mt-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-gray-800 text-sm">Тестовые пользователи:</p>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">admin@example.com</span>
                <span className="mx-2 text-gray-400">/</span>
                <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">admin123</span>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">Админ</span>
              </li>
              <li className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">manager@example.com</span>
                <span className="mx-2 text-gray-400">/</span>
                <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">manager123</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">Менеджер</span>
              </li>
              <li className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">viewer@example.com</span>
                <span className="mx-2 text-gray-400">/</span>
                <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">viewer123</span>
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">Наблюдатель</span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>© 2024 B2B Tender System. Все права защищены.</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 50px) scale(1.05); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
