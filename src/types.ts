export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  merchant: string;
  category: string;
  notes?: string;
  user_id?: string;
}

export interface AppData {
  budget: number;
  transactions: Transaction[];
}

export type CategoryType = 
  | 'Food & Beverage' 
  | 'Groceries' 
  | 'Transportation' 
  | 'Shopping' 
  | 'Bills & Utilities' 
  | 'Entertainment' 
  | 'Others';
