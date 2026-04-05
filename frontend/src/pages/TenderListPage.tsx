import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function TenderListPage() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTender, setNewTender] = useState({ title: '', description: '', tender_type: 'Коммерческая' as const });
  const { user, logout } = useAuth();

  useEffect(() => {
    loadTenders();
  }, []);

  const loadTenders = async () => {
    try {
      const data = await api.getTenders();
      setTenders(data);
    } catch (error) {
      console.error('Ошибка загрузки тендеров:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTender(newTender);
      setNewTender({ title: '', description: '', tender_type: 'Коммерческая' });
      setShowForm(false);
      loadTenders();
    } catch (error) {
      alert('Ошибка создания тендера');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить тендер?')) return;
    try {
      await api.deleteTender(id);
      loadTenders();
    } catch (error) {
      alert('Ошибка удаления');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-200 text-gray-800',
      planning: 'bg-yellow-200 text-yellow-800',
      active: 'bg-green-200 text-green-800',
      completed: 'bg-blue-200 text-blue-800',
      cancelled: 'bg-red-200 text-red-800',
    };
    const labels: Record<string, string> = {
      draft: 'Черновик',
      planning: 'Планирование',
      active: 'Активен',
      completed: 'Завершён',
      cancelled: 'Отменён',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || 'bg-gray-200'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Тендеры</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.full_name} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Список тендеров</h2>
          {user?.role !== 'VIEWER' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Новый тендер
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-white rounded-lg shadow">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название тендера"
                value={newTender.title}
                onChange={(e) => setNewTender({ ...newTender, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <textarea
                placeholder="Описание"
                value={newTender.description}
                onChange={(e) => setNewTender({ ...newTender, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
              <select
                value={newTender.tender_type}
                onChange={(e) => setNewTender({ ...newTender, tender_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Коммерческая">Коммерческая</option>
                <option value="44-ФЗ">44-ФЗ</option>
                <option value="223-ФЗ">223-ФЗ</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Отмена
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tenders List */}
        <div className="grid gap-4">
          {tenders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Нет тендеров</div>
          ) : (
            tenders.map((tender) => (
              <div key={tender.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{tender.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{tender.description}</p>
                    <div className="flex gap-2 mt-2">
                      {getStatusBadge(tender.status)}
                      <span className="text-xs text-gray-500">{tender.tender_type}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user?.role === 'ORG_ADMIN' && (
                      <button
                        onClick={() => handleDelete(tender.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
