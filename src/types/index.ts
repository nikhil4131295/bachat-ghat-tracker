// Data types for Bachat Ghat Tracker

export type UserRole = 'treasurer' | 'officer';

export interface Group {
  id: string;
  name: string;
  village: string;
  panchayat: string;
  started_date: string; // YYYY-MM-DD
  monthly_saving_amount: number; // in Rupees
  monthly_interest_rate: number; // e.g. 2.0% per month
  monthly_late_fine: number; // in Rupees
  meeting_day: number; // 1 to 31
  group_code: string; // 6-character code e.g. 'JB0001'
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  group_id: string;
  name: string;
  phone?: string;
  photo_url?: string;
  passbook_token: string; // unique random hex
  is_active: boolean; // soft delete
  joined_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface MemberWithStats extends Member {
  total_savings: number;
  total_loan_taken: number;
  total_loan_repaid: number;
  outstanding_loan: number;
  total_interest_paid: number;
  has_active_loan: boolean;
  savings_count: number;
}

export type LoanPurpose = 'Farming' | 'Business' | 'Medical' | 'Education' | 'Home' | 'Other';
export type LoanStatus = 'active' | 'closed';

export interface Loan {
  id: string;
  group_id: string;
  member_id: string;
  principal_amount: number;
  monthly_interest_rate: number;
  start_date: string;
  purpose: LoanPurpose;
  status: LoanStatus;
  closed_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type TransactionType = 'saving' | 'loan_given' | 'loan_repayment' | 'expense' | 'fine';

export type ExpenseCategory = 'Stationery' | 'Meeting' | 'Bank Charges' | 'Travel' | 'Other';

export interface Transaction {
  id: string;
  group_id: string;
  member_id?: string | null;
  type: TransactionType;
  amount: number;
  interest_part: number;
  principal_part: number;
  loan_id?: string | null;
  category?: string | null;
  note?: string | null;
  entry_date: string;
  created_by?: string | null;
  created_at?: string;
  deleted_at?: string | null; // soft delete
  is_pending_sync?: boolean; // for offline IndexedDB queue
}

export interface SMSLog {
  id: string;
  group_id: string;
  member_id?: string | null;
  phone: string;
  message: string;
  channel: 'sms' | 'whatsapp' | 'provider';
  status: 'sent' | 'pending' | 'failed';
  sent_at: string;
}

export interface GroupSummary {
  totalSavings: number;
  totalLoansOutstanding: number;
  totalExpenses: number;
  totalFines: number;
  totalInterestEarned: number;
  cashInHand: number;
  activeMembersCount: number;
  activeLoansCount: number;
}
