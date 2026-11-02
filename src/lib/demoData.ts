import { Group, Member, Loan, Transaction } from '../types';

export const DEMO_GROUP_ID = 'a0000000-0000-0000-0000-000000000001';

export const DEMO_GROUP: Group = {
  id: DEMO_GROUP_ID,
  name: 'जय भवानी महिला बचत गट (Jai Bhavani Mahila Bachat Ghat)',
  village: 'येरला (Yerla)',
  panchayat: 'येरला ग्रामपंचायत (Yerla Gram Panchayat)',
  started_date: '2026-05-10',
  monthly_saving_amount: 100,
  monthly_interest_rate: 2.0,
  monthly_late_fine: 10,
  meeting_day: 10,
  group_code: 'JB0001',
  created_by: null,
};

export const DEMO_MEMBERS: Member[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    group_id: DEMO_GROUP_ID,
    name: 'सुनिता ताई शिंदे (Sunita Shinde)',
    phone: '9822100001',
    passbook_token: 'demo-sunita-passbook-token-01',
    is_active: true,
    joined_date: '2026-05-10',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    group_id: DEMO_GROUP_ID,
    name: 'अनुसया बाई पाटील (Anusaya Patil)',
    phone: '9822100002',
    passbook_token: 'demo-anusaya-passbook-token-02',
    is_active: true,
    joined_date: '2026-05-10',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    group_id: DEMO_GROUP_ID,
    name: 'मंगल ताई गायकवाड (Mangal Gaikwad)',
    phone: '9822100003',
    passbook_token: 'demo-mangal-passbook-token-03',
    is_active: true,
    joined_date: '2026-05-10',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    group_id: DEMO_GROUP_ID,
    name: 'शकुंतला कदम (Shakuntala Kadam)',
    phone: '9822100004',
    passbook_token: 'demo-shakuntala-passbook-token-04',
    is_active: true,
    joined_date: '2026-05-10',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    group_id: DEMO_GROUP_ID,
    name: 'शोभा जाधव (Shobha Jadhav)',
    phone: '9822100005',
    passbook_token: 'demo-shobha-passbook-token-05',
    is_active: true,
    joined_date: '2026-05-10',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000006',
    group_id: DEMO_GROUP_ID,
    name: 'रेखा मोरे (Rekha More)',
    phone: '9822100006',
    passbook_token: 'demo-rekha-passbook-token-06',
    is_active: true,
    joined_date: '2026-05-10',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000007',
    group_id: DEMO_GROUP_ID,
    name: 'विमल चव्हाण (Vimal Chavan)',
    phone: '9822100007',
    passbook_token: 'demo-vimal-passbook-token-07',
    is_active: true,
    joined_date: '2026-05-10',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000008',
    group_id: DEMO_GROUP_ID,
    name: 'उज्वला पवार (Ujjwala Pawar)',
    phone: '9822100008',
    passbook_token: 'demo-ujjwala-passbook-token-08',
    is_active: true,
    joined_date: '2026-05-10',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000009',
    group_id: DEMO_GROUP_ID,
    name: 'कौशल्या देशमुख (Kaushalya Deshmukh)',
    phone: '9822100009',
    passbook_token: 'demo-kaushalya-passbook-token-09',
    is_active: true,
    joined_date: '2026-05-10',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000010',
    group_id: DEMO_GROUP_ID,
    name: 'पार्वती कांबळे (Parvati Kamble)',
    phone: '9822100010',
    passbook_token: 'demo-parvati-passbook-token-10',
    is_active: true,
    joined_date: '2026-05-10',
  },
];

export const DEMO_LOANS: Loan[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    group_id: DEMO_GROUP_ID,
    member_id: 'b0000000-0000-0000-0000-000000000003', // Mangal Gaikwad
    principal_amount: 5000,
    monthly_interest_rate: 2.0,
    start_date: '2026-06-10',
    purpose: 'Farming',
    status: 'active',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    group_id: DEMO_GROUP_ID,
    member_id: 'b0000000-0000-0000-0000-000000000004', // Shakuntala Kadam
    principal_amount: 3000,
    monthly_interest_rate: 2.0,
    start_date: '2026-08-10',
    purpose: 'Business',
    status: 'active',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    group_id: DEMO_GROUP_ID,
    member_id: 'b0000000-0000-0000-0000-000000000005', // Shobha Jadhav
    principal_amount: 4000,
    monthly_interest_rate: 2.0,
    start_date: '2026-09-10',
    purpose: 'Education',
    status: 'active',
  },
];

export function generateDemoTransactions(): Transaction[] {
  const txns: Transaction[] = [];
  const memberIds = DEMO_MEMBERS.map(m => m.id);

  // 6 months of savings (May 2026 - Oct 2026) for each member
  const months = ['2026-05-10', '2026-06-10', '2026-07-10', '2026-08-10', '2026-09-10', '2026-10-10'];
  let counter = 1;

  for (const date of months) {
    for (const mId of memberIds) {
      txns.push({
        id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
        group_id: DEMO_GROUP_ID,
        member_id: mId,
        type: 'saving',
        amount: 100,
        interest_part: 0,
        principal_part: 0,
        entry_date: date,
        note: 'मासिक बचत जमा',
      });
    }
  }

  // Loan 1 given: Mangal Gaikwad ₹5000 in June 2026
  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: DEMO_MEMBERS[2].id,
    type: 'loan_given',
    amount: 5000,
    interest_part: 0,
    principal_part: 0,
    loan_id: DEMO_LOANS[0].id,
    entry_date: '2026-06-10',
    note: 'शेती व बियाणे खरेदी कर्ज',
  });

  // Repayments for Loan 1:
  // July: ₹100 interest
  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: DEMO_MEMBERS[2].id,
    type: 'loan_repayment',
    amount: 100,
    interest_part: 100,
    principal_part: 0,
    loan_id: DEMO_LOANS[0].id,
    entry_date: '2026-07-10',
    note: 'जुलै व्याज जमा',
  });

  // August: ₹100 interest + ₹1000 principal
  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: DEMO_MEMBERS[2].id,
    type: 'loan_repayment',
    amount: 1100,
    interest_part: 100,
    principal_part: 1000,
    loan_id: DEMO_LOANS[0].id,
    entry_date: '2026-08-10',
    note: 'ऑगस्ट हप्ता: व्याज ₹100 + मुद्दल ₹1000',
  });

  // September: ₹80 interest (2% of remaining 4000)
  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: DEMO_MEMBERS[2].id,
    type: 'loan_repayment',
    amount: 80,
    interest_part: 80,
    principal_part: 0,
    loan_id: DEMO_LOANS[0].id,
    entry_date: '2026-09-10',
    note: 'सप्टेंबर व्याज जमा',
  });

  // Loan 2 given: Shakuntala Kadam ₹3000 in August
  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: DEMO_MEMBERS[3].id,
    type: 'loan_given',
    amount: 3000,
    interest_part: 0,
    principal_part: 0,
    loan_id: DEMO_LOANS[1].id,
    entry_date: '2026-08-10',
    note: 'किराणा दुकान व्यवसाय कर्ज',
  });

  // Repayment for Loan 2 in September: ₹60 interest
  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: DEMO_MEMBERS[3].id,
    type: 'loan_repayment',
    amount: 60,
    interest_part: 60,
    principal_part: 0,
    loan_id: DEMO_LOANS[1].id,
    entry_date: '2026-09-10',
    note: 'सप्टेंबर व्याज जमा',
  });

  // Loan 3 given: Shobha Jadhav ₹4000 in September
  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: DEMO_MEMBERS[4].id,
    type: 'loan_given',
    amount: 4000,
    interest_part: 0,
    principal_part: 0,
    loan_id: DEMO_LOANS[2].id,
    entry_date: '2026-09-10',
    note: 'मुलांच्या कॉलेज फीसाठी कर्ज',
  });

  // Group Expenses
  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: null,
    type: 'expense',
    amount: 150,
    interest_part: 0,
    principal_part: 0,
    category: 'Stationery',
    entry_date: '2026-05-10',
    note: 'वही, पासबुक व पेन खरेदी',
  });

  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: null,
    type: 'expense',
    amount: 200,
    interest_part: 0,
    principal_part: 0,
    category: 'Meeting',
    entry_date: '2026-07-10',
    note: 'मासिक बैठक चहा-नाश्ता',
  });

  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: null,
    type: 'expense',
    amount: 50,
    interest_part: 0,
    principal_part: 0,
    category: 'Bank Charges',
    entry_date: '2026-08-15',
    note: 'बँक पासबुक नोंदणी शुल्क',
  });

  // Late Fine
  txns.push({
    id: `d0000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`,
    group_id: DEMO_GROUP_ID,
    member_id: DEMO_MEMBERS[5].id, // Rekha More
    type: 'fine',
    amount: 10,
    interest_part: 0,
    principal_part: 0,
    category: 'Meeting Late',
    entry_date: '2026-08-10',
    note: 'बैठकीस उशिरा आल्याबद्दल दंड',
  });

  return txns;
}

export const DEMO_TRANSACTIONS: Transaction[] = generateDemoTransactions();
