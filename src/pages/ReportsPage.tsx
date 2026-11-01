import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileSpreadsheet,
  Download,
  Upload,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Check,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  downloadExcelTemplate,
  parseAndValidateExcelFile,
  exportMonthlyReport,
  exportFullGroupReport,
  type ParseExcelResult
} from '../lib/excel';
import { formatINR } from '../lib/calculations';
import confetti from 'canvas-confetti';

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentGroup, members, loans, transactions, addMember, addTransaction } = useApp();

  // Monthly Export Month Selector
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.entry_date) {
        set.add(t.entry_date.slice(0, 7)); // YYYY-MM
      }
    });
    const arr = Array.from(set).sort().reverse();
    if (arr.length === 0) {
      arr.push(new Date().toISOString().slice(0, 7));
    }
    return arr;
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] || '2026-10');

  // Excel Import States
  const [isParsing, setIsParsing] = useState(false);
  const [importResult, setImportResult] = useState<ParseExcelResult | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(currentGroup?.name || 'Bachat_Ghat');
  };

  const handleExportMonthly = () => {
    if (!currentGroup) return;
    exportMonthlyReport(selectedMonth, currentGroup, members, loans, transactions);
  };

  const handleExportFull = () => {
    if (!currentGroup) return;
    exportFullGroupReport(currentGroup, members, loans, transactions);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const result = await parseAndValidateExcelFile(file, members, transactions);
      setImportResult(result);
      setIsImportModalOpen(true);
    } catch (err) {
      console.error('Failed to parse Excel file:', err);
      alert('Could not read Excel file. Please ensure it is a valid .xlsx or .csv file.');
    } finally {
      setIsParsing(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult || !currentGroup) return;
    setIsImporting(true);

    try {
      let importedMembersCount = 0;
      let importedTxnsCount = 0;

      // 1. Import new members (skipping duplicates)
      const memberRowsToImport = importResult.validRows.filter(
        r => r.kind === 'member' && !r.isDuplicate && r.data.name
      );

      for (const row of memberRowsToImport) {
        await addMember(row.data.name!, row.data.phone);
        importedMembersCount++;
      }

      // Re-fetch or map members
      const updatedMembersMap = new Map<string, string>();
      members.forEach(m => updatedMembersMap.set(m.name.toLowerCase(), m.id));

      // 2. Import transactions (skipping duplicates)
      const txnRowsToImport = importResult.validRows.filter(
        r => r.kind === 'transaction' && !r.isDuplicate && r.data.amount
      );

      for (const row of txnRowsToImport) {
        let memberId: string | null = null;
        if (row.data.memberName) {
          const mLower = row.data.memberName.toLowerCase();
          // Find matching member
          const found = members.find(m => m.name.toLowerCase().includes(mLower));
          if (found) {
            memberId = found.id;
          } else {
            // Auto-create member if not found
            const newMem = await addMember(row.data.memberName);
            memberId = newMem.id;
          }
        }

        await addTransaction({
          group_id: currentGroup.id,
          member_id: memberId,
          type: (row.data.type as any) || 'saving',
          amount: Number(row.data.amount),
          interest_part: 0,
          principal_part: 0,
          category: row.data.category || null,
          note: row.data.note || undefined,
          entry_date: row.data.date || new Date().toISOString().split('T')[0],
        });
        importedTxnsCount++;
      }

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      setImportSuccessMessage(
        `Successfully imported ${importedMembersCount} members and ${importedTxnsCount} transactions!`
      );
      setIsImportModalOpen(false);
      setImportResult(null);

      setTimeout(() => setImportSuccessMessage(null), 6000);
    } catch (err) {
      console.error('Import error:', err);
      alert('Error saving imported data. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const getMonthLabel = (key: string) => {
    const parts = key.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const m = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
    return `${m} ${parts[0]}`;
  };

  return (
    <div className="space-y-5 pb-24 px-4 max-w-md mx-auto pt-2">
      {/* Page Title */}
      <div>
        <h2 className="font-heading font-extrabold text-xl text-teal-dark">
          {t('navReports')}
        </h2>
        <p className="text-xs text-muted font-medium">
          {t('reportsSubtitle')}
        </p>
      </div>

      {/* Success Notification Banner */}
      {importSuccessMessage && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {/* 4 BIG CARDS */}
      <div className="space-y-3.5">
        {/* CARD 1: DOWNLOAD EXCEL TEMPLATE */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-surface text-teal-dark flex items-center justify-center shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-base text-teal-dark leading-tight">
                {t('downloadTemplateTitle')}
              </h3>
              <p className="text-xs text-muted">
                {t('downloadTemplateDesc')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="w-full min-h-touch py-3 px-4 rounded-2xl bg-teal-surface hover:bg-teal-primary hover:text-white text-teal-dark font-heading font-bold text-xs border border-teal-light/30 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download .XLSX Template</span>
          </button>
        </div>

        {/* CARD 2: IMPORT FROM EXCEL WITH PREVIEW */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pastel-mint text-teal-dark flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-base text-foreground leading-tight">
                {t('importExcelTitle')}
              </h3>
              <p className="text-xs text-muted">
                {t('importExcelDesc')}
              </p>
            </div>
          </div>

          <label className="w-full min-h-touch py-3 px-4 rounded-2xl bg-teal-primary hover:bg-teal-dark active:scale-98 text-white font-heading font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isParsing ? 'Checking Excel...' : 'Choose Excel File (.xlsx / .csv)'}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isParsing}
            />
          </label>
        </div>

        {/* CARD 3: EXPORT MONTHLY REPORT */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pastel-sky text-blue-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-base text-blue-900 leading-tight">
                {t('exportMonthlyTitle')}
              </h3>
              <p className="text-xs text-muted">
                {t('exportMonthlyDesc')}
              </p>
            </div>
          </div>

          {/* Month Dropdown */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full min-h-touch pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-foreground focus:ring-2 focus:ring-teal-primary focus:outline-none appearance-none"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {getMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportMonthly}
              className="min-h-touch px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* CARD 4: EXPORT FULL GROUP REPORT (ALL-TIME) */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pastel-peach text-coral-hover flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-base text-coral-hover leading-tight">
                {t('exportFullTitle')}
              </h3>
              <p className="text-xs text-muted">
                {t('exportFullDesc')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportFull}
            className="w-full min-h-touch py-3 px-4 rounded-2xl bg-coral-primary hover:bg-coral-hover active:scale-98 text-white font-heading font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Official Master Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* IMPORT PREVIEW MODAL */}
      {isImportModalOpen && importResult && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 border border-teal-light/20">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-dark font-heading font-bold text-base">
                <FileCheck className="w-5 h-5 text-teal-primary" />
                <span>Excel Import Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted">
              File: <strong className="text-foreground">{importResult.fileName}</strong> ({importResult.totalRows} rows evaluated)
            </p>

            {/* Metric Pills */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="block font-heading font-extrabold text-base">{importResult.validRows.length}</span>
                <span className="text-[10px] font-bold">Valid Rows</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800">
                <span className="block font-heading font-extrabold text-base">{importResult.duplicateCount}</span>
                <span className="text-[10px] font-bold">Duplicates</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-800">
                <span className="block font-heading font-extrabold text-base">{importResult.errorRows.length}</span>
                <span className="text-[10px] font-bold">Errors</span>
              </div>
            </div>

            {/* PREVIEW LIST */}
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {/* Error Rows First */}
              {importResult.errorRows.map((err, idx) => (
                <div
                  key={`err-${idx}`}
                  className="p-3 rounded-2xl bg-red-50/80 border border-red-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-red-700 font-bold">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span>Row {err.rowIndex} ({err.sheetName})</span>
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-md bg-red-200/60 text-red-900">
                      Error
                    </span>
                  </div>
                  <p className="text-red-900 font-medium">
                    Reason: {err.errorMessage}
                  </p>
                </div>
              ))}

              {/* Valid Rows */}
              {importResult.validRows.map((row, idx) => (
                <div
                  key={`val-${idx}`}
                  className={`p-3 rounded-2xl border text-xs space-y-1 ${
                    row.isDuplicate
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-foreground">
                      {row.isDuplicate ? (
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      <span>Row {row.rowIndex} • {row.kind === 'member' ? row.data.name : row.data.memberName || 'Expense'}</span>
                    </span>

                    <span
                      className={`text-[10px] uppercase px-1.5 py-0.5 rounded-md ${
                        row.isDuplicate
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      {row.isDuplicate ? 'Duplicate (Skip)' : 'Valid'}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted flex items-center justify-between">
                    <span>
                      {row.kind === 'member'
                        ? `Phone: ${row.data.phone || '-'}`
                        : `${row.data.type?.toUpperCase()} • ${formatINR(row.data.amount)}`}
                    </span>
                    <span>{row.data.date || ''}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirm Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-1/3 min-h-touch py-3 rounded-2xl bg-gray-100 text-foreground font-heading font-bold text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isImporting || importResult.validRows.length === 0}
                onClick={handleConfirmImport}
                className="w-2/3 min-h-touch py-3 rounded-2xl bg-teal-primary hover:bg-teal-dark active:scale-98 text-white font-heading font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isImporting ? 'Saving to Database...' : 'Confirm Import'}</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
