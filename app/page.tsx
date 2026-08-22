'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import {
  buildSavingsActions,
  categories,
  categoryTotals,
  createSampleTransactions,
  forecast,
  formatMoney,
  monthlyFlow,
  parseTransactionFile,
  summarise,
  Transaction,
  unusualTransactions,
  type Category,
} from '../lib/finance';

type View = 'Overview' | 'Transactions' | 'Cash flow' | 'Savings plan' | 'Data access';

const navItems: Array<{ label: View; short: string }> = [
  { label: 'Overview', short: 'OV' },
  { label: 'Transactions', short: 'TX' },
  { label: 'Cash flow', short: 'CF' },
  { label: 'Savings plan', short: 'SP' },
  { label: 'Data access', short: 'DA' },
];

const sourceDetails = [
  { name: 'Any bank account', mark: 'BK', tone: 'bank', status: 'Best coverage', detail: 'Import a bank CSV to capture UPI transactions regardless of which payment app initiated them.' },
  { name: 'Google Pay', mark: 'GP', tone: 'gpay', status: 'Statement / Takeout', detail: 'Use a Google Pay statement or Google Takeout export. Google Pay history covers only Google Pay activity.' },
  { name: 'PhonePe, Paytm & others', mark: 'UP', tone: 'phonepe', status: 'Statement import', detail: 'Export transaction history from the app or use the linked bank statement for complete coverage.' },
  { name: 'Account Aggregator', mark: 'AA', tone: 'aa', status: 'Production route', detail: 'A consent-based regulated integration for supported financial accounts—not direct access to every UPI app.' },
];

function formatMonth(value: string): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(`${value}-01T12:00:00`));
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

export default function Home() {
  const [view, setView] = useState<View>('Overview');
  const [transactions, setTransactions] = useState<Transaction[]>(() => createSampleTransactions());
  const [showImport, setShowImport] = useState(false);
  const [showSource, setShowSource] = useState<(typeof sourceDetails)[number] | null>(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All');
  const [goal, setGoal] = useState(300000);
  const [targetDate, setTargetDate] = useState('2027-08');
  const [planAccepted, setPlanAccepted] = useState(false);

  const summary = useMemo(() => summarise(transactions), [transactions]);
  const totals = useMemo(() => categoryTotals(transactions), [transactions]);
  const anomalies = useMemo(() => unusualTransactions(transactions), [transactions]);
  const flows = useMemo(() => monthlyFlow(transactions), [transactions]);
  const projection = useMemo(() => forecast(transactions), [transactions]);
  const savingsActions = useMemo(() => buildSavingsActions(transactions), [transactions]);
  const sources = useMemo(() => new Set(transactions.map((transaction) => transaction.source)).size, [transactions]);
  const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
    const matchesSearch = `${transaction.description} ${transaction.source}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || transaction.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [transactions, search, categoryFilter]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseTransactionFile(await file.text(), file.name);
      if (!imported.length) throw new Error('No valid transaction rows were found.');
      setTransactions(imported.sort((a, b) => b.date.localeCompare(a.date)));
      setShowImport(false);
      setView('Overview');
      notify(`${imported.length} transactions imported locally from ${file.name}.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not read this file.');
    } finally {
      event.target.value = '';
    }
  }

  function updateCategory(id: string, category: Category) {
    setTransactions((items) => items.map((item) => item.id === id ? { ...item, category } : item));
    notify('Category updated on this device.');
  }

  function restoreSample() {
    setTransactions(createSampleTransactions());
    setShowImport(false);
    setView('Overview');
    notify('Fictional demo transactions restored.');
  }

  function exportCsv(sampleOnly = false) {
    const rows = [['Date', 'Description', 'Amount', 'Category', 'Source', 'Balance']];
    (sampleOnly ? createSampleTransactions().slice(0, 8) : transactions).forEach((transaction) => rows.push([
      transaction.date, transaction.description, String(transaction.amount), transaction.category, transaction.source, String(transaction.balance ?? ''),
    ]));
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = sampleOnly ? 'paisapilot-sample.csv' : 'paisapilot-transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function inspectAnomaly(transaction: Transaction) {
    setView('Transactions');
    setSearch(transaction.description);
  }

  const goalMonths = Math.max(1, Math.round((new Date(`${targetDate}-01`).getTime() - new Date('2026-08-01').getTime()) / 2629800000));
  const requiredMonthly = Math.max(0, (goal - Math.max(0, summary.trackedBalance)) / goalMonths);
  const actionSavings = savingsActions.reduce((sum, action) => sum + action.amount, 0);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView('Overview')} type="button"><span className="brand-mark">₹</span><span>PaisaPilot</span></button>
        <p className="nav-label">Workspace</p>
        <nav aria-label="Finance sections">
          {navItems.map((item, index) => (
            <button className={view === item.label ? 'nav-item active' : 'nav-item'} key={item.label} onClick={() => setView(item.label)} type="button">
              <span>{item.short}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="privacy-card">
          <span className="privacy-icon">✓</span>
          <strong>Private by default</strong>
          <p>Your imported files stay in this browser session. PaisaPilot never asks for a UPI PIN.</p>
        </div>
        <div className="profile"><span>AK</span><div><strong>Arjun Kumar</strong><small>Fictional demo profile</small></div></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">Saturday, 22 August</p><h1>{view === 'Overview' ? 'Good morning, Arjun.' : view}</h1></div>
          <div className="top-actions"><span className="demo-badge">Demo · no live accounts</span><span className="sync-state"><i />{sources} sources tracked</span><button className="import-button" onClick={() => setShowImport(true)} type="button">Import transactions <b>＋</b></button></div>
        </header>

        {view === 'Overview' && (
          <div className="dashboard">
            <section className="hero-balance">
              <div className="hero-copy"><p className="eyebrow light">{summary.hasReportedBalance ? 'Latest reported balance' : 'Tracked net movement'}</p><h2>{formatMoney(summary.trackedBalance)}</h2><p className="balance-change"><span>{summary.saved >= 0 ? '↑' : '↓'} {Math.abs(summary.savingsRate).toFixed(1)}%</span> savings rate this month</p></div>
              <div className="runway"><span>Estimated cash runway</span><strong>{summary.runwayDays} days</strong><div className="runway-track"><i style={{ width: `${Math.min(100, summary.runwayDays / 0.75)}%` }} /></div><small>Estimate based on current-month spending pace</small></div>
              <div className="bars" aria-label="Monthly net cash trend">
                {flows.map((flow) => <i key={flow.month} style={{height: `${Math.max(16, Math.min(105, (Math.abs(flow.net) / Math.max(...flows.map((item) => Math.abs(item.net)), 1)) * 105))}px`}} />)}
              </div>
            </section>

            <section className="metrics" aria-label="Monthly summary">
              <article><span>Income</span><strong>{formatMoney(summary.income)}</strong><small>{transactions.filter((transaction) => transaction.amount > 0 && transaction.date.startsWith(summary.currentMonth)).length} credits</small></article>
              <article><span>Spent</span><strong>{formatMoney(summary.spending)}</strong><small>{summary.income ? `${Math.round(summary.spending / summary.income * 100)}% of income` : 'No income found'}</small></article>
              <article><span>Saved</span><strong>{formatMoney(summary.saved)}</strong><small className={summary.saved >= 0 ? 'positive' : 'negative'}>{summary.savingsRate.toFixed(1)}% savings rate</small></article>
            </section>

            <div className="content-grid">
              <section className="agent-card">
                <div className="agent-heading"><span className="agent-orb">AI</span><div><p className="eyebrow light">Your money briefing</p><strong>{anomalies.length ? `${anomalies.length} unusual ${anomalies.length === 1 ? 'payment' : 'payments'} found` : 'Your spending looks steady'}</strong></div><span className="freshness">Updated now</span></div>
                {anomalies[0] ? <p className="insight"><b>{anomalies[0].description}</b> was {anomalies[0].reason}. It may be expected—review it before changing your plan.</p> : <p className="insight">No transaction crossed the local anomaly threshold. Continue reviewing statements regularly.</p>}
                <div className="agent-action"><div><span>Largest flagged payment</span><strong>{anomalies[0] ? formatMoney(Math.abs(anomalies[0].amount)) : 'None'}</strong></div><button onClick={() => anomalies[0] && inspectAnomaly(anomalies[0])} type="button">Review insight →</button></div>
              </section>

              <section className="category-card">
                <div className="section-heading"><div><p className="eyebrow">This month</p><h3>Where your money went</h3></div><button onClick={() => setView('Transactions')} type="button">View all</button></div>
                <div className="category-list">
                  {totals.slice(0, 3).map((item, index) => <div key={item.category}><span className={`category-icon c${index}`}>{item.category.slice(0,2).toUpperCase()}</span><p><strong>{item.category}</strong><small>{item.count} transactions</small></p><b>{formatMoney(item.amount)}</b></div>)}
                </div>
              </section>
            </div>

            <div className="secondary-grid">
              <section className="forecast-card">
                <div className="section-heading"><div><p className="eyebrow">Next 30 days</p><h3>Cash-flow forecast</h3></div><span className="confidence">{projection.confidence} confidence</span></div>
                <div className="forecast-number"><strong>{formatMoney(projection.net)}</strong><span>projected surplus</span></div>
                <div className="forecast-track"><i style={{width:`${Math.min(100, projection.income ? projection.spending / projection.income * 100 : 0)}%`}} /></div>
                <p>Based on three monthly cycles and {projection.recurring} recurring payment patterns. This is an estimate, not a guarantee.</p>
                <button onClick={() => setView('Cash flow')} type="button">See forecast assumptions</button>
              </section>
              <section className="connections-card">
                <div className="section-heading"><div><p className="eyebrow">Data sources</p><h3>UPI coverage</h3></div><button onClick={() => setView('Data access')} type="button">How it works</button></div>
                <div className="source-stack"><span>GP</span><span>PP</span><span>PT</span><span>BK</span><b>＋</b></div>
                <strong>One bank statement can cover every linked UPI app.</strong>
                <p>Direct universal UPI-app access is not available. PaisaPilot uses exports now and consent-based regulated providers in production.</p>
                <button className="outline-button" onClick={() => setShowImport(true)} type="button">Add a statement</button>
              </section>
            </div>
          </div>
        )}

        {view === 'Transactions' && (
          <div className="dashboard subpage">
            <div className="page-intro"><div><p className="eyebrow">Review and correct</p><h2>All transactions</h2><p>Categories are suggested locally. You can override any result.</p></div><button className="outline-button" onClick={() => exportCsv()} type="button">Export CSV</button></div>
            <section className="filter-bar">
              <label><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Merchant, app, or note" /></label>
              <label><span>Category</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as 'All' | Category)}><option>All</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <div className="filter-stat"><span>Showing</span><strong>{filteredTransactions.length}</strong></div>
              {search && <button className="clear-button" onClick={() => setSearch('')} type="button">Clear search</button>}
            </section>
            <section className="transaction-table" aria-label="Imported transactions">
              <div className="table-head"><span>Date</span><span>Description</span><span>Source</span><span>Category</span><span>Amount</span></div>
              {filteredTransactions.slice(0, 60).map((transaction) => {
                const unusual = anomalies.some((item) => item.id === transaction.id);
                return <div className="table-row" key={transaction.id}>
                  <span className="date-cell">{shortDate(transaction.date)}</span>
                  <span className="merchant-cell"><strong>{transaction.description}</strong>{unusual && <small>Unusual amount · review</small>}</span>
                  <span><i className="source-dot" />{transaction.source}</span>
                  <span><select aria-label={`Category for ${transaction.description}`} value={transaction.category} onChange={(event) => updateCategory(transaction.id, event.target.value as Category)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></span>
                  <b className={transaction.amount > 0 ? 'credit' : 'debit'}>{transaction.amount > 0 ? '+' : '−'}{formatMoney(Math.abs(transaction.amount))}</b>
                </div>;
              })}
              {!filteredTransactions.length && <div className="empty-message">No transactions match these filters.</div>}
            </section>
          </div>
        )}

        {view === 'Cash flow' && (
          <div className="dashboard subpage">
            <div className="page-intro"><div><p className="eyebrow">Forward view</p><h2>Your next 30 days</h2><p>A simple rolling forecast based on the transaction history you provided.</p></div><span className="confidence large">{projection.confidence} confidence</span></div>
            <section className="forecast-hero">
              <div><span>Projected income</span><strong>{formatMoney(projection.income)}</strong></div><i>−</i><div><span>Projected spending</span><strong>{formatMoney(projection.spending)}</strong></div><i>=</i><div className="forecast-result"><span>Projected surplus</span><strong>{formatMoney(projection.net)}</strong></div>
            </section>
            <section className="chart-card">
              <div className="section-heading"><div><p className="eyebrow">Monthly comparison</p><h3>Income versus spending</h3></div><div className="legend"><span><i className="income-key" />Income</span><span><i className="spend-key" />Spending</span></div></div>
              <div className="flow-chart">
                {flows.map((flow) => { const scale = Math.max(...flows.flatMap((item) => [item.income, item.spending]), 1); return <div className="flow-month" key={flow.month}><div className="bar-pair"><i className="income-bar" style={{height:`${flow.income / scale * 175}px`}} /><i className="spend-bar" style={{height:`${flow.spending / scale * 175}px`}} /></div><strong>{formatMonth(flow.month).split(' ')[0]}</strong><small>{formatMoney(flow.net, true)} net</small></div>; })}
              </div>
            </section>
            <section className="assumption-card"><span className="assumption-icon">i</span><div><strong>How this forecast works</strong><p>It averages up to three monthly cycles, ignores self-transfers, and counts {projection.recurring} repeated merchant patterns. It cannot predict job changes, emergencies, refunds, investment returns, or future one-off purchases.</p></div></section>
          </div>
        )}

        {view === 'Savings plan' && (
          <div className="dashboard subpage">
            <div className="page-intro"><div><p className="eyebrow">Editable plan</p><h2>Turn a goal into monthly actions</h2><p>PaisaPilot suggests guardrails. It never moves money or blocks a payment.</p></div>{planAccepted && <span className="accepted-badge">✓ Saved on this device</span>}</div>
            <div className="goal-layout">
              <section className="goal-form-card">
                <p className="eyebrow">Your target</p><h3>Build a safety fund</h3>
                <label><span>Target amount</span><div className="rupee-input"><b>₹</b><input type="number" min="10000" step="5000" value={goal} onChange={(event) => setGoal(Number(event.target.value))} /></div></label>
                <label><span>Target month</span><input type="month" min="2026-09" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
                <div className="goal-summary"><span>Suggested monthly contribution</span><strong>{formatMoney(requiredMonthly)}</strong><small>Assumes the tracked balance is available for this goal. Adjust it for your real commitments.</small></div>
              </section>
              <section className="plan-card">
                <div className="section-heading"><div><p className="eyebrow">Personalised actions</p><h3>Make room without harsh cuts</h3></div><strong className="plan-total">+{formatMoney(actionSavings)}/mo</strong></div>
                <div className="plan-actions">{savingsActions.map((action, index) => <div key={action.category}><span>{index + 1}</span><p><strong>{action.title}</strong><small>{action.detail}</small></p><b>{formatMoney(action.amount)}</b></div>)}</div>
                <button className={planAccepted ? 'primary-action accepted' : 'primary-action'} onClick={() => { setPlanAccepted(!planAccepted); notify(planAccepted ? 'Plan removed.' : 'Savings plan saved locally. No money was moved.'); }} type="button">{planAccepted ? '✓ Plan accepted' : 'Accept this plan'}</button>
              </section>
            </div>
            <section className="disclaimer-card"><strong>Planning note</strong><p>This is an educational estimate, not investment, tax, credit, or financial advice. Keep essential expenses, debt obligations, insurance, and emergency needs in mind. Consult a qualified professional for decisions with significant consequences.</p></section>
          </div>
        )}

        {view === 'Data access' && (
          <div className="dashboard subpage">
            <div className="page-intro"><div><p className="eyebrow">Consent comes first</p><h2>How PaisaPilot can read payment data</h2><p>No scraping, no screen-reading, and no request for your UPI PIN or banking password.</p></div><button className="import-button" onClick={() => setShowImport(true)} type="button">Import a statement <b>＋</b></button></div>
            <section className="access-warning"><span>!</span><div><strong>There is no single personal-history API for every UPI app.</strong><p>The safest broad-coverage demo method is importing the linked bank statement. A real automatic product should use an authorised, consent-based provider such as India&apos;s Account Aggregator ecosystem where applicable.</p></div></section>
            <section className="source-grid">{sourceDetails.map((source) => <article key={source.name}><div className={`source-logo ${source.tone}`}>{source.mark}</div><span className="source-status">{source.status}</span><h3>{source.name}</h3><p>{source.detail}</p><button onClick={() => setShowSource(source)} type="button">See safe connection path →</button></article>)}</section>
            <section className="access-table-card">
              <div className="section-heading"><div><p className="eyebrow">Coverage guide</p><h3>Choose the right source</h3></div></div>
              <div className="access-table"><div className="access-head"><span>Method</span><span>Coverage</span><span>Automation</span><span>Production requirement</span></div><div><strong>Bank CSV</strong><span>UPI, cards, transfers for one account</span><span>Manual import</span><span>None for personal use</span></div><div><strong>Payment-app export</strong><span>That app&apos;s own activity only</span><span>Manual import</span><span>Follow app export terms</span></div><div><strong>Account Aggregator</strong><span>Supported financial accounts</span><span>Consent-based sync</span><span>Regulated/authorised ecosystem partner</span></div><div><strong>Screen scraping</strong><span>Unreliable and risky</span><span>Not supported</span><span>Do not use</span></div></div>
            </section>
          </div>
        )}

        <footer><span>PaisaPilot demo</span><p>Educational insights only · Read-only workflow · No payments are initiated</p></footer>
      </section>

      {showImport && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowImport(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="import-title"><button className="modal-close" onClick={() => setShowImport(false)} type="button" aria-label="Close">×</button><p className="eyebrow accent">Local import</p><h2 id="import-title">Add transaction history</h2><p className="modal-lead">Choose a CSV or JSON export. The file is analysed inside your browser session and is not uploaded to a PaisaPilot server.</p><label className="upload-zone"><input accept=".csv,.json,text/csv,application/json" onChange={importFile} type="file" /><span>↑</span><strong>Select a CSV or JSON statement</strong><small>Common bank headers such as Date, Narration, Debit, Credit, Amount, and Balance are detected automatically.</small></label><div className="modal-divider"><span>or</span></div><div className="sample-actions"><button className="primary-action" onClick={restoreSample} type="button">Use fictional demo data</button><button className="outline-button" onClick={() => exportCsv(true)} type="button">Download sample CSV</button></div><div className="security-note"><span>✓</span><p><strong>Never upload:</strong> UPI PINs, OTPs, card CVVs, passwords, Aadhaar numbers, or complete account credentials.</p></div></section></div>}

      {showSource && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSource(null); }}><section className="modal source-modal" role="dialog" aria-modal="true" aria-labelledby="source-title"><button className="modal-close" onClick={() => setShowSource(null)} type="button" aria-label="Close">×</button><div className={`source-logo ${showSource.tone}`}>{showSource.mark}</div><p className="eyebrow accent">{showSource.status}</p><h2 id="source-title">{showSource.name}</h2><p className="modal-lead">{showSource.detail}</p>{showSource.mark === 'AA' ? <ol><li>Your product becomes or partners with an eligible Financial Information User.</li><li>The customer approves a specific, time-limited consent artefact.</li><li>An authorised Account Aggregator retrieves supported information from Financial Information Providers.</li><li>The customer can review and revoke consent. Credentials are never shared with PaisaPilot.</li></ol> : <ol><li>Export transaction history from the payment app or linked bank.</li><li>Choose CSV or JSON where available.</li><li>Review the file and remove fields you do not want to analyse.</li><li>Import it locally and verify the detected categories.</li></ol>}<button className="primary-action" onClick={() => { setShowSource(null); setShowImport(true); }} type="button">Open local importer</button></section></div>}

      <div className={toast ? 'toast show' : 'toast'} role="status" aria-live="polite">{toast}</div>
    </main>
  );
}
