import * as XLSX from 'xlsx';
import type { Group, Member, Loan, Transaction, MemberWithStats } from '../types';
import { formatINR, formatDate, calculateMemberStats, calculateGroupTotals } from './calculations';

// Helper to set column widths
function fitColumns(ws: XLSX.WorkSheet, data: any[][]) {
  const colWidths = data[0].map((_, colIdx) => {
    let maxLen = 10;
    for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
      const val = data[rowIdx][colIdx];
      if (val !== undefined && val !== null) {
        const len = String(val).length;
        if (len > maxLen) maxLen = Math.min(len + 3, 35);
      }
    }
    return { wch: maxLen };
  });
  ws['!cols'] = colWidths;
}

/**
 * 1. Download Blank / Sample Excel Template (.xlsx)
 * Contains two sheets: "Members" and "Transactions"
 */
export function downloadExcelTemplate(groupName = 'Bachat Ghat') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Members
  const membersData = [
    ['Member Name', 'Phone Number', 'Joined Date (DD/MM/YYYY)'],
    ['Sunita Tai Shinde', '9822100001', '10/05/2026'],
    ['Anusaya Bai Patil', '9822100002', '10/05/2026'],
    ['Mangal Tai Gaikwad', '9822100003', '10/05/2026'],
    ['Shakuntala Kadam', '9822100004', '10/05/2026'],
  ];
  const wsMembers = XLSX.utils.aoa_to_sheet(membersData);
  fitColumns(wsMembers, membersData);
  XLSX.utils.book_append_sheet(wb, wsMembers, 'Members');

  // Sheet 2: Transactions
  const transactionsData = [
    ['Date (DD/MM/YYYY)', 'Member Name', 'Type (saving/loan_repayment/loan_given/expense/fine)', 'Amount (Rs)', 'Category or Purpose', 'Note'],
    ['10/05/2026', 'Sunita Tai Shinde', 'saving', 100, '', 'Monthly saving deposit'],
    ['10/05/2026', 'Anusaya Bai Patil', 'saving', 100, '', 'Monthly saving deposit'],
    ['10/05/2026', '', 'expense', 150, 'Stationery', 'Registers and passbooks'],
    ['10/06/2026', 'Mangal Tai Gaikwad', 'loan_given', 5000, 'Farming', 'Seed purchase loan'],
    ['10/07/2026', 'Mangal Tai Gaikwad', 'loan_repayment', 100, '', 'July monthly interest'],
  ];
  const wsTxns = XLSX.utils.aoa_to_sheet(transactionsData);
  fitColumns(wsTxns, transactionsData);
  XLSX.utils.book_append_sheet(wb, wsTxns, 'Transactions');

  XLSX.writeFile(wb, `${groupName.replace(/[^a-zA-Z0-9]/g, '_')}_Template.xlsx`);
}

/**
 * 2. Validate and Parse Excel file upload
 */
export interface ValidatedImportRow {
  rowIndex: number;
  sheetName: string;
  kind: 'member' | 'transaction';
  isValid: boolean;
  isDuplicate: boolean;
  errorMessage?: string;
  data: {
    name?: string;
    phone?: string;
    date?: string;
    memberName?: string;
    type?: string;
    amount?: number;
    category?: string;
    note?: string;
  };
}

export interface ParseExcelResult {
  fileName: string;
  totalRows: number;
  validRows: ValidatedImportRow[];
  errorRows: ValidatedImportRow[];
  duplicateCount: number;
}

export async function parseAndValidateExcelFile(
  file: File,
  existingMembers: Member[],
  existingTxns: Transaction[]
): Promise<ParseExcelResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  const validRows: ValidatedImportRow[] = [];
  const errorRows: ValidatedImportRow[] = [];
  let duplicateCount = 0;
  let totalRows = 0;

  // 1. Process "Members" sheet if present
  const memberSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('member'));
  if (memberSheetName) {
    const ws = wb.Sheets[memberSheetName];
    const rawData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
    if (rawData.length > 1) {
      const headers: string[] = (rawData[0] || []).map((h: any) => String(h || '').trim().toLowerCase());
      const nameCol = headers.findIndex(h => h.includes('name') || h.includes('नाव'));
      const phoneCol = headers.findIndex(h => h.includes('phone') || h.includes('मोबाईल'));

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        totalRows++;

        const name = String(row[nameCol] || '').trim();
        const phone = row[phoneCol] ? String(row[phoneCol]).trim() : '';

        if (!name) {
          errorRows.push({
            rowIndex: i + 1,
            sheetName: memberSheetName,
            kind: 'member',
            isValid: false,
            isDuplicate: false,
            errorMessage: 'Member name is missing',
            data: { phone },
          });
          continue;
        }

        const isDuplicate = existingMembers.some(
          m => m.name.toLowerCase() === name.toLowerCase() || (phone && m.phone === phone)
        );

        if (isDuplicate) {
          duplicateCount++;
          validRows.push({
            rowIndex: i + 1,
            sheetName: memberSheetName,
            kind: 'member',
            isValid: true,
            isDuplicate: true,
            errorMessage: 'Duplicate member (will be skipped)',
            data: { name, phone },
          });
        } else {
          validRows.push({
            rowIndex: i + 1,
            sheetName: memberSheetName,
            kind: 'member',
            isValid: true,
            isDuplicate: false,
            data: { name, phone },
          });
        }
      }
    }
  }

  // 2. Process "Transactions" sheet if present (or the only sheet)
  const txnSheetName =
    wb.SheetNames.find(s => s.toLowerCase().includes('trans') || s.toLowerCase().includes('हिशोब')) ||
    (wb.SheetNames.length === 1 && !memberSheetName ? wb.SheetNames[0] : undefined);

  if (txnSheetName) {
    const ws = wb.Sheets[txnSheetName];
    const rawData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
    if (rawData.length > 1) {
      const headers: string[] = (rawData[0] || []).map((h: any) => String(h || '').trim().toLowerCase());
      const dateCol = headers.findIndex(h => h.includes('date') || h.includes('तारीख'));
      const memberCol = headers.findIndex(h => h.includes('member') || h.includes('नाव'));
      const typeCol = headers.findIndex(h => h.includes('type') || h.includes('प्रकार'));
      const amountCol = headers.findIndex(h => h.includes('amount') || h.includes('रक्कम'));
      const catCol = headers.findIndex(h => h.includes('category') || h.includes('purpose') || h.includes('हेतू'));
      const noteCol = headers.findIndex(h => h.includes('note') || h.includes('टीप'));

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        totalRows++;

        const rawDate = row[dateCol];
        const memberName = String(row[memberCol] || '').trim();
        const rawType = String(row[typeCol] || 'saving').trim().toLowerCase();
        const rawAmount = Number(row[amountCol]);
        const category = row[catCol] ? String(row[catCol]).trim() : undefined;
        const note = row[noteCol] ? String(row[noteCol]).trim() : undefined;

        // Parse date (supports Excel serial numbers, DD/MM/YYYY, or YYYY-MM-DD)
        let formattedDate = new Date().toISOString().split('T')[0];
        if (typeof rawDate === 'number') {
          // Excel serial date
          const dateObj = XLSX.SSF.parse_date_code(rawDate);
          if (dateObj) {
            formattedDate = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
          }
        } else if (typeof rawDate === 'string' && rawDate.trim()) {
          const parts = rawDate.trim().split(/[/.-]/);
          if (parts.length === 3) {
            if (parts[2].length === 4) {
              // DD/MM/YYYY
              formattedDate = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
            } else if (parts[0].length === 4) {
              // YYYY-MM-DD
              formattedDate = `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
            }
          }
        }

        // Validate Amount
        if (isNaN(rawAmount) || rawAmount <= 0) {
          errorRows.push({
            rowIndex: i + 1,
            sheetName: txnSheetName,
            kind: 'transaction',
            isValid: false,
            isDuplicate: false,
            errorMessage: 'Amount is missing or invalid number',
            data: { memberName, date: formattedDate, type: rawType, amount: rawAmount, category, note },
          });
          continue;
        }

        // Normalize type
        let type: 'saving' | 'loan_repayment' | 'loan_given' | 'expense' | 'fine' = 'saving';
        if (rawType.includes('repay') || rawType.includes('परतफेड') || rawType.includes('हप्ता')) {
          type = 'loan_repayment';
        } else if (rawType.includes('given') || rawType.includes('वाटप') || rawType.includes('कर्ज')) {
          type = 'loan_given';
        } else if (rawType.includes('exp') || rawType.includes('खर्च')) {
          type = 'expense';
        } else if (rawType.includes('fine') || rawType.includes('दंड')) {
          type = 'fine';
        }

        // For non-expense, check if member name is provided
        if (type !== 'expense' && !memberName) {
          errorRows.push({
            rowIndex: i + 1,
            sheetName: txnSheetName,
            kind: 'transaction',
            isValid: false,
            isDuplicate: false,
            errorMessage: 'Member name required for this transaction type',
            data: { memberName, date: formattedDate, type, amount: rawAmount, category, note },
          });
          continue;
        }

        // Check duplicates
        const isDuplicate = existingTxns.some(
          t => t.type === type && t.amount === rawAmount && t.entry_date === formattedDate
        );

        if (isDuplicate) {
          duplicateCount++;
          validRows.push({
            rowIndex: i + 1,
            sheetName: txnSheetName,
            kind: 'transaction',
            isValid: true,
            isDuplicate: true,
            errorMessage: 'Duplicate entry (will be skipped)',
            data: { memberName, date: formattedDate, type, amount: rawAmount, category, note },
          });
        } else {
          validRows.push({
            rowIndex: i + 1,
            sheetName: txnSheetName,
            kind: 'transaction',
            isValid: true,
            isDuplicate: false,
            data: { memberName, date: formattedDate, type, amount: rawAmount, category, note },
          });
        }
      }
    }
  }

  return {
    fileName: file.name,
    totalRows,
    validRows,
    errorRows,
    duplicateCount,
  };
}

/**
 * 3. Export Monthly Report (.xlsx)
 * Sheets: Summary, Member-wise Savings, Loan Register, Expenses, Cash Book
 */
export function exportMonthlyReport(
  monthKey: string, // YYYY-MM e.g. "2026-10"
  group: Group,
  members: Member[],
  loans: Loan[],
  transactions: Transaction[]
) {
  const wb = XLSX.utils.book_new();

  const monthParts = monthKey.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[parseInt(monthParts[1], 10) - 1] || monthKey;
  const monthTitle = `${monthName} ${monthParts[0]}`;

  // Filter transactions for this month
  const monthTxns = transactions.filter(t => t.entry_date.startsWith(monthKey) && !t.deleted_at);

  const monthSavings = monthTxns.filter(t => t.type === 'saving').reduce((sum, t) => sum + t.amount, 0);
  const monthRepayments = monthTxns.filter(t => t.type === 'loan_repayment');
  const monthPrincipalRepaid = monthRepayments.reduce((sum, t) => sum + (t.principal_part || 0), 0);
  const monthInterestEarned = monthRepayments.reduce((sum, t) => sum + (t.interest_part || 0), 0);
  const monthLoansGiven = monthTxns.filter(t => t.type === 'loan_given').reduce((sum, t) => sum + t.amount, 0);
  const monthExpenses = monthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const monthFines = monthTxns.filter(t => t.type === 'fine').reduce((sum, t) => sum + t.amount, 0);

  // Overall totals up to this month
  const allTimeSummary = calculateGroupTotals(transactions, loans, members.length);

  // SHEET 1: SUMMARY
  const summaryAoa = [
    [`${group.name} - MONTHLY REPORT (${monthTitle})`],
    [`Village: ${group.village}`, `Gram Panchayat: ${group.panchayat}`, `Group Code: ${group.group_code}`],
    [`Report Month: ${monthTitle}`, `Generated On: ${formatDate(new Date().toISOString())}`],
    [],
    ['FINANCIAL SUMMARY FOR THE MONTH', 'AMOUNT (INR)'],
    ['1. Monthly Member Savings Collected', monthSavings],
    ['2. Loan Interest Collected', monthInterestEarned],
    ['3. Loan Principal Repaid', monthPrincipalRepaid],
    ['4. Late Fines Collected', monthFines],
    ['5. Total Inflows (1 + 2 + 3 + 4)', monthSavings + monthInterestEarned + monthPrincipalRepaid + monthFines],
    ['6. New Loans Disbursed in Month', monthLoansGiven],
    ['7. Group Expenses in Month', monthExpenses],
    ['8. Total Outflows (6 + 7)', monthLoansGiven + monthExpenses],
    [],
    ['GROUP CUMULATIVE POSITION', 'AMOUNT (INR)'],
    ['Total Cumulative Member Savings', allTimeSummary.totalSavings],
    ['Total Outstanding Loans Pending', allTimeSummary.totalLoansOutstanding],
    ['Total Cumulative Interest Earned', allTimeSummary.totalInterestEarned],
    ['Current Group Cash in Hand', allTimeSummary.cashInHand],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  fitColumns(wsSummary, summaryAoa);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // SHEET 2: MEMBER-WISE SAVINGS
  const savingsAoa: any[][] = [
    [`${group.name} - MEMBER SAVINGS REPORT (${monthTitle})`],
    ['S.No', 'Member Name', 'Phone Number', `Saving Deposited in ${monthName} (INR)`, 'Total Cumulative Savings (INR)'],
  ];

  let totalMonthSavingRow = 0;
  let totalCumulativeSavingRow = 0;

  members.forEach((m, idx) => {
    const stats = calculateMemberStats(m, transactions, loans);
    const thisMonthSaving = monthTxns
      .filter(t => t.member_id === m.id && t.type === 'saving')
      .reduce((sum, t) => sum + t.amount, 0);

    totalMonthSavingRow += thisMonthSaving;
    totalCumulativeSavingRow += stats.total_savings;

    savingsAoa.push([
      idx + 1,
      m.name,
      m.phone || '-',
      thisMonthSaving,
      stats.total_savings,
    ]);
  });

  savingsAoa.push(['TOTAL', '', '', totalMonthSavingRow, totalCumulativeSavingRow]);
  const wsSavings = XLSX.utils.aoa_to_sheet(savingsAoa);
  fitColumns(wsSavings, savingsAoa);
  XLSX.utils.book_append_sheet(wb, wsSavings, 'Member Savings');

  // SHEET 3: LOAN REGISTER
  const loanAoa: any[][] = [
    [`${group.name} - LOAN REGISTER (${monthTitle})`],
    ['S.No', 'Member Name', 'Loan Disbursed (INR)', 'Date Taken', 'Purpose', 'Interest Paid (INR)', 'Principal Repaid (INR)', 'Pending Principal (INR)', 'Status'],
  ];

  let sumDisbursed = 0;
  let sumInterestPaid = 0;
  let sumPrincipalRepaid = 0;
  let sumPending = 0;

  loans.forEach((l, idx) => {
    const mem = members.find(m => m.id === l.member_id);
    const repayments = transactions.filter(
      t => t.member_id === l.member_id && t.type === 'loan_repayment' && !t.deleted_at
    );
    const pRepaid = repayments.reduce((s, t) => s + (t.principal_part || 0), 0);
    const iPaid = repayments.reduce((s, t) => s + (t.interest_part || 0), 0);
    const pending = Math.max(0, l.principal_amount - pRepaid);

    sumDisbursed += l.principal_amount;
    sumInterestPaid += iPaid;
    sumPrincipalRepaid += pRepaid;
    sumPending += pending;

    loanAoa.push([
      idx + 1,
      mem?.name || 'Member',
      l.principal_amount,
      formatDate(l.start_date),
      l.purpose,
      iPaid,
      pRepaid,
      pending,
      l.status.toUpperCase(),
    ]);
  });

  loanAoa.push(['TOTAL', '', sumDisbursed, '', '', sumInterestPaid, sumPrincipalRepaid, sumPending, '']);
  const wsLoans = XLSX.utils.aoa_to_sheet(loanAoa);
  fitColumns(wsLoans, loanAoa);
  XLSX.utils.book_append_sheet(wb, wsLoans, 'Loan Register');

  // SHEET 4: EXPENSES
  const expenseAoa: any[][] = [
    [`${group.name} - EXPENSES (${monthTitle})`],
    ['S.No', 'Date', 'Expense Category', 'Amount (INR)', 'Note'],
  ];

  const monthExpenseTxns = monthTxns.filter(t => t.type === 'expense');
  let sumExpense = 0;

  monthExpenseTxns.forEach((e, idx) => {
    sumExpense += e.amount;
    expenseAoa.push([
      idx + 1,
      formatDate(e.entry_date),
      e.category || 'General',
      e.amount,
      e.note || '-',
    ]);
  });
  expenseAoa.push(['TOTAL', '', '', sumExpense, '']);
  const wsExpense = XLSX.utils.aoa_to_sheet(expenseAoa);
  fitColumns(wsExpense, expenseAoa);
  XLSX.utils.book_append_sheet(wb, wsExpense, 'Expenses');

  // SHEET 5: CASH BOOK LEDGER
  const cashBookAoa: any[][] = [
    [`${group.name} - CASH BOOK (${monthTitle})`],
    ['Date', 'Transaction Type', 'Member / Details', 'Cash Inflow (+)', 'Cash Outflow (-)', 'Note'],
  ];

  monthTxns.forEach(t => {
    const mem = members.find(m => m.id === t.member_id);
    const isIncome = t.type === 'saving' || t.type === 'loan_repayment' || t.type === 'fine';
    cashBookAoa.push([
      formatDate(t.entry_date),
      t.type.toUpperCase(),
      mem ? mem.name : t.category || 'Group',
      isIncome ? t.amount : '',
      !isIncome ? t.amount : '',
      t.note || '-',
    ]);
  });
  const wsCashBook = XLSX.utils.aoa_to_sheet(cashBookAoa);
  fitColumns(wsCashBook, cashBookAoa);
  XLSX.utils.book_append_sheet(wb, wsCashBook, 'Cash Book');

  const cleanFileName = `${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_Monthly_Report_${monthKey}.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
}

/**
 * 4. Export Full Group Report (All-Time) for Gram Panchayat & Bank
 */
export function exportFullGroupReport(
  group: Group,
  members: Member[],
  loans: Loan[],
  transactions: Transaction[]
) {
  const wb = XLSX.utils.book_new();
  const summary = calculateGroupTotals(transactions, loans, members.length);

  // SHEET 1: MASTER SUMMARY
  const masterAoa = [
    [`OFFICIAL SELF-HELP GROUP AUDIT REPORT (GRAM PANCHAYAT & BANK COPY)`],
    [`Group Name: ${group.name}`],
    [`Village: ${group.village}`, `Gram Panchayat: ${group.panchayat}`],
    [`Group Code: ${group.group_code}`, `Started Date: ${formatDate(group.started_date)}`],
    [`Meeting Day: ${group.meeting_day}th of every month`, `Monthly Saving Rate: Rs. ${group.monthly_saving_amount}`],
    [`Generated Date: ${formatDate(new Date().toISOString())}`],
    [],
    ['AUDITED FINANCIAL POSITION', 'AMOUNT (INR)'],
    ['Total Active Members Registered', members.filter(m => m.is_active).length],
    ['Total Cumulative Savings Deposited', summary.totalSavings],
    ['Total Principal Disbursed as Loans', loans.reduce((s, l) => s + l.principal_amount, 0)],
    ['Total Cumulative Interest Earned on Loans', summary.totalInterestEarned],
    ['Total Cumulative Fines Collected', summary.totalFines],
    ['Total Loans Currently Outstanding (Pending)', summary.totalLoansOutstanding],
    ['Total Cumulative Group Expenses', summary.totalExpenses],
    ['NET CASH IN HAND / IN BANK', summary.cashInHand],
  ];
  const wsMaster = XLSX.utils.aoa_to_sheet(masterAoa);
  fitColumns(wsMaster, masterAoa);
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Official Summary');

  // SHEET 2: MEMBER DIRECTORY & PASSBOOK TOTALS
  const memAoa: any[][] = [
    [`${group.name} - MEMBER DIRECTORY & CUMULATIVE STATEMENTS`],
    ['S.No', 'Member Name', 'Phone Number', 'Joined Date', 'Total Savings (INR)', 'Total Loans Taken (INR)', 'Loans Repaid (INR)', 'Outstanding Loan (INR)', 'Interest Paid (INR)', 'Status'],
  ];

  let sumSavings = 0;
  let sumTaken = 0;
  let sumRepaid = 0;
  let sumPending = 0;
  let sumInterest = 0;

  members.forEach((m, idx) => {
    const stats = calculateMemberStats(m, transactions, loans);
    sumSavings += stats.total_savings;
    sumTaken += stats.total_loan_taken;
    sumRepaid += stats.total_loan_repaid;
    sumPending += stats.outstanding_loan;
    sumInterest += stats.total_interest_paid;

    memAoa.push([
      idx + 1,
      m.name,
      m.phone || '-',
      formatDate(m.joined_date),
      stats.total_savings,
      stats.total_loan_taken,
      stats.total_loan_repaid,
      stats.outstanding_loan,
      stats.total_interest_paid,
      m.is_active ? 'ACTIVE' : 'INACTIVE',
    ]);
  });

  memAoa.push(['TOTAL', '', '', '', sumSavings, sumTaken, sumRepaid, sumPending, sumInterest, '']);
  const wsMem = XLSX.utils.aoa_to_sheet(memAoa);
  fitColumns(wsMem, memAoa);
  XLSX.utils.book_append_sheet(wb, wsMem, 'Members Master');

  // SHEET 3: FULL LOAN REGISTER
  const loanAoa: any[][] = [
    [`${group.name} - MASTER LOAN REGISTER`],
    ['S.No', 'Borrower Name', 'Principal Loan (INR)', 'Disbursed Date', 'Purpose', 'Interest Paid (INR)', 'Principal Repaid (INR)', 'Balance Remaining (INR)', 'Status'],
  ];

  loans.forEach((l, idx) => {
    const mem = members.find(m => m.id === l.member_id);
    const repayments = transactions.filter(
      t => t.member_id === l.member_id && t.type === 'loan_repayment' && !t.deleted_at
    );
    const pRepaid = repayments.reduce((s, t) => s + (t.principal_part || 0), 0);
    const iPaid = repayments.reduce((s, t) => s + (t.interest_part || 0), 0);
    const pending = Math.max(0, l.principal_amount - pRepaid);

    loanAoa.push([
      idx + 1,
      mem?.name || 'Member',
      l.principal_amount,
      formatDate(l.start_date),
      l.purpose,
      iPaid,
      pRepaid,
      pending,
      l.status.toUpperCase(),
    ]);
  });
  const wsLoans = XLSX.utils.aoa_to_sheet(loanAoa);
  fitColumns(wsLoans, loanAoa);
  XLSX.utils.book_append_sheet(wb, wsLoans, 'All Loans');

  // SHEET 4: AUDITED TRANSACTIONS LEDGER
  const ledgerAoa: any[][] = [
    [`${group.name} - COMPLETE CHRONOLOGICAL AUDIT LEDGER`],
    ['Date', 'Type', 'Member / Payee', 'Amount (INR)', 'Interest Part (INR)', 'Principal Part (INR)', 'Category / Purpose', 'Note'],
  ];

  transactions.filter(t => !t.deleted_at).forEach(t => {
    const mem = members.find(m => m.id === t.member_id);
    ledgerAoa.push([
      formatDate(t.entry_date),
      t.type.toUpperCase(),
      mem ? mem.name : 'Group',
      t.amount,
      t.interest_part || 0,
      t.principal_part || 0,
      t.category || '-',
      t.note || '-',
    ]);
  });
  const wsLedger = XLSX.utils.aoa_to_sheet(ledgerAoa);
  fitColumns(wsLedger, ledgerAoa);
  XLSX.utils.book_append_sheet(wb, wsLedger, 'Complete Ledger');

  const cleanFileName = `${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_Official_Full_Report.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
}

/**
 * 5. Export Individual Member Passbook (.xlsx)
 */
export function exportMemberPassbookExcel(
  member: MemberWithStats,
  group: Group,
  transactions: Transaction[],
  loans: Loan[]
) {
  const wb = XLSX.utils.book_new();

  const memberTxns = transactions
    .filter(t => t.member_id === member.id && !t.deleted_at)
    .sort((a, b) => (a.entry_date > b.entry_date ? 1 : -1));

  const passbookAoa: any[][] = [
    [`DIGITAL MEMBER PASSBOOK`],
    [`Member Name: ${member.name}`, `Phone: ${member.phone || '-'}`],
    [`Group Name: ${group.name}`, `Village: ${group.village}`],
    [`Total Savings Balance: Rs. ${member.total_savings}`, `Outstanding Loan: Rs. ${member.outstanding_loan}`],
    [],
    ['Date', 'Transaction Type', 'Credit Inflow (INR)', 'Debit Outflow (INR)', 'Interest Component (INR)', 'Principal Component (INR)', 'Note'],
  ];

  memberTxns.forEach(t => {
    const isCredit = t.type === 'saving' || t.type === 'loan_repayment' || t.type === 'fine';
    passbookAoa.push([
      formatDate(t.entry_date),
      t.type.toUpperCase(),
      isCredit ? t.amount : '',
      !isCredit ? t.amount : '',
      t.interest_part || 0,
      t.principal_part || 0,
      t.note || '-',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(passbookAoa);
  fitColumns(ws, passbookAoa);
  XLSX.utils.book_append_sheet(wb, ws, 'Passbook');

  const cleanFileName = `${member.name.replace(/[^a-zA-Z0-9]/g, '_')}_Passbook.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
}
