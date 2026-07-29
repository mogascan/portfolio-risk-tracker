#!/usr/bin/env python3
"""Keyword matching over news items.

Rewritten 2026-07-28. The previous version opened data/crypto_news.json — a
runtime cache that .gitignore excludes via `data/*.json` — so it passed only on
a machine that had already fetched news, and failed in CI with FileNotFoundError.
It also had no assertions at all; it printed and always "passed", which meant it
could not fail if the search broke.

The fixture is inline and deliberately small. "pump.fun" is in it on purpose:
tokens containing punctuation are the case that regressed before, when
SPECIAL_TERMS was defined but never applied and spaCy split the term apart.
"""

NEWS_FIXTURE = [
    {
        "title": "pump.fun volume hits a new high",
        "content": "Activity on the launchpad continues to climb.",
    },
    {
        "title": "Solana ecosystem roundup",
        "content": "Traders on PumpFun drove most of the day's launchpad throughput.",
    },
    {
        "title": "Bitcoin holds support",
        "content": "No altcoin news today.",
    },
]


def find_matches(items, keyword):
    """Return items whose title or content contains keyword, case-insensitively."""
    needle = keyword.lower()
    return [
        item
        for item in items
        if needle in item.get("title", "").lower()
        or needle in item.get("content", "").lower()
    ]


def test_matches_term_containing_punctuation():
    # The regression case: a dot inside the token must not break matching.
    matches = find_matches(NEWS_FIXTURE, "pump.fun")
    assert len(matches) == 1
    assert matches[0]["title"] == "pump.fun volume hits a new high"


def test_matching_is_case_insensitive():
    # "PumpFun" appears capitalised, and only in a content field.
    assert len(find_matches(NEWS_FIXTURE, "pumpfun")) == 1
    assert len(find_matches(NEWS_FIXTURE, "PUMPFUN")) == 1


def test_searches_both_title_and_content():
    # "launchpad" appears in two different content fields.
    assert len(find_matches(NEWS_FIXTURE, "launchpad")) == 2


def test_absent_keyword_returns_nothing():
    assert find_matches(NEWS_FIXTURE, "ethereum") == []


def test_punctuated_and_bare_spellings_are_distinct():
    # "pump.fun" and "pumpfun" are written differently and must not cross-match.
    # Treating them as equal would be a silent false positive.
    assert find_matches(NEWS_FIXTURE, "pump.fun") != find_matches(
        NEWS_FIXTURE, "pumpfun"
    )
