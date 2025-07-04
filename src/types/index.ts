export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  manager?: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  brand: string;
  model: string;
  stockQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
  branchId: string;
  lastUpdated: Date;
  lowStockThreshold?: number;
}

export interface ServiceEntry {
  id: string;
  billNumber: string;
  branchId: string;
  deviceName: string;
  model: string;
  imei?: string;
  problemDescription: string;
  technicianAssignment?: string;
  expectedDeliveryDate: Date;
  entryDate: Date;
  status: ServiceStatus;
  statusHistory: StatusHistoryEntry[];
  delayReason?: string;
}

export interface StatusHistoryEntry {
  status: ServiceStatus;
  timestamp: Date;
  user: string;
  notes?: string;
}

export type ServiceStatus = 'pending' | 'in-process' | 'ready' | 'delivered' | 'returned';

export interface DashboardMetrics {
  todayServiceCount: number;
  tomorrowPendingServices: number;
  inProcessCount: number;
  readyForDeliveryCount: number;
  overSixMonthCount: number;
  branchWisePerformance: { [branchId: string]: number };
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  branchId?: string;
  isAuthenticated: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface BillSettings {
  branchId: string;
  prefix: string;
  currentNumber: number;
  format: string; // e.g., "MAIN-{YYYY}-{MM}-{####}"
}