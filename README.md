# PaisaPilot — Personal Finance Agent

PaisaPilot is a privacy-first personal finance demo for Indian bank and UPI transaction data. It categorises transactions, flags unusual spending, forecasts monthly cash flow, and turns a savings goal into editable monthly actions.

It is a **read-only planning tool**. It never initiates payments, moves money, asks for a UPI PIN, or makes investment decisions.

## What works

- Imports CSV and JSON transaction exports inside the browser
- Recognises common bank and UPI narration formats
- Categorises income, food, bills, travel, shopping, health, entertainment, transfers, and other spending
- Lets the user correct any category
- Flags unusually large transactions relative to same-category history
- Forecasts the next 30 days from up to three monthly cycles
- Detects repeated merchant patterns
- Builds an editable savings goal and three spending guardrails
- Explains safe paths for Google Pay, PhonePe, Paytm, banks, and Account Aggregators
- Exports the normalised transaction table as CSV
- Includes 43 fictional transactions for a complete demonstration

## Important UPI-access reality

There is no universal consumer API that lets an ordinary app silently read the personal transaction history of every UPI/payment app.

The demo therefore uses two honest connection paths:

1. **Local statement import:** Importing the linked bank account statement gives broad coverage because the bank records UPI transactions regardless of whether Google Pay, PhonePe, Paytm, BHIM, or another app initiated them.
2. **Consent-based production integration:** A real automatic product should work through an eligible/regulated participant and an authorised Account Aggregator or other provider, where the requested financial information is supported.

Google states that Google Pay history contains only transactions made through Google Pay, not every UPI or banking transaction. It also documents a PDF/e-statement export flow. See [Google Pay transaction-history help](https://support.google.com/pay/india/answer/7430307?hl=en).

The RBI Account Aggregator directions require explicit customer consent, prohibit an AA from supporting customer transactions, and prohibit access to customer passwords, PINs, or private keys. See the [RBI Account Aggregator Master Directions](https://systemhealth.rbi.org.in/Scripts/BS_ViewMasDirections.aspx_id%3D10598%281%29.html).

## Run locally

You need Node.js 22.13 or newer.

```powershell
git clone https://github.com/rbd1411/paisa-pilot-finance-agent.git
cd paisa-pilot-finance-agent
npm ci
npm run dev
```

Open the local URL printed in PowerShell. Use `Ctrl+C` to stop the server.

Production build:

```powershell
npm run build
```

For Sites and Cloudflare-compatible hosting instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Demo workflow

1. Open **Overview** and explain the fictional balance, monthly metrics, anomaly briefing, and cash-flow forecast.
2. Open **Transactions** and change one suggested category.
3. Search for `MAKEMYTRIP` to show an unusual transaction.
4. Open **Cash flow** and explain the three-month rolling forecast.
5. Open **Savings plan**, change the target and month, and accept the local plan.
6. Open **Data access** and explain why a bank statement provides broader UPI coverage than a single payment-app history.
7. Select **Import transactions** and demonstrate the privacy notice, sample CSV download, and local file flow.

## Accepted data formats

CSV and JSON are supported. The importer detects common column names.

### Recommended CSV

```csv
Date,Description,Amount,Category,Source,Balance
2026-08-01,SALARY CREDIT,96000,Income,HDFC Bank,145000
2026-08-02,UPI-SWIGGY,-680,Food & dining,Google Pay,144320
```

It also accepts bank-style separate debit and credit columns:

```csv
Transaction Date,Narration,Debit,Credit,Balance
01/08/2026,SALARY CREDIT,,96000,145000
02/08/2026,UPI-SWIGGY,680,,144320
```

Recognised aliases include:

- Date: `Date`, `Transaction Date`, `Txn Date`, `Value Date`, `Timestamp`
- Description: `Description`, `Narration`, `Remarks`, `Merchant`, `Details`
- Amount: `Amount`, `Transaction Amount`, or separate `Debit` and `Credit`
- Optional: `Balance`, `Source`, `Payment App`, `Payment Mode`

The current MVP does not parse PDF statements. For Google Pay PDF/e-statements or bank PDFs, export/convert the data to CSV or JSON first. Production support would add local OCR/PDF parsing with strict validation.

## Architecture

```text
CSV / JSON statement
        ↓
Local browser parser
        ↓
Normalised transaction model
        ├── Rules-based category engine
        ├── Median-relative anomaly detector
        ├── Three-cycle cash-flow forecast
        └── Goal-based savings action builder
                         ↓
               Human review and edits
```

All current analysis runs in the browser. There is no model API call, database, or statement upload in this demo.

## Why this is an agent

PaisaPilot is a bounded analytical agent:

1. It accepts a financial-clarity goal and transaction data.
2. It selects parsing rules based on the file structure.
3. It normalises and categorises transactions.
4. It invokes anomaly, forecast, and goal-planning tools.
5. It proposes insights and actions.
6. It waits for the user to review categories and accept a plan.

It deliberately does not have payment authority.

## Algorithms

### Categorisation

Explicit, inspectable merchant-pattern rules assign categories. Positive transactions default to income unless marked as a refund or cashback. Users can override every result.

### Unusual spending

For each expense, the agent compares its absolute amount with the median of other transactions in the same category. It flags a transaction when enough peer evidence exists and the value crosses both a relative and minimum-value threshold.

This is not fraud detection. “Unusual” means “worth reviewing,” not “unauthorised.”

### Cash-flow forecast

The forecast averages income and non-transfer spending across up to three monthly cycles. Confidence is medium only when three cycles are available. It cannot predict employment changes, emergencies, returns, or new one-off purchases.

### Savings plan

The plan calculates a simple monthly contribution from the goal, current tracked balance, and target month. Suggested category guardrails are based on current flexible spending. It does not move money or recommend investments.

## Privacy and security

- Files are processed in the current browser session.
- Data is not persisted to the site database because the demo has no database.
- No UPI PIN, OTP, CVV, bank password, Aadhaar number, or credential is requested.
- No payment or transfer API exists in the project.
- Example data is fictional.
- The interface clearly labels forecasts as estimates.
- The interface separates “unusual spending” from fraud claims.
- Imported data disappears when the page is refreshed unless the user exports it first.

## Production roadmap

1. Authentication and encrypted user workspaces
2. A regulated/authorised Account Aggregator or FIU partnership
3. Consent creation, purpose limitation, expiry, audit, and revocation screens
4. Encrypted storage with user-controlled retention and deletion
5. Local or protected PDF/OCR parsing
6. A merchant-identity and category taxonomy with user-specific learning
7. Recurring-bill detection with tolerance windows
8. Forecast backtesting and confidence intervals
9. Multi-account transfer reconciliation
10. Alerts that require explicit opt-in
11. Security, legal, privacy, accessibility, and financial-risk review
12. No payment initiation unless separately authorised, regulated, and protected by an explicit approval flow

## Limitations

- Not investment, credit, tax, insurance, or professional financial advice
- Not a fraud-detection or credit-scoring system
- No live UPI/bank accounts are connected
- No PDF parsing
- Rule-based categories can require correction
- Forecasts use simple historical averages
- Reported balance depends on a balance column being present

The strongest product decision in this demo is refusing to fake “connect every UPI app” access. The interface demonstrates a credible route while protecting user credentials and consent.
