# Complete the portfolio aggregation capability

**Seam:** `backend/` — Claude Code
**Status:** proposed

## Why

The MVP acceptance test from the planning documents does not pass:

> "You connect your Binance, Coinbase, and a few Ethereum wallets. The MVP displays unified
> holdings, trend graph, provides basic P/L tracking, allows quick AI queries… and helps with
> basic tax estimates."

**Amended 2026-07-28:** read "Coinbase and Kraken" for "Binance and Coinbase" — Binance is out
of scope. Everything else stands, and the tax clause is being exceeded rather than met: a real
cost-basis engine, not estimates.

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
| CEX — **Coinbase + Kraken** | Coinbase written (ccxt, imports commented out); Kraken **does not exist** | Both live when keys are configured; explicit error when not |
| CEX — Binance | 180 lines of working ccxt | **Dropped from scope** — see below |
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

**No Binance.** Dropped from scope 2026-07-28. Supported exchanges are **Coinbase and Kraken**
only. Note what this costs: `services/exchanges/binance.py` is 180 lines of *working* ccxt
code — this is a deliberate product choice, not a cleanup of something broken. Binance is
referenced in 10 backend files, and `python-binance==1.0.19` in `requirements.txt` becomes
unused. Removing that code is a separate change; this one stops it being wired in.

**Kraken must be built.** There is no Kraken implementation anywhere in the repository. ccxt
supports it, so `kraken.py` can mirror `coinbase.py`, but it is new code rather than the
wiring job the rest of the CEX work is.

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

## Decisions — resolved 2026-07-28

Both previously-open questions are answered, and both were answered in the more ambitious
direction. The MVP acceptance test is to be met in full.

1. **On-chain: build Ethereum for real.** Not descoped. This is the one genuinely greenfield
   part of the change — `web3` is absent from `requirements.txt`, every call in `eth.py` is
   commented out, and `scanner.py` is 0 bytes. Estimate accordingly: this is not the wiring
   job the rest of the change is.
2. **Tax: a real cost-basis engine.** FIFO **and** LIFO, with disposal matching against
   tracked lots. Not "estimates". This is the largest single unit of work here and depends on
   transaction history, so it is sequenced last.

## Credentials the user must supply

Cannot be resolved by an agent. Each blocks only its own capability:

- `BINANCE_API_KEY` / `BINANCE_API_SECRET` — **read-only**
- `COINBASE_API_KEY` / `COINBASE_API_SECRET` — **read-only**
- `ETHEREUM_RPC_URL` and `ETH_WALLET_ADDRESSES`
- `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` / `REDDIT_USER_AGENT` — unrelated to this change,
  but the reason `/news/reddit/*` currently 403s

Work proceeds without them: the integrations are built and tested against the
not-configured path, then verified against live keys when supplied.
