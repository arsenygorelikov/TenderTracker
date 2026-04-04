import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Placeholder components - будут реализованы в следующих итерациях
function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Вход в систему</h1>
        <p className="text-gray-600 text-center">Страница входа будет реализована в следующей итерации</p>
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            Для тестирования API используйте:<br/>
            POST /api/v1/auth/register - регистрация<br/>
            POST /api/v1/auth/login - вход
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Tender Management</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-gray-600">{user?.email} ({user?.role})</span>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Добро пожаловать!</h2>
            <p className="text-gray-600 mb-4">
              Система управления тендерами успешно запущена.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="border rounded p-4">
                <h3 className="font-bold mb-2">Backend API</h3>
                <p className="text-sm text-gray-600">
                  Документация доступна по адресу:<br/>
                  <a href="http://localhost:8000/docs" className="text-blue-500 hover:underline" target="_blank">
                    http://localhost:8000/docs
                  </a>
                </p>
              </div>
              <div className="border rounded p-4">
                <h3 className="font-bold mb-2">Ваша организация</h3>
                <p className="text-sm text-gray-600">
                  ID: {user?.tenant_id}<br/>
                  Роль: {user?.role}
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-bold mb-2">Следующие шаги:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Реализация UI страницы входа</li>
                <li>Создание списка тендеров</li>
                <li>Форма создания/редактирования тендера</li>
                <li>Просмотр событий и комментариев</li>
                <li>WebSocket уведомления</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
