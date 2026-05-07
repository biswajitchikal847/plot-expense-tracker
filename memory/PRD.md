# Real Estate Plot Expense Tracker — PRD

## Original Problem Statement
Build a modern responsive Real Estate Plot Expense Tracker (React + Tailwind + Firestore originally; built on React + FastAPI + MongoDB by default). Manage plot purchases, registration calculations, contributions, bank-wise / online-vs-cash payments, and pending amounts.

## Tech Stack (chosen by main agent — user skipped clarification)
- Frontend: React (CRA) + Tailwind + shadcn/ui + sonner toasts
- Backend: FastAPI + Motor (async MongoDB driver)
- DB: MongoDB — collections: `plots`, `transactions` (transactions reference `plot_id`)
- Currency: INR ₹ (toLocaleString 'en-IN')
- Auth: None (open architecture, ready to add)
- Theme: Light (Cabinet Grotesk display, Manrope body, JetBrains Mono numerics)

## User Personas
- Family member tracking shared real-estate purchases across contributors and banks
- Single user managing multi-plot portfolio with detailed registration math

## Core Requirements
- Plot creation with auto-calculations (plot cost, govt value, reg base = max, reg fee, final total)
- Plot dashboard cards (paid / pending / final total / progress)
- Per-plot transaction module (Person, Bank, Mode, Type, Amount, Notes)
- Banks: IDFC, SBI, AXIS, Cash · Modes: Online, Cash, UPI, ATM Withdrawal · Types: Plot Payment, Advance, Withdrawal, Registration, Documentation
- Dashboard summary: total paid, pending, online/UPI total, cash/ATM total, person-wise & bank-wise breakdowns
- Withdrawal type excluded from total_paid (it's outflow from kitty, not toward plot)

## Implemented (Feb 2026)
- ✅ Backend models + endpoints: POST/GET/DELETE /api/plots, /api/transactions, GET /api/dashboard/summary
- ✅ Server-side auto-calculations stored in Firestore-equivalent (Mongo)
- ✅ Frontend routes: `/` (Dashboard), `/plots/new`, `/plots/:id`
- ✅ Components: CreatePlotForm with live preview, TransactionForm in slide-out Sheet, responsive TransactionTable (desktop table + mobile cards), PlotCard with progress bar, StatCards with accent rails, BreakdownPanel with bar charts
- ✅ Form validations, loading states, delete confirmations (AlertDialog), toast feedback
- ✅ Mobile-first responsive design, Swiss/financial palette
- ✅ data-testid coverage on all interactive elements
- ✅ E2E tested by testing_agent_v3 — backend 100%, frontend 100%, no issues

## Backlog (Future-Ready)
P1
- Charts (Recharts already installed) — paid timeline, type distribution
- Edit plot / edit transaction
- Search & filters on transactions
P2
- PDF export of ledger
- Receipt upload (object storage integration)
- Authentication (JWT or Emergent Google)
- Dark mode toggle
- Multi-property workspaces
- Reports (monthly summary, person settlements)

## Next Action Items
1. Add charts to dashboard (paid-over-time, type breakdown)
2. Add edit-transaction & search/filter
3. Export ledger as PDF
4. Optional: receipt image upload per transaction (object storage)
