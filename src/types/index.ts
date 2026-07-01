// Dashboard Types
export interface StatsCardData {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  icon?: 'star' | 'check' | 'alert' | 'bell';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  badge?: {
    label: string;
    color: 'success' | 'warning' | 'error' | 'info';
  };
  color?: 'blue' | 'green' | 'orange' | 'pink' | 'purple';
}

export interface CategoryOverview {
  id: string;
  name: string;
  percentage: number;
  count: number;
  color: 'blue' | 'teal' | 'orange' | 'purple';
  icon?: string;
}

export interface Review {
  id: string;
  storeId: string;
  storeName: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  avatar?: string;
}

export interface LocationZone {
  id: string;
  code: string;
  status: 'available' | 'occupied' | 'pending';
  floor?: string;
  section?: string;
  size?: string;
}

export interface DashboardMetrics {
  totalRating: number;
  readyCount: number;
  pendingCount: number;
  notificationCount: number;
  categories: CategoryOverview[];
  recentReviews: Review[];
  zones: LocationZone[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// ===== Market Map Types =====
export interface MarketZone {
  id: string;
  code: string;
  status: 'available' | 'occupied' | 'repair';
  zone: string; // A, B, C
  row: number;
  col: number;
  seller?: {
    id: string;
    name: string;
    phone: string;
  };
  rentedDate?: string;
  rentEndDate?: string;
}

// ===== Orders Types =====
export interface Order {
  id: string;
  orderId: string;
  seller: {
    id: string;
    name: string;
    avatar: string;
  };
  zone: string;
  date: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  items?: number;
}

// ===== Sellers Types =====
export interface Seller {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  citizen_id?: string;
  address?: string;
  current_stalls?: string[];
  created_at?: string;
  status: 'active' | 'inactive' | 'pending' | 'banned' | string;
  document_status?: 'pending' | 'approved' | 'rejected' | 'request_more' | string;
  document_image?: string | null;
  document_url?: string | null;
  avatar?: string;
}

export interface NewSellerApplication {
  id: string | number;
  name: string;
  email?: string;
  phone: string;
  citizen_id?: string;
  address?: string;
  submission_date?: string;
  document_status?: 'pending' | 'approved' | 'rejected' | 'request_more' | string;
  document_image?: string | null;
  document_url?: string | null;
  status?: string;
  avatar?: string;
}

// ===== Payments Types =====
export interface PaymentDetails {
  storeName: string;
  storeId: string;
  qrCodeUrl?: string;
  bankName?: string;
  accountNumber?: string;
  promptPayId?: string;
}

export interface PaymentTransaction {
  id: string;
  transactionId: string;
  amount: number;
  date: string;
  seller: string;
  method: 'qr' | 'bank' | 'cash';
  status: 'success' | 'pending' | 'failed';
}

// ===== Issues/Reports Types =====
export interface IssueReport {
  id: string;
  type: 'electric' | 'water' | 'structure' | 'clean' | 'feedback' | 'other';
  zone: string;
  description: string;
  date: string;
  time: string;
  rawDate?: string | null;
  status: 'pending' | 'progress' | 'resolved';
  image?: string;
  priority?: 'low' | 'medium' | 'high';
  reporter?: string;
  adminNote?: string;
}

// ===== Announcements Types =====
export interface Announcement {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  rawDate?: string | null;
  status: 'active' | 'inactive' | 'draft';
  category?: 'urgent' | 'event' | 'general' | 'news' | 'promotion' | 'update' | 'maintenance';
}

// ===== Page Props Types =====
export interface PageContainerProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  pagination?: boolean;
  pageSize?: number;
}
