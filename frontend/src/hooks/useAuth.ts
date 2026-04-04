import { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => {
          api.logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    const userData = await api.getMe();
    setUser(userData);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return { user, loading, login, logout };
}
