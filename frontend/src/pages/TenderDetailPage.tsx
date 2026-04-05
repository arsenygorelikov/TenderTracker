import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface Tender {
  id: number;
  title: string;
  description?: string;
  tender_type: string;
  status: string;
  nmcc?: number;
  notification_number?: string;
  marketplace?: string;
  organization_id: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  stages?: any[];
}

interface Comment {
  id: number;
  content: string;
  user_email: string;
  user_full_name?: string;
  created_at: string;
}

const TenderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tender, setTender] = useState<Tender | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'audit'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Tender>>({});

  useEffect(() => {
    loadTenderData();
  }, [id]);

  const loadTenderData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const [tenderData, commentsData, auditData] = await Promise.all([
        api.getTender(Number(id)),
        api.request<Comment[]>(`/tenders/${id}/comments`),
        api.getAuditLog(Number(id)),
      ]);
      
      setTender(tenderData);
      setComments(commentsData);
      setAuditLog(auditData);
      setEditData(tenderData);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    try {
      const comment = await api.addComment(Number(id), newComment);
      setComments([...comments, comment]);
      setNewComment('');
    } catch (err: any) {
      alert('Ошибка при добавлении комментария: ' + err.message);
    }
  };

  const handleUpdateTender = async () => {
    if (!id) return;

    try {
      await api.updateTender(Number(id), editData);
      await loadTenderData();
      setIsEditing(false);
      alert('Тендер успешно обновлён');
    } catch (err: any) {
      alert('Ошибка при обновлении: ' + err.message);
    }
  };

  const handleDeleteTender = async () => {
    if (!id || !window.confirm('Вы уверены, что хотите удалить этот тендер?')) return;

    try {
      await api.deleteTender(Number(id));
      navigate('/tenders');
    } catch (err: any) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      COMMERCIAL: 'Коммерческий',
      STATE: 'Госзакупка',
      INTERNATIONAL: 'Международный',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !tender) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Ошибка</h2>
          <p className="text-red-600 mb-4">{error || 'Тендер не найден'}</p>
          <Link to="/tenders" className="text-indigo-600 hover:text-indigo-500">
            ← Вернуться к списку тендеров
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'ORG_ADMIN' || user?.role === 'TENDER_MANAGER';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/tenders" className="text-indigo-600 hover:text-indigo-500 text-sm mb-4 inline-block">
          ← Назад к списку
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{tender.title}</h1>
            <div className="flex gap-2 items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tender.status)}`}>
                {tender.status}
              </span>
              <span className="text-sm text-gray-500">{getTypeLabel(tender.tender_type)}</span>
            </div>
          </div>
          
          {canEdit && (
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={handleDeleteTender}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Удалить
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleUpdateTender}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData(tender);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Отмена
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          {[
            { id: 'details', label: 'Информация' },
            { id: 'comments', label: `Комментарии (${comments.length})` },
            { id: 'audit', label: `История (${auditLog.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input
                  type="text"
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип тендера</label>
                  <select
                    value={editData.tender_type || 'COMMERCIAL'}
                    onChange={(e) => setEditData({ ...editData, tender_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="COMMERCIAL">Коммерческий</option>
                    <option value="STATE">Госзакупка</option>
                    <option value="INTERNATIONAL">Международный</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select
                    value={editData.status || 'DRAFT'}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DRAFT">Черновик</option>
                    <option value="PUBLISHED">Опубликован</option>
                    <option value="IN_PROGRESS">В работе</option>
                    <option value="COMPLETED">Завершён</option>
                    <option value="CANCELLED">Отменён</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">НМЦК (₽)</label>
                  <input
                    type="number"
                    value={editData.nmcc || ''}
                    onChange={(e) => setEditData({ ...editData, nmcc: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Номер уведомления</label>
                  <input
                    type="text"
                    value={editData.notification_number || ''}
                    onChange={(e) => setEditData({ ...editData, notification_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Описание</h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {tender.description || 'Описание отсутствует'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">НМЦК</h3>
                  <p className="text-gray-900">
                    {tender.nmcc ? `${tender.nmcc.toLocaleString()} ₽` : 'Не указана'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Номер уведомления</h3>
                  <p className="text-gray-900">{tender.notification_number || '—'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Площадка</h3>
                  <p className="text-gray-900">{tender.marketplace || '—'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Создан</h3>
                  <p className="text-gray-900">
                    {new Date(tender.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              
              {tender.stages && tender.stages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Этапы</h3>
                  <div className="space-y-2">
                    {tender.stages
                      .sort((a, b) => a.order - b.order)
                      .map((stage, index) => (
                        <div
                          key={stage.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full font-medium text-sm">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{stage.name}</p>
                            {stage.description && (
                              <p className="text-sm text-gray-500">{stage.description}</p>
                            )}
                          </div>
                          {stage.is_completed && (
                            <span className="text-green-600 text-sm">✓ Завершён</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <form onSubmit={handleAddComment} className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Добавить комментарий..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Отправить
              </button>
            </form>
          </div>
          
          <div className="divide-y divide-gray-200">
            {comments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Комментариев пока нет. Будьте первым!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-medium">
                        {(comment.user_full_name || comment.user_email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {comment.user_full_name || comment.user_email}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {auditLog.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                История изменений пуста
              </div>
            ) : (
              auditLog.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-600 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{log.action}</span>
                        {log.user_email && (
                          <span className="text-sm text-gray-500">
                            от {log.user_email}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(log.created_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {log.field_name && (
                        <p className="text-sm text-gray-600">
                          Поле: <span className="font-medium">{log.field_name}</span>
                        </p>
                      )}
                      {(log.old_value || log.new_value) && (
                        <div className="mt-2 text-sm">
                          {log.old_value && (
                            <p className="text-red-600">Было: {log.old_value}</p>
                          )}
                          {log.new_value && (
                            <p className="text-green-600">Стало: {log.new_value}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenderDetailPage;
