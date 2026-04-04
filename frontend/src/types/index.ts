export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: 'ORG_ADMIN' | 'TENDER_MANAGER' | 'VIEWER';
  organization_id: number;
  is_active: boolean;
}

export interface Tender {
  id: number;
  title: string;
  description: string | null;
  tender_type: '44-ФЗ' | '223-ФЗ' | 'Коммерческая';
  status: 'draft' | 'planning' | 'active' | 'completed' | 'cancelled';
  nmcc: number | null;
  notification_number: string | null;
  marketplace: string | null;
  organization_id: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  content: string;
  tender_id: number;
  user_id: number;
  user_email: string;
  user_full_name: string | null;
  created_at: string;
  is_edited: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
