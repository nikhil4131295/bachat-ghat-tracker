import type { Transaction, Loan, Member, MemberWithStats, GroupSummary } from '../types';

/**
 * Format number in Indian currency style (e.g. ₹1,25,000)
 */
export function formatINR(amount: number | undefined | null): string {
  const value = Math.round(amount || 0);
  return '₹' + value.toLocaleString('en-IN');
}

/**
 * Format date string into DD/MM/YYYY
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Generate a random, readable 6-character uppercase Group Code (e.g. JB1042)
 */
export function generateGroupCode(prefix = 'BG'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = prefix.toUpperCase().slice(0, 2);
  while (result.length < 6) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a cryptographically unguessable passbook token
 */
export function generatePassbookToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate member financial statistics
 */
export function calculateMemberStats(
  member: Member,
  transactions: Transaction[],
  loans: Loan[]
): MemberWithStats {
  const memberTxns = transactions.filter(
    t => t.member_id === member.id && !t.deleted_at
  );
  const memberLoans = loans.filter(l => l.member_id === member.id);

  // Total savings
  const savingsTxns = memberTxns.filter(t => t.type === 'saving');
  const total_savings = savingsTxns.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Total loan taken
  const total_loan_taken = memberLoans.reduce((sum, l) => sum + (l.principal_amount || 0), 0);

  // Loan repayments
  const repaymentTxns = memberTxns.filter(t => t.type === 'loan_repayment');
  const total_loan_repaid = repaymentTxns.reduce((sum, t) => sum + (t.principal_part || 0), 0);
  const total_interest_paid = repaymentTxns.reduce((sum, t) => sum + (t.interest_part || 0), 0);

  // Outstanding principal
  const outstanding_loan = Math.max(0, total_loan_taken - total_loan_repaid);
  const has_active_loan = memberLoans.some(l => l.status === 'active') || outstanding_loan > 0;

  return {
    ...member,
    total_savings,
    total_loan_taken,
    total_loan_repaid,
    outstanding_loan,
    total_interest_paid,
    has_active_loan,
    savings_count: savingsTxns.length,
  };
}

/**
 * Calculate group totals and cash in hand:
 * Cash in Hand = Total Savings + Total Interest Earned + Total Fines - Loans Outstanding - Expenses
 */
export function calculateGroupTotals(
  transactions: Transaction[],
  loans: Loan[],
  activeMembersCount = 0
): GroupSummary {
  const validTxns = transactions.filter(t => !t.deleted_at);

  // 1. Total Savings
  const totalSavings = validTxns
    .filter(t => t.type === 'saving')
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Loans Principal Given
  const totalLoansGiven = loans
    .reduce((sum, l) => sum + l.principal_amount, 0);

  // 3. Loans Principal Repaid
  const totalPrincipalRepaid = validTxns
    .filter(t => t.type === 'loan_repayment')
    .reduce((sum, t) => sum + (t.principal_part || 0), 0);

  // Outstanding loans
  const totalLoansOutstanding = Math.max(0, totalLoansGiven - totalPrincipalRepaid);

  // 4. Interest Paid by members
  const totalInterestEarned = validTxns
    .filter(t => t.type === 'loan_repayment')
    .reduce((sum, t) => sum + (t.interest_part || 0), 0);

  // 5. Total Expenses
  const totalExpenses = validTxns
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // 6. Total Fines
  const totalFines = validTxns
    .filter(t => t.type === 'fine')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group Cash in Hand = total savings + interest earned + fines collected - loans outstanding - expenses
  const cashInHand = Math.max(
    0,
    totalSavings + totalInterestEarned + totalFines - totalLoansOutstanding - totalExpenses
  );

  const activeLoansCount = loans.filter(l => l.status === 'active').length;

  return {
    totalSavings,
    totalLoansOutstanding,
    totalExpenses,
    totalFines,
    totalInterestEarned,
    cashInHand,
    activeMembersCount,
    activeLoansCount,
  };
}

/**
 * Active loan details for a member (reducing balance)
 */
export interface MemberActiveLoanInfo {
  loan: Loan | null;
  originalPrincipal: number;
  principalRepaidSoFar: number;
  pendingPrincipal: number;
  monthlyInterestRate: number;
  interestDueThisMonth: number;
}

export function getMemberActiveLoanInfo(
  memberId: string,
  loans: Loan[],
  transactions: Transaction[],
  defaultMonthlyRate = 2.0
): MemberActiveLoanInfo {
  // Find active loan for member
  const memberLoans = loans.filter(l => l.member_id === memberId && l.status === 'active');
  const activeLoan = memberLoans[0] || null;

  if (!activeLoan) {
    return {
      loan: null,
      originalPrincipal: 0,
      principalRepaidSoFar: 0,
      pendingPrincipal: 0,
      monthlyInterestRate: defaultMonthlyRate,
      interestDueThisMonth: 0,
    };
  }

  // Calculate repaid principal for this loan
  const repayments = transactions.filter(
    t => t.member_id === memberId && t.type === 'loan_repayment' && (!t.loan_id || t.loan_id === activeLoan.id) && !t.deleted_at
  );

  const principalRepaidSoFar = repayments.reduce((sum, t) => sum + (t.principal_part || 0), 0);
  const pendingPrincipal = Math.max(0, activeLoan.principal_amount - principalRepaidSoFar);
  const monthlyInterestRate = activeLoan.monthly_interest_rate || defaultMonthlyRate;

  // Interest due this month = pending principal * (monthlyRate / 100)
  const interestDueThisMonth = Math.round(pendingPrincipal * (monthlyInterestRate / 100));

  return {
    loan: activeLoan,
    originalPrincipal: activeLoan.principal_amount,
    principalRepaidSoFar,
    pendingPrincipal,
    monthlyInterestRate,
    interestDueThisMonth,
  };
}

/**
 * Split loan repayment: interest first, remainder reduces principal
 */
export interface RepaymentSplitResult {
  interestPart: number;
  principalPart: number;
  remainingPendingPrincipal: number;
  isLoanFullyClosed: boolean;
}

export function splitLoanRepayment(
  totalPayment: number,
  interestDue: number,
  pendingPrincipal: number
): RepaymentSplitResult {
  const payment = Math.max(0, Math.round(totalPayment));
  const dueInterest = Math.max(0, Math.round(interestDue));
  const currentPending = Math.max(0, Math.round(pendingPrincipal));

  if (payment <= dueInterest) {
    return {
      interestPart: payment,
      principalPart: 0,
      remainingPendingPrincipal: currentPending,
      isLoanFullyClosed: false,
    };
  }

  const interestPart = dueInterest;
  const rawPrincipal = payment - dueInterest;
  const principalPart = Math.min(rawPrincipal, currentPending);
  const remainingPendingPrincipal = Math.max(0, currentPending - principalPart);
  const isLoanFullyClosed = remainingPendingPrincipal === 0;

  return {
    interestPart,
    principalPart,
    remainingPendingPrincipal,
    isLoanFullyClosed,
  };
}
