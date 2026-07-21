# ADR-002: Credits Source of Truth

## Status
Accepted

## Date
2026-07-21

## Context
Parents purchase packages (e.g., 5-session passes, 10-session passes) and consume credits when booking classes. We need a reliable way to determine exactly how many credits a parent has available at any given time to prevent overbooking and correctly render UI states.

There are two potential ways to calculate this balance in the database:
1. **Ledger approach:** Aggregate the `amount` column in the `credit_transactions` table (where `amount` is positive for purchases and negative for bookings).
2. **Snapshot approach:** Read the `credits_remaining` column directly from the `packages` table.

## Decision
The `packages.credits_remaining` column is the absolute **Source of Truth** for a parent's credit balance. 

When exporting data to Google Sheets, building admin dashboards, or calculating balances in Supabase Edge Functions, we must **ALWAYS** calculate the balance by summing `packages.credits_remaining` for the parent. 

**NEVER** aggregate `credit_transactions.amount` to calculate the current balance.

## Alternatives Considered

### Aggregating `credit_transactions`
- **Pros:** Provides a strict, audit-friendly ledger of every credit movement. Common pattern in financial systems.
- **Cons:** Certain administrative edge cases break this pattern. For example, the Postgres RPC function `grant_trial_package` grants trial credits by directly mutating the `packages` table without inserting a corresponding row into `credit_transactions`. If we rely on transaction aggregation, parents who received trial credits will appear to have negative balances when they book their first class (since only the negative transaction is recorded).
- **Rejected:** Because it leads to incorrect negative balances in reports and blocks parents from booking if the UI relies on it.

## Consequences
- **Code Consistency:** Any query (both frontend and backend) that needs a parent's balance must query the `packages` table and sum the `credits_remaining`.
- **Audit Limitations:** The `credit_transactions` table should only be used as an activity log for display purposes ("ประวัติการใช้เครดิต"), not as a mathematical source of truth.
