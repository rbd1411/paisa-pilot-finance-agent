# Presenting PaisaPilot in an Interview

## 30-second pitch

> I built PaisaPilot, a privacy-first personal finance agent for Indian bank and UPI transaction data. It imports CSV or JSON statements locally, categorises payments, flags unusual spending relative to the user’s own history, forecasts the next month, and turns savings goals into editable actions. I deliberately did not fake a universal UPI connection: the demo explains why bank-statement imports give broad coverage and how a production system would use explicit consent through an eligible Account Aggregator ecosystem participant. It is read-only and never asks for a PIN or initiates a payment.

## Two-minute technical explanation

> The application is a client-side React and TypeScript dashboard built for Cloudflare-compatible Sites hosting. The transaction parser handles common Indian bank column aliases, separate debit/credit layouts, quoted CSV fields, JSON arrays, Indian date formats, and rupee formatting.
>
> After normalisation, inspectable merchant rules assign categories. The anomaly detector compares each expense with the median amount in its category and treats results as review prompts, not fraud claims. Cash flow is forecast from up to three monthly cycles after excluding self-transfers. The savings planner combines a user-defined goal and date with flexible spending guardrails.
>
> The key architectural boundary is that financial data stays inside the browser in this MVP. There is no database, model API, or payment API. In production, automatic account access would require explicit, revocable consent and an authorised ecosystem integration—not banking credentials or screen scraping.

## Five-minute demo

### 0:00–0:45 — Problem and boundary

> People spend through several UPI apps, but each app sees only part of the picture. PaisaPilot uses the bank statement as the broadest common source and keeps the workflow read-only.

Point out **Demo · no live accounts** and **Private by default**.

### 0:45–1:45 — Overview

- Show the latest reported balance and runway estimate.
- Explain the income, spending, and savings-rate cards.
- Open the unusual-spending briefing and clarify that unusual is not fraudulent.

### 1:45–2:45 — Transactions

- Open **Transactions**.
- Search for `MAKEMYTRIP`.
- Change its category to demonstrate human correction.
- Explain that explicit rules are inspectable and stable.

### 2:45–3:30 — Forecast

- Open **Cash flow**.
- Show monthly income versus spending.
- Explain the three-cycle average and confidence label.
- State what the model cannot predict.

### 3:30–4:15 — Savings

- Open **Savings plan**.
- Change the target amount and date.
- Accept the plan.
- Point out that no money moved.

### 4:15–5:00 — Real integration story

- Open **Data access**.
- Compare bank CSV, payment-app export, Account Aggregator, and screen scraping.
- End with the production roadmap: regulated integration, consent lifecycle, encryption, deletion, backtesting, and security review.

## Likely interview questions

### “Can it really access every UPI app?”

> Not through one universal personal-history API, and I intentionally do not claim otherwise. A linked bank statement captures UPI activity at the account level regardless of the initiating app. Individual app exports cover only that app. For automatic production access, I would use an eligible, explicit-consent integration such as the Account Aggregator ecosystem where supported.

### “Why is this an AI agent if it does not call an LLM?”

> Agentic behavior is broader than an LLM call. PaisaPilot receives a goal and unstructured financial records, chooses parsing and normalisation paths, invokes categorisation, anomaly, forecast, and planning tools, and produces actions for human approval. For numerical personal finance, deterministic and inspectable methods are often safer than a generative model. An LLM could later explain results, but it should not own transaction amounts or financial calculations.

### “Why process data in the browser?”

> It makes the MVP safer and easier to trust because statements do not leave the device. It also lowers backend scope. The tradeoff is that data is not synchronised between devices and disappears on refresh. A production service would need encrypted storage, authentication, retention controls, deletion, and audited access.

### “How is unusual spending detected?”

> Each expense is compared with other transactions in the same category. The rule requires enough peer data and checks whether the amount is more than about 2.35 times the category median and above a minimum value. It is a review heuristic, not fraud detection. I would evaluate precision and user correction rate before turning it into an alert.

### “How would you improve categories?”

> I would add a versioned merchant taxonomy, UPI-handle normalisation, fuzzy merchant matching, and user-specific overrides. Corrections could train a lightweight per-user classifier, but the user’s explicit rule should have priority and remain editable.

### “How would you evaluate the forecast?”

> I would backtest rolling forecasts against later actual months, measure absolute and percentage errors, segment results by income regularity, and calibrate confidence intervals. I would compare the simple baseline with seasonal and robust time-series alternatives before increasing complexity.

### “Why not connect by asking users for bank credentials?”

> That creates unacceptable security and compliance risk. The RBI Account Aggregator framework explicitly separates consent-based information sharing from customer credentials. PaisaPilot should never access passwords, PINs, private keys, OTPs, or CVVs.

### “How would you productionise the Account Aggregator connection?”

> First I would establish the legal and regulatory role of the product and partner with eligible participants. Then I would implement purpose-specific, time-limited consent, signed requests, status and revocation handling, data minimisation, immutable audit records, encryption, retention deletion, incident response, and user-visible access history. I would not treat this as a normal OAuth integration.

### “What are the key failure modes?”

> Incorrect CSV column detection, debit/credit sign mistakes, duplicate imports, self-transfer double counting, merchant alias errors, irregular salary, missing balances, and overconfident forecasts. The MVP addresses some with explicit parsing rules, transfer exclusion, confidence labels, editable categories, and clear assumptions. Production needs reconciliation, deduplication IDs, validation totals, and backtesting.

## Architecture whiteboard

```text
Bank / UPI export
       ↓
Schema detector and parser
       ↓
Normalised signed transactions
       ├── Merchant categorisation
       ├── Category-relative anomaly rules
       ├── Monthly cash-flow aggregation
       └── Goal contribution calculator
                         ↓
                  Human review
```

For production, draw a separate external path:

```text
Customer consent → Authorised AA → Supported FIP data → Eligible FIU/product
```

Do not draw a line from PaisaPilot directly to “all UPI apps.”

## Résumé bullets

- Built a privacy-first personal finance agent in React and TypeScript that imports bank/UPI transaction exports, categorises payments, detects unusual spending, forecasts cash flow, and creates editable savings plans.
- Designed a flexible CSV/JSON normalisation engine supporting Indian dates, debit/credit statement layouts, merchant-source inference, user category overrides, and local-only processing.
- Modelled a credible production data-access path using explicit consent and Account Aggregator principles while refusing insecure credential capture, screen scraping, payment initiation, and misleading universal-UPI claims.
- Implemented responsive multi-view financial dashboards, deterministic anomaly and forecast logic, downloadable data, social-preview metadata, and Cloudflare-compatible production builds.

## What not to claim

Do not say:

- “It connects to every UPI app.”
- “It detects fraud.”
- “The forecast is accurate.”
- “It is legally compliant.”
- “It gives investment advice.”
- “It is production ready.”

Say:

- It demonstrates broad statement-import coverage.
- It identifies transactions worth reviewing.
- Forecasts are estimates with visible assumptions.
- It follows consent-first design principles.
- Production requires regulated partnerships and legal/security review.

## Strong closing line

> The most important decision was not adding more AI. It was keeping financial calculations inspectable, preserving user control, and refusing to pretend that sensitive payment data is universally accessible.
