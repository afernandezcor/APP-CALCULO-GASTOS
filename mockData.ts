
import { User, UserRole, Expense, ExpenseStatus, ExpenseCategory } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alex Salesperson',
    email: 'alex@billboard.com',
    role: UserRole.SALES,
    avatar: 'https://picsum.photos/100/100',
    password: '123456'
  },
  {
    id: 'u2',
    name: 'Jordan Manager',
    email: 'jordan@billboard.com',
    role: UserRole.MANAGER,
    avatar: 'https://picsum.photos/101/101',
    password: '123456'
  },
  {
    id: 'u3',
    name: 'Sam Field',
    email: 'sam@billboard.com',
    role: UserRole.SALES,
    avatar: 'https://picsum.photos/102/102',
    password: '123456'
  },
  {
    id: 'u4',
    name: 'Aritz Fernandez Cortes',
    email: 'aritz@billboard.com',
    role: UserRole.SALES,
    avatar: 'https://picsum.photos/103/103',
    password: '123456'
  },
  {
    id: 'u5',
    name: 'Master Admin',
    email: 'admin@billboard.com',
    role: UserRole.ADMIN,
    avatar: 'https://ui-avatars.com/api/?name=Master+Admin&background=000&color=fff',
    password: '123456'
  }
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1',
    userId: 'u1',
    userName: 'Alex Salesperson',
    merchant: 'Starbucks',
    date: '2023-10-15',
    subtotal: 12.50,
    tax: 1.20,
    total: 13.70,
    category: ExpenseCategory.RESTAURANT,
    imageUrl: 'https://picsum.photos/400/600',
    status: ExpenseStatus.APPROVED,
    createdAt: '2023-10-15T10:00:00Z'
  },
  {
    id: 'e2',
    userId: 'u1',
    userName: 'Alex Salesperson',
    merchant: 'Uber',
    date: '2023-10-16',
    subtotal: 25.00,
    tax: 0,
    total: 25.00,
    category: ExpenseCategory.TRANSPORT,
    imageUrl: 'https://picsum.photos/401/600',
    status: ExpenseStatus.SUBMITTED,
    createdAt: '2023-10-16T14:00:00Z'
  },
  {
    id: 'e3',
    userId: 'u3',
    userName: 'Sam Field',
    merchant: 'Hilton Garden Inn',
    date: '2023-10-14',
    subtotal: 200.00,
    tax: 35.00,
    total: 235.00,
    category: ExpenseCategory.HOTEL,
    imageUrl: 'https://picsum.photos/402/600',
    status: ExpenseStatus.APPROVED,
    createdAt: '2023-10-14T08:00:00Z'
  },
  {
    id: 'e4',
    userId: 'u1',
    userName: 'Alex Salesperson',
    merchant: 'Staples',
    date: '2023-10-18',
    subtotal: 45.00,
    tax: 4.50,
    total: 49.50,
    category: ExpenseCategory.SUPPLIES,
    imageUrl: 'https://picsum.photos/403/600',
    status: ExpenseStatus.REJECTED,
    notes: 'Duplicate entry',
    createdAt: '2023-10-18T11:00:00Z'
  },
  // April 2025 Data for Report Demo (Aritz)
  {
    id: 'r1',
    userId: 'u4',
    userName: 'Aritz Fernandez Cortes',
    merchant: 'SEGURO VIAJE MONGOLIA IATI',
    date: '2025-03-31',
    subtotal: 43.69,
    tax: 0,
    total: 43.69,
    category: ExpenseCategory.MISC,
    imageUrl: 'https://picsum.photos/404/600',
    status: ExpenseStatus.APPROVED,
    createdAt: '2025-03-31T09:00:00Z'
  },
  {
    id: 'r2',
    userId: 'u4',
    userName: 'Aritz Fernandez Cortes',
    merchant: 'BUS DONOSTIA-LOIU PESA',
    date: '2025-04-03',
    subtotal: 3.45,
    tax: 0,
    total: 3.45,
    category: ExpenseCategory.TRANSPORT,
    imageUrl: 'https://picsum.photos/405/600',
    status: ExpenseStatus.APPROVED,
    createdAt: '2025-04-03T10:00:00Z'
  },
  {
    id: 'r3',
    userId: 'u4',
    userName: 'Aritz Fernandez Cortes',
    merchant: 'HOTEL BOOKING ISTAMBUL',
    date: '2025-04-04',
    subtotal: 64.58,
    tax: 0,
    total: 64.58,
    category: ExpenseCategory.HOTEL,
    imageUrl: 'https://picsum.photos/406/600',
    status: ExpenseStatus.APPROVED,
    createdAt: '2025-04-04T12:00:00Z'
  },
  {
    id: 'r4',
    userId: 'u4',
    userName: 'Aritz Fernandez Cortes',
    merchant: 'DESAYUNO LOIU',
    date: '2025-04-04',
    subtotal: 7.40,
    tax: 0,
    total: 7.40,
    category: ExpenseCategory.RESTAURANT,
    imageUrl: 'https://picsum.photos/407/600',
    status: ExpenseStatus.APPROVED,
    createdAt: '2025-04-04T08:00:00Z'
  },
  {
    id: 'r5',
    userId: 'u4',
    userName: 'Aritz Fernandez Cortes',
    merchant: 'HOTEL ULAN BATOR',
    date: '2025-04-05',
    subtotal: 176.45,
    tax: 0,
    total: 176.45,
    category: ExpenseCategory.HOTEL,
    imageUrl: 'https://picsum.photos/408/600',
    status: ExpenseStatus.APPROVED,
    createdAt: '2025-04-05T18:00:00Z'
  },
  {
    id: 'r6',
    userId: 'u4',
    userName: 'Aritz Fernandez Cortes',
    merchant: 'SPORTIN ORDON',
    date: '2025-04-06',
    subtotal: 4.19,
    tax: 0,
    total: 4.19,
    category: ExpenseCategory.RESTAURANT,
    imageUrl: 'https://picsum.photos/409/600',
    status: ExpenseStatus.APPROVED,
    createdAt: '2025-04-06T14:00:00Z'
  },
  {
    id: 'r7',
    userId: 'u4',
    userName: 'Aritz Fernandez Cortes',
    merchant: 'VUELOS CANADA KLM',
    date: '2025-04-09',
    subtotal: 1213.85,
    tax: 0,
    total: 1213.85,
    category: ExpenseCategory.TRANSPORT,
    imageUrl: 'https://picsum.photos/410/600',
    status: ExpenseStatus.APPROVED,
    createdAt: '2025-04-09T11:00:00Z'
  }
];
