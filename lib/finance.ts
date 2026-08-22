export const categories = [
  'Income',
  'Food & dining',
  'Bills & utilities',
  'Travel',
  'Shopping',
  'Health',
  'Entertainment',
  'Transfers',
  'Other',
] as const;

export type Category = (typeof categories)[number];

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: Category;
  source: string;
  balance?: number;
};

export type FinanceSummary = {
  income: number;
  spending: number;
  saved: number;
  savingsRate: number;
  trackedBalance: number;
  hasReportedBalance: boolean;
  runwayDays: number;
  currentMonth: string;
};

const categoryRules: Array<[Category, RegExp]> = [
  ['Income', /salary|payroll|interest credit|cashback|refund|dividend/i],
  ['Food & dining', /swiggy|zomato|restaurant|cafe|coffee|food|bakery|domino|mcdonald|starbucks/i],
  ['Bills & utilities', /electric|airtel|jio|vi prepaid|broadband|water bill|gas bill|recharge|insurance|rent|maintenance|bescom|tata power/i],
  ['Travel', /uber|ola|rapido|irctc|railway|flight|air india|indigo|metro|petrol|fuel|makemytrip|hotel/i],
  ['Shopping', /amazon|flipkart|myntra|ajio|shopping|retail|dmart|reliance fresh|ikea/i],
  ['Health', /pharmacy|apollo|1mg|hospital|clinic|doctor|medical|practo/i],
  ['Entertainment', /netflix|spotify|hotstar|cinema|bookmyshow|youtube|prime video|gaming/i],
  ['Transfers', /self transfer|transfer to|bank transfer|neft|imps|rtgs|wallet load/i],
];

export function categorise(description: string, amount: number): Category {
  if (amount > 0 && !/refund|cashback/i.test(description)) return 'Income';
  return categoryRules.find(([, pattern]) => pattern.test(description))?.[0] ?? 'Other';
}

export function inferSource(description: string): string {
  if (/google\s?pay|gpay/i.test(description)) return 'Google Pay';
  if (/phonepe/i.test(description)) return 'PhonePe';
  if (/paytm/i.test(description)) return 'Paytm';
  if (/amazon\s?pay/i.test(description)) return 'Amazon Pay';
  if (/bhim/i.test(description)) return 'BHIM';
  if (/upi/i.test(description)) return 'UPI / bank';
  if (/visa|mastercard|pos|card/i.test(description)) return 'Card';
  return 'Bank account';
}

export function formatMoney(value: number, compact = false): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);
}

function cleanAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const negative = /^\(.*\)$/.test(raw) || /\bdr\b/i.test(raw) || raw.startsWith('-');
  const number = Number(raw.replace(/[₹,$()\s]|\b(?:cr|dr)\b/gi, '')) || 0;
  return negative ? -Math.abs(number) : number;
}

function parseDate(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const indian = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (indian) {
    const year = indian[3].length === 2 ? `20${indian[3]}` : indian[3];
    return `${year}-${indian[2].padStart(2, '0')}-${indian[1].padStart(2, '0')}`;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const aliases = {
  date: ['date', 'transaction date', 'txn date', 'value date', 'timestamp', 'time'],
  description: ['description', 'narration', 'remarks', 'merchant', 'details', 'transaction details', 'note'],
  amount: ['amount', 'transaction amount', 'txn amount', 'value'],
  debit: ['debit', 'withdrawal', 'withdrawal amount', 'debit amount', 'dr'],
  credit: ['credit', 'deposit', 'deposit amount', 'credit amount', 'cr'],
  type: ['type', 'transaction type', 'dr/cr', 'credit/debit'],
  balance: ['balance', 'closing balance', 'available balance'],
  source: ['source', 'app', 'payment app', 'payment mode', 'channel'],
};

function findIndex(headers: string[], choices: string[]): number {
  return headers.findIndex((header) => choices.includes(header));
}

type ImportedRecord = Record<string, unknown>;

function recordsToTransactions(records: ImportedRecord[], filename: string): Transaction[] {
  if (!records.length) return [];
  const keys = Object.keys(records[0]);
  const lowerKeys = keys.map((key) => key.trim().toLowerCase());
  const indexFor = (choices: string[]) => findIndex(lowerKeys, choices);
  const keyAt = (index: number) => index >= 0 ? keys[index] : '';
  const dateKey = keyAt(indexFor(aliases.date));
  const descriptionKey = keyAt(indexFor(aliases.description));
  const amountKey = keyAt(indexFor(aliases.amount));
  const debitKey = keyAt(indexFor(aliases.debit));
  const creditKey = keyAt(indexFor(aliases.credit));
  const typeKey = keyAt(indexFor(aliases.type));
  const balanceKey = keyAt(indexFor(aliases.balance));
  const sourceKey = keyAt(indexFor(aliases.source));

  if (!dateKey || !descriptionKey || (!amountKey && !debitKey && !creditKey)) {
    throw new Error('Could not identify date, description, and amount columns. Use the sample CSV format in the guide.');
  }

  return records.map((record, index) => {
    const date = parseDate(record[dateKey]);
    const description = String(record[descriptionKey] ?? '').trim();
    let amount = amountKey ? cleanAmount(record[amountKey]) : 0;
    const debit = debitKey ? Math.abs(cleanAmount(record[debitKey])) : 0;
    const credit = creditKey ? Math.abs(cleanAmount(record[creditKey])) : 0;
    const type = typeKey ? String(record[typeKey] ?? '') : '';
    if (debit || credit) amount = credit || -debit;
    else if (/debit|withdrawal|\bdr\b/i.test(type)) amount = -Math.abs(amount);
    else if (/credit|deposit|\bcr\b/i.test(type)) amount = Math.abs(amount);
    return {
      id: `import-${Date.now()}-${index}`,
      date,
      description: description || 'Unlabelled transaction',
      amount,
      balance: balanceKey && record[balanceKey] !== '' ? cleanAmount(record[balanceKey]) : undefined,
      category: categorise(description, amount),
      source: sourceKey ? String(record[sourceKey] || inferSource(description)) : inferSource(description),
    } satisfies Transaction;
  }).filter((transaction) => transaction.date && transaction.amount !== 0);
}

export function parseTransactionFile(text: string, filename: string): Transaction[] {
  if (filename.toLowerCase().endsWith('.json')) {
    const payload = JSON.parse(text) as unknown;
    const records = Array.isArray(payload) ? payload : (payload as { transactions?: ImportedRecord[] }).transactions;
    if (!Array.isArray(records)) throw new Error('JSON must contain an array of transactions.');
    return recordsToTransactions(records as ImportedRecord[], filename);
  }
  const rows = parseCsvRows(text.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('The CSV file does not contain transaction rows.');
  const [headers, ...values] = rows;
  return recordsToTransactions(values.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))), filename);
}

function isoDate(monthOffset: number, day: number): string {
  const date = new Date(2026, 7 + monthOffset, day, 12);
  return date.toISOString().slice(0, 10);
}

export function createSampleTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const add = (month: number, day: number, description: string, amount: number, source: string) => {
    transactions.push({ id: `demo-${month}-${day}-${transactions.length}`, date: isoDate(month, day), description, amount, source, category: categorise(description, amount) });
  };
  [-2, -1, 0].forEach((month) => {
    add(month, 1, 'SALARY CREDIT - NORTHSTAR LABS', month === 0 ? 96000 : 90000, 'HDFC Bank');
    add(month, 2, 'UPI RENT TRANSFER TO LANDLORD', -24000, 'Google Pay');
    add(month, 4, 'BESCOM ELECTRICITY BILL', -(1700 + (month + 2) * 180), 'PhonePe');
    add(month, 5, 'AIRTEL BROADBAND RECHARGE', -1199, 'Paytm');
    add(month, 7, 'NETFLIX MONTHLY', -649, 'Card');
    add(month, 8, 'SWIGGY ORDER', -(420 + (month + 2) * 90), 'Google Pay');
    add(month, 10, 'UBER INDIA', -(260 + (month + 2) * 30), 'PhonePe');
    add(month, 12, 'DMART GROCERY', -(3500 + (month + 2) * 220), 'Card');
    add(month, 14, 'ZOMATO ORDER', -(510 + (month + 2) * 50), 'Paytm');
    add(month, 16, 'APOLLO PHARMACY', -(640 + (month + 2) * 80), 'Google Pay');
    add(month, 18, 'AMAZON RETAIL PURCHASE', -(1800 + (month + 2) * 300), 'Amazon Pay');
    add(month, 20, 'COFFEE DAY', -(280 + (month + 2) * 20), 'BHIM');
    add(month, 21, 'JIO MOBILE RECHARGE', -749, 'PhonePe');
  });
  add(0, 9, 'SWIGGY LATE NIGHT ORDER', -1680, 'Google Pay');
  add(0, 13, 'MAKEMYTRIP WEEKEND HOTEL', -9200, 'UPI / bank');
  add(0, 19, 'BOOKMYSHOW CINEMA', -1280, 'Paytm');
  add(0, 22, 'INTEREST CREDIT', 530, 'HDFC Bank');

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  let balance = 51980;
  sorted.forEach((transaction) => { balance += transaction.amount; transaction.balance = balance; });
  return sorted.sort((a, b) => b.date.localeCompare(a.date));
}

function latestDate(transactions: Transaction[]): Date {
  return new Date([...transactions].sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? '2026-08-22');
}

export function monthKey(date: string): string { return date.slice(0, 7); }

export function summarise(transactions: Transaction[]): FinanceSummary {
  if (!transactions.length) return { income: 0, spending: 0, saved: 0, savingsRate: 0, trackedBalance: 0, hasReportedBalance: false, runwayDays: 0, currentMonth: '' };
  const currentMonth = monthKey(latestDate(transactions).toISOString());
  const current = transactions.filter((transaction) => monthKey(transaction.date) === currentMonth);
  const income = current.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0);
  const spending = Math.abs(current.filter((transaction) => transaction.amount < 0 && transaction.category !== 'Transfers').reduce((sum, transaction) => sum + transaction.amount, 0));
  const saved = income - spending;
  const reported = transactions.find((transaction) => transaction.balance !== undefined)?.balance;
  const trackedBalance = reported ?? transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const dailySpend = spending / Math.max(1, latestDate(transactions).getDate());
  return {
    income, spending, saved,
    savingsRate: income ? (saved / income) * 100 : 0,
    trackedBalance,
    hasReportedBalance: reported !== undefined,
    runwayDays: dailySpend ? Math.max(0, Math.round(trackedBalance / dailySpend)) : 0,
    currentMonth,
  };
}

export function categoryTotals(transactions: Transaction[], selectedMonth?: string): Array<{ category: Category; amount: number; count: number }> {
  const month = selectedMonth ?? summarise(transactions).currentMonth;
  return categories.map((category) => {
    const matches = transactions.filter((transaction) => monthKey(transaction.date) === month && transaction.category === category && transaction.amount < 0);
    return { category, amount: Math.abs(matches.reduce((sum, transaction) => sum + transaction.amount, 0)), count: matches.length };
  }).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

export function unusualTransactions(transactions: Transaction[]): Array<Transaction & { reason: string }> {
  const expenses = transactions.filter((transaction) => transaction.amount < 0 && !['Transfers', 'Income'].includes(transaction.category));
  return expenses.map((transaction) => {
    const peers = expenses.filter((peer) => peer.category === transaction.category && peer.id !== transaction.id).map((peer) => Math.abs(peer.amount));
    const typical = median(peers);
    const amount = Math.abs(transaction.amount);
    const unusual = peers.length >= 2 && amount >= Math.max(typical * 2.35, 1200);
    return unusual ? { ...transaction, reason: `${Math.round(amount / Math.max(typical, 1))}× the typical ${transaction.category.toLowerCase()} transaction` } : null;
  }).filter((transaction): transaction is Transaction & { reason: string } => Boolean(transaction)).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
}

export function monthlyFlow(transactions: Transaction[]): Array<{ month: string; income: number; spending: number; net: number }> {
  const buckets = new Map<string, { income: number; spending: number }>();
  transactions.forEach((transaction) => {
    const key = monthKey(transaction.date);
    const bucket = buckets.get(key) ?? { income: 0, spending: 0 };
    if (transaction.amount > 0) bucket.income += transaction.amount;
    else if (transaction.category !== 'Transfers') bucket.spending += Math.abs(transaction.amount);
    buckets.set(key, bucket);
  });
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, values]) => ({ month, ...values, net: values.income - values.spending }));
}

export function forecast(transactions: Transaction[]): { income: number; spending: number; net: number; confidence: string; recurring: number } {
  const flows = monthlyFlow(transactions);
  const recent = flows.slice(-3);
  const average = (key: 'income' | 'spending') => recent.length ? recent.reduce((sum, month) => sum + month[key], 0) / recent.length : 0;
  const descriptions = new Map<string, number>();
  transactions.filter((transaction) => transaction.amount < 0).forEach((transaction) => descriptions.set(transaction.description, (descriptions.get(transaction.description) ?? 0) + 1));
  const recurring = [...descriptions.values()].filter((count) => count >= 2).length;
  const income = average('income');
  const spending = average('spending');
  return { income, spending, net: income - spending, confidence: recent.length >= 3 ? 'Medium' : 'Low', recurring };
}

export function buildSavingsActions(transactions: Transaction[]): Array<{ title: string; detail: string; amount: number; category: Category }> {
  const flexible = categoryTotals(transactions).filter((item) => ['Food & dining', 'Shopping', 'Travel', 'Entertainment', 'Other'].includes(item.category));
  return flexible.slice(0, 3).map((item, index) => {
    const rates = [0.15, 0.12, 0.1];
    const amount = Math.round((item.amount * rates[index]) / 50) * 50;
    return {
      title: `Set a ${Math.round(rates[index] * 100)}% ${item.category.toLowerCase()} guardrail`,
      detail: `Based on ${item.count} transactions this month. You stay in control; no payment is blocked.`,
      amount,
      category: item.category,
    };
  });
}
