import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import TenderListPage from './pages/TenderListPage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <TenderListPage />;
}

export default App;
