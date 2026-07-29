# Spec — portfolio aggregation

## ADDED Requirements

### Requirement: Supported exchanges are Coinbase and Kraken only

The system SHALL integrate **Coinbase** and **Kraken**, and SHALL NOT integrate Binance.

Decided 2026-07-28. Binance is **dropped, not deferred** — despite
`services/exchanges/binance.py` containing 180 lines of working ccxt code. Kraken has no
implementation yet and must be written; ccxt supports it.

#### Scenario: Kraken is a supported source
- **WHEN** aggregation runs
- **THEN** Kraken is queried alongside Coinbase and Ethereum

#### Scenario: Binance is not offered
- **WHEN** any account endpoint responds, or configuration is documented
- **THEN** Binance is absent from supported sources
- **AND** no Binance credential is requested

---

### Requirement: Aggregated account holdings are reachable

The system SHALL expose aggregated holdings from connected exchange accounts and on-chain
wallets under `/api/v1/accounts`, registered in `app/main.py`.

The prefix SHALL NOT be `/portfolio`. Both `api/routes/portfolio.py` and `api/v1/portfolio.py`
define `/transactions`, and FastAPI resolves to the first registration — mounting under
`/portfolio` would silently disable one of them.

#### Scenario: Summary endpoint resolves
- **WHEN** a client requests `GET /api/v1/accounts/summary`
- **THEN** the route resolves (not 404)
- **AND** a test asserting this fails if the `include_router` line is removed

#### Scenario: Manual portfolio is unaffected
- **WHEN** the aggregation router is registered
- **THEN** `GET /api/v1/portfolio/transactions` still resolves to the manual-portfolio handler

---

### Requirement: Unconfigured integrations fail loudly

The system SHALL NOT return fabricated balances, prices, or transactions on any default path.
Where credentials are absent, it SHALL say so explicitly.

Fabricated financial data is the one failure mode that can cause real loss: a user cannot tell
a mock balance from a real one, and may act on it.

#### Scenario: Credentials absent
- **WHEN** `KRAKEN_API_KEY` is unset and `GET /api/v1/accounts/assets` is requested
- **THEN** the response identifies the integration as not configured
- **AND** names the required environment variables
- **AND** contains no balance figures

#### Scenario: Credentials rejected
- **WHEN** credentials are present but the exchange rejects them
- **THEN** the response distinguishes an authentication failure from a missing configuration

#### Scenario: No secret is ever disclosed
- **WHEN** any error response or log line is produced
- **THEN** it contains variable *names* only, never values

---

### Requirement: Aggregation degrades per source

The system SHALL return data from every source that succeeded, rather than failing wholesale
when one source is unavailable.

#### Scenario: Partial configuration
- **WHEN** Coinbase is configured and Kraken and Ethereum are not
- **THEN** `GET /api/v1/accounts/summary` returns Coinbase holdings
- **AND** lists Kraken and Ethereum as unavailable, with the reason
- **AND** the reported total value covers only the sources that succeeded

#### Scenario: Total is internally consistent
- **WHEN** balances and prices are known
- **THEN** the reported total equals the sum of the per-asset values returned

---

### Requirement: Ethereum holdings are read from chain

The system SHALL read balances and transaction history for the configured public addresses
via a real RPC connection.

This replaces a facade: `web3` is absent from `requirements.txt`, every call in `eth.py` is
commented out, and `scanner.py` is empty.

#### Scenario: Balances come from chain
- **WHEN** `ETHEREUM_RPC_URL` and `ETH_WALLET_ADDRESSES` are set
- **THEN** balances reflect on-chain state for those addresses
- **AND** no mock path can produce them

#### Scenario: Addresses only
- **WHEN** wallet configuration is read
- **THEN** only public addresses are accepted
- **AND** no private key or seed phrase is requested, stored, or transmitted

#### Scenario: RPC unreachable
- **WHEN** the RPC endpoint fails
- **THEN** Ethereum is reported unavailable with the reason, and other sources still return

---

### Requirement: Specific-coin routes exist server-side

The system SHALL implement the routes the frontend already calls: `/api/symbols`,
`/api/symbols/refresh`, `/api/symbols/alert-setup`, and `/api/token/`.

These are currently called by the client and absent from the server.

#### Scenario: Routes resolve
- **WHEN** the frontend requests any of the four
- **THEN** the route resolves and returns live market data, not a mock

#### Scenario: Ordering
- **WHEN** the frontend client change is implemented
- **THEN** these routes already exist — the client is never shipped against absent routes
