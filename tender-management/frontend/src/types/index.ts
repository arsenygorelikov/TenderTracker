export interface User {
  id: string;
  tenant_id: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface Tender {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  budget?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TenderEvent {
  id: string;
  tender_id: string;
  user_id: string;
  event_type: 'comment' | 'status_change' | 'notification';
  content: string;
  created_at: string;
}

export interface TenderChangeLog {
  id: string;
  tender_id: string;
  user_id: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}
