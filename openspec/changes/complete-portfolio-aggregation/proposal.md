# Complete the portfolio aggregation capability

**Seam:** `backend/` — Claude Code
**Status:** proposed

## Why

The MVP acceptance test from the planning documents does not pass:

> "You connect your Binance, Coinbase, and a few Ethereum wallets. The MVP displays unified
> holdings, trend graph, provides basic P/L tracking, allows quick AI queries… and helps with
> basic tax estimates."

The Phase 0c audit found that it fails for an unusual reason: **most of it is already written
and switched off.** `app/api/routes/portfolio.py` imports all four services and exposes
`/summary`, `/performance`, `/assets`, `/transactions` and `/tax`. Every method it calls
exists. It returns nothing because `main.py` never registers the router.

This is a wiring-and-finishing problem, not a greenfield build — materially cheaper than it
looks. That is the case for doing it now rather than deferring it.

## What changes

| Capability | Today | After |
|---|---|---|
| Aggregation router | 190 lines, unregistered | Registered under its own prefix, reachable |
| CEX (Binance, Coinbase) | 374 lines of real ccxt, imports commented out | Live when keys are configured; explicit error when not |
| On-chain (Ethereum) | Facade — `web3` uncommented nowhere, absent from requirements | Real `web3` integration, or explicitly descoped (see Open questions) |
| Specific coins | Frontend calls 4 routes that do not exist | Routes implemented server-side |
| Tax | Prompt text plus an unregistered `/tax` | Real cost-basis engine (FIFO/LIFO) |
| Credentials | Mock fallback when keys are absent | Never mock on the default path — a clear, typed "not configured" response |

## Non-goals

Unchanged from `project.md` and not reopened here: no custody, no private keys, read-only
exchange keys only, single user, not financial advice. The current page-router UI layout stays
the accepted baseline — nothing in this change re-flows the UI.

**No Twitter/X feed.** Dropped from scope 2026-07-28. `services/news/twitter_service.py` and
the registered `/api/v1/news/twitter/user/{handle}` route are not extended, not configured,
and not counted as a capability by this change. Reddit stays the social source.

## The rule this change is held to

From `project.md`, applied per capability, not per file:

1. **Reachable** — a registered route
2. **Real data on the default path** — no mock fallback; mocks only behind an explicit flag
3. **At least one test fails if the capability is removed**

Every task below is done only when all three hold. The point of this change is to stop
producing code that reads as done and behaves as absent, so a partially-wired result is worse
than no result.

## Mock fallback is the main design risk

`binance.py` and `coinbase.py` currently fall back to mock balances when API keys are unset.
That is exactly the pattern that hid the incompleteness for months: the endpoint answers, the
data is fictional, and nothing fails.

This change removes that behaviour. With no credentials the endpoints must return a clear
`503`-style "integration not configured" payload that the frontend can render honestly. Mock
data survives only behind an explicit flag, recorded in `backend/tests/mock_data_log.md` with
an expiry, per `AGENTS.md`.

## Open questions — need a decision before the tasks they gate

1. **On-chain scope.** `web3` is not installed and not in `requirements.txt`, and an Ethereum
   RPC endpoint requires a provider URL the user must supply. Options: implement it properly,
   or descope Ethereum from the MVP and amend the acceptance test. **This blocks the
   `blockchain` tasks and nothing else.**
2. **Tax depth.** "Basic tax estimates" in the documents vs. the architecture diagram's
   first-class Tax Calculator. A real engine means cost-basis tracking, FIFO/LIFO, and
   disposal matching. Options: full engine, or unrealised P/L only with the limitation stated
   in the UI.

## Credentials the user must supply

Cannot be resolved by an agent. Each blocks only its own capability:

- `BINANCE_API_KEY` / `BINANCE_API_SECRET` — **read-only**
- `COINBASE_API_KEY` / `COINBASE_API_SECRET` — **read-only**
- `ETHEREUM_RPC_URL` and `ETH_WALLET_ADDRESSES`
- `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` / `REDDIT_USER_AGENT` — unrelated to this change,
  but the reason `/news/reddit/*` currently 403s

Work proceeds without them: the integrations are built and tested against the
not-configured path, then verified against live keys when supplied.
