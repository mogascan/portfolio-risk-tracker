# Tasks — portfolio aggregation

**Owner:** Claude Code · **Seam:** `backend/` only. Touch no file under `frontend/`.

Ordered by dependency. Each numbered group is a commit. Every group ends green:
`pytest -q`, `flake8 app tests`, and `app.main` imports.

---

## 1. Register the aggregation router

- [ ] Add `prefix="/accounts"` to the router in `app/api/routes/portfolio.py`
- [ ] Register it in `app/main.py` under `/api/v1`, tagged `Accounts`
- [ ] Test: `GET /api/v1/accounts/summary` resolves — **must fail if the `include_router`
      line is removed**
- [ ] Test: `GET /api/v1/portfolio/transactions` still resolves to the manual-portfolio
      handler — guards the `/transactions` collision that made `/accounts` necessary

> Do this first and alone. It is the smallest change that turns the MVP path from unreachable
> to reachable, and everything below is verified through it.

## 2. The not-configured contract

- [ ] Add `KRAKEN_API_KEY`, `KRAKEN_API_SECRET` to `app/core/settings.py`; confirm the
      Coinbase and Ethereum keys are already there
- [ ] Define one shared shape: `503 {"status": "not_configured", "integration": ..., "required": [names]}`
      and `502 {"status": "auth_failed", ...}`
- [ ] **Delete the mock fallbacks** in `coinbase.py`. No default path may return invented
      balances
- [ ] Test: with no env vars, assert the 503 shape and that **no balance figure appears**
- [ ] Test: assert no error payload or log line contains a credential *value*

## 3. Coinbase

- [ ] Uncomment the import in `services/ai/portfolio_analysis.py`
- [ ] Wire `CoinbaseService` into the aggregation router
- [ ] Test with a fake service returning known balances: assert the summed total and the
      per-asset breakdown

## 4. Kraken — new code

- [ ] Write `services/exchanges/kraken.py` against the `base.py` interface, mirroring
      `coinbase.py`. Use ccxt's `kraken`
- [ ] Implement `get_balances` and `get_transactions`
- [ ] Wire into the aggregation router
- [ ] Test: same fake-service treatment as Coinbase

> No Binance. `binance.py` stays on disk, unwired — a product decision, not a broken
> integration. Do not import it.

## 5. Partial availability

- [ ] `/summary` returns every source that succeeded plus an explicit `unavailable` list with
      reasons; one failure must not fail the endpoint
- [ ] Test: Coinbase configured, Kraken and Ethereum not → Coinbase holdings returned, other
      two listed unavailable, total covers only what succeeded
- [ ] Test: reported total equals the sum of the per-asset values returned

## 6. Ethereum — genuinely new work

Not a wiring job. `web3` is absent from `requirements.txt`, every call in `eth.py` is
commented out, `scanner.py` is 0 bytes.

- [ ] Add `web3` to `requirements.txt`. **Verify it installs on Python 3.13 in CI** — the
      `pandas` pin failed exactly here
- [ ] Implement `get_balances` against `ETHEREUM_RPC_URL` for each address in
      `ETH_WALLET_ADDRESSES`: native ETH, then ERC-20
- [ ] Implement `get_transactions` via a **bounded** block-range scan in `scanner.py`. State
      the range limit in the response — never imply completeness
- [ ] Accept public addresses only. Reject anything that looks like a private key or seed
      phrase rather than passing it through
- [ ] Test: RPC unreachable → Ethereum reported unavailable, other sources still return
- [ ] Test: no mock path can produce a balance

## 7. Specific-coin routes

- [ ] Implement `/api/symbols`, `/api/symbols/refresh`, `/api/symbols/alert-setup`,
      `/api/token/` — the four the frontend already calls
- [ ] Live market data, no mock fallback
- [ ] Test: each resolves and returns real-shaped data

> **Tell Codex when this lands.** The frontend client is blocked on it, and shipping that
> client first is what produced the current breakage.

## 8. Tax cost-basis engine

The largest unit here. Pure and deterministic — no network, no clock.

- [ ] `Lot` record per acquisition: asset, quantity, unit cost, timestamp, source. **Never**
      collapse to an average
- [ ] Matcher consuming lots by method — **FIFO default, LIFO selectable**
- [ ] Use `Decimal` throughout. Not float
- [ ] Sort disposals by timestamp before matching
- [ ] Disposal exceeding holdings → explicit error naming asset and shortfall. **Never** a
      zero cost basis
- [ ] Report per disposal: realised gain/loss, holding period, and which lots were consumed
- [ ] Report unrealised P/L on open lots, separately
- [ ] State the limits in the response: no wash sales, no jurisdiction rules, no Form 8949
- [ ] Wire into `/api/v1/accounts/tax`

Tests — this is the part that can be verified exactly, so verify it exactly:

- [ ] FIFO: lots 1 BTC @30k then 1 BTC @50k, sell 1 @60k → gain 30k, remaining lot @50k
- [ ] LIFO: same lots → gain 10k
- [ ] **Assert both, so a stub returning one value for both fails**
- [ ] Disposal spanning lots: sell 1.5 → whole first lot, half the second, both reported
- [ ] Shuffled input order produces identical results to timestamp order
- [ ] Over-disposal raises rather than assuming zero basis
- [ ] Many small lots produce exact totals — no float drift

## 9. Close out

- [ ] Update `AUDIT.md`: aggregation, CEX, on-chain, specific coins, tax move to **live**
- [ ] Confirm every capability meets all three gate conditions — reachable, real data by
      default, and a test that fails if it is removed
- [ ] Record any mock still in the tree in `backend/tests/mock_data_log.md` with an expiry
- [ ] Verify live against real credentials once supplied; report what was checked and what
      was not

---

## Standing constraints

- Never log or return a credential value
- No mock data on any default path
- `python3`, port 8000
- Do not create `services/foo.py` beside `services/foo/` — that shadowing has cost this repo
  ~1,500 lines twice
- If something else looks broken, report it; do not widen this change
