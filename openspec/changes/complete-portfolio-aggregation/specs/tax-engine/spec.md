# Spec — tax cost-basis engine

Decided 2026-07-28: a **real** engine, not estimates.

## ADDED Requirements

### Requirement: Acquisitions are tracked as lots

The system SHALL record each acquisition as a distinct lot — asset, quantity, unit cost,
timestamp, source — rather than as an average position.

Averaging destroys the information disposal matching needs, and cannot be reconstructed later.

#### Scenario: Two buys at different prices
- **WHEN** 1 BTC is bought at 30,000 and later 1 BTC at 50,000
- **THEN** two lots exist with their own unit costs
- **AND** no single blended cost replaces them

---

### Requirement: Disposals are matched by a selectable method

The system SHALL support **FIFO** and **LIFO**, FIFO by default, and SHALL consume lots
according to the selected method.

#### Scenario: FIFO consumes oldest first
- **GIVEN** lots of 1 BTC at 30,000 then 1 BTC at 50,000
- **WHEN** 1 BTC is sold at 60,000 under FIFO
- **THEN** realised gain is 30,000, from the 30,000 lot
- **AND** the remaining open lot is 1 BTC at 50,000

#### Scenario: LIFO consumes newest first
- **GIVEN** the same lots
- **WHEN** 1 BTC is sold at 60,000 under LIFO
- **THEN** realised gain is 10,000, from the 50,000 lot

#### Scenario: The methods are distinguishable
- **WHEN** the same history is evaluated under FIFO and LIFO
- **THEN** the realised figures differ
- **AND** a test asserts both, so a stub returning one value for both fails

#### Scenario: A disposal spans lots
- **GIVEN** lots of 1 BTC at 30,000 and 1 BTC at 50,000
- **WHEN** 1.5 BTC is sold
- **THEN** the disposal consumes the whole first lot and half the second under FIFO
- **AND** the result identifies every lot consumed and the quantity taken from each

---

### Requirement: Results are auditable

The system SHALL report, per disposal, the realised gain or loss, the holding period, and
which lots were consumed.

A number a user cannot trace to its lots cannot be checked, and this output is what they file
from.

#### Scenario: Disposal is traceable
- **WHEN** a disposal is reported
- **THEN** it names the lots consumed, the quantity from each, and the resulting gain or loss

#### Scenario: Open positions
- **WHEN** lots remain unconsumed
- **THEN** unrealised profit and loss is reported against current market price, separately
  from realised figures

---

### Requirement: Arithmetic is exact and order-dependent

The system SHALL use decimal arithmetic, and SHALL apply disposals in timestamp order.

Repeated binary-float arithmetic across many lots drifts. Out-of-order disposals silently
consume different lots and produce a different, wrong answer.

#### Scenario: No float drift
- **WHEN** many small acquisitions and disposals are processed
- **THEN** totals are exact to the precision of the inputs

#### Scenario: Input order does not change the answer
- **WHEN** the same transactions are supplied in a shuffled order
- **THEN** results are identical to timestamp-ordered input

---

### Requirement: Incomplete history is an error

The system SHALL fail explicitly when a disposal exceeds the quantity held, rather than
assuming a zero cost basis.

A zero basis silently maximises the reported gain. Being wrong in the user's disfavour without
telling them is the worst available outcome.

#### Scenario: Disposal exceeds holdings
- **WHEN** 2 BTC is disposed but only 1 BTC of lots exists
- **THEN** an explicit error identifies the asset and the shortfall
- **AND** no result is produced that treats the missing basis as zero

---

### Requirement: Limits are stated, not implied

The system SHALL present its output as a calculation, not as tax advice, and SHALL state what
it does not do.

#### Scenario: Limitations surfaced
- **WHEN** tax output is returned or displayed
- **THEN** it states that wash sales, jurisdiction-specific rules, and Form 8949 generation
  are not handled

---

### Requirement: The engine is deterministic and pure

The engine SHALL compute from supplied lots and disposals alone, with no network access and no
reference to the current time.

This is what makes it exactly testable rather than approximately testable — the one part of
this change that can be verified with certainty.

#### Scenario: Same input, same output
- **WHEN** identical input is evaluated twice
- **THEN** the results are identical, with no external calls
