import Dexie, { type Table } from 'dexie';
import { Group, Member, Loan, Transaction, SMSLog } from '../types';
import { DEMO_GROUP, DEMO_MEMBERS, DEMO_LOANS, DEMO_TRANSACTIONS } from './demoData';

export interface AppSetting {
  key: string;
  value: string;
}

export class BachatGhatDB extends Dexie {
  groups!: Table<Group, string>;
  members!: Table<Member, string>;
  loans!: Table<Loan, string>;
  transactions!: Table<Transaction, string>;
  sms_log!: Table<SMSLog, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('BachatGhatTrackerDB');
    this.version(1).stores({
      groups: 'id, group_code, created_by',
      members: 'id, group_id, name, passbook_token, is_active',
      loans: 'id, group_id, member_id, status, start_date',
      transactions: 'id, group_id, member_id, type, entry_date, deleted_at, is_pending_sync',
      sms_log: 'id, group_id, sent_at',
      settings: 'key',
    });
  }
}

export const db = new BachatGhatDB();

/**
 * Seed or reset the demo data in local IndexedDB
 */
export async function seedDemoDataToIndexedDB(): Promise<void> {
  await db.transaction('rw', db.groups, db.members, db.loans, db.transactions, async () => {
    // 1. Put demo group
    await db.groups.put(DEMO_GROUP);

    // 2. Put demo members
    await db.members.bulkPut(DEMO_MEMBERS);

    // 3. Put demo loans
    await db.loans.bulkPut(DEMO_LOANS);

    // 4. Put demo transactions
    await db.transactions.bulkPut(DEMO_TRANSACTIONS);
  });
}

/**
 * Check if demo data exists in IndexedDB
 */
export async function hasDemoData(): Promise<boolean> {
  const group = await db.groups.get(DEMO_GROUP.id);
  return !!group;
}
