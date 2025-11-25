
export enum UserRole {
  SALES = 'sales',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  password?: string;
}

export enum ExpenseStatus {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum ExpenseCategory {
  RESTAURANT = 'Restaurant',
  HOTEL = 'Hotel',
  TRANSPORT = 'Transport',
  SUPPLIES = 'Supplies',
  MISC = 'Miscellaneous',
  FUEL = 'Fuel',
  PARKING = 'Parking',
  MILEAGE = 'Mileage'
}

export interface Expense {
  id: string;
  userId: string;
  userName: string; // Denormalized for easier display
  merchant: string;
  date: string; // ISO Date string
  subtotal: number;
  tax: number;
  total: number;
  category: ExpenseCategory | string;
  imageUrl: string;
  status: ExpenseStatus;
  notes?: string;
  distance?: number; // For mileage calculations
  createdAt: string;
}

export interface ReceiptAnalysisResult {
  merchant: string;
  date: string;
  subtotal: number;
  tax: number;
  total: number;
  category: string;
}
