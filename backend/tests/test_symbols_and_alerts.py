"""TradingView symbol mapping, the cross-alert webhook, and token supply data.

Four of these routes were called by the frontend and absent from the server. The fifth, the
webhook receiver, never existed at all — data/cross_alerts.json contained eight alerts from
March 2025 that nothing in the repository could have written.

The alert conditions are a contract with the frontend: symbolsService.generateAlertInstructions
groups by exact string match, so a renamed condition silently produces an empty group rather
than an error. That is asserted here.
"""

import json

import pytest

from app.main import app
from app.services.market_data import tradingview_symbols as tv


@pytest.fixture(scope="module")
def paths():
    return app.openapi()["paths"]


COINS = [
    {"id": "bitcoin", "name": "Bitcoin", "symbol": "btc", "market_cap_rank": 1},
    {"id": "ethereum", "name": "Ethereum", "symbol": "eth", "market_cap_rank": 2},
]


# --------------------------------------------------------------------- routes exist

@pytest.mark.parametrize("endpoint", [
    "/api/v1/symbols",
    "/api/v1/symbols/refresh",
    "/api/v1/symbols/alert-setup",
    "/api/v1/webhooks/tradingview",
    "/api/v1/alerts/cross",
    "/api/v1/token/{token_id}",
])
def test_route_is_registered(paths, endpoint):
    """Each of these was called by a client that got a 404."""
    assert endpoint in paths


# --------------------------------------------------------------------- symbol mapping

def test_symbol_is_rendered_in_tradingview_form():
    assert tv.to_tradingview_symbol("btc", "COINBASE") == "COINBASE:BTCUSD"


def test_quote_currency_follows_the_exchange():
    """Coinbase lists BTC against USD, Binance against USDT. Getting this wrong points the
    user at a chart that does not exist."""
    assert tv.to_tradingview_symbol("btc", "BINANCE") == "BINANCE:BTCUSDT"
    assert tv.to_tradingview_symbol("btc", "KRAKEN") == "KRAKEN:BTCUSD"


def test_mapping_covers_every_coin_with_a_symbol():
    mapped = tv.build_symbol_map(COINS, "COINBASE")
    assert len(mapped) == 2
    assert mapped[0]["tradingview_symbol"] == "COINBASE:BTCUSD"
    assert mapped[0]["id"] == "bitcoin"


def test_coins_without_a_symbol_are_skipped_not_guessed():
    """An invented mapping sends the user to set an alert on the wrong chart, which is worse
    than omitting it."""
    mapped = tv.build_symbol_map(COINS + [{"id": "mystery", "name": "Mystery"}], "COINBASE")
    assert len(mapped) == 2


# --------------------------------------------------------------------- alert setup

def test_alert_setup_offers_the_three_cross_conditions():
    setup = tv.build_alert_setup(tv.build_symbol_map(COINS))
    conditions = {a["condition"] for a in setup["symbols"][0]["alerts"]}

    assert conditions == {
        "Approaching Golden Cross",
        "Golden Cross Complete",
        "Death Cross",
    }


def test_condition_strings_match_the_frontend_contract():
    """symbolsService.generateAlertInstructions keys a dict on these exact strings. A rename
    here produces a silently empty instruction group, not an error."""
    assert tv.CONDITIONS == [
        "Approaching Golden Cross",
        "Golden Cross Complete",
        "Death Cross",
    ]


def test_alert_setup_reports_the_moving_averages_it_assumes():
    setup = tv.build_alert_setup(tv.build_symbol_map(COINS))
    assert setup["short_ma_period"] == 50
    assert setup["long_ma_period"] == 200


# --------------------------------------------------------------------- webhook storage

@pytest.fixture
def alerts_file(tmp_path, monkeypatch):
    path = tmp_path / "cross_alerts.json"
    monkeypatch.setattr(tv, "ALERTS_FILE", str(path))
    return path


def test_recording_an_alert_persists_it(alerts_file):
    tv.record_alert({
        "symbol": "BTCUSDT", "alertType": "approaching", "price": 67000, "percentage": 70,
    })

    stored = json.loads(alerts_file.read_text())["alerts"]
    assert len(stored) == 1
    assert stored[0]["symbol"] == "BTCUSDT"


def test_received_timestamp_is_stamped_server_side(alerts_file):
    """The sender's timestamp is user-authored template text and often absent; the server's
    is not."""
    alert = tv.record_alert({"symbol": "ETHUSD", "alertType": "golden_cross"})
    assert alert["received"]
    assert alert["timestamp"] is None


def test_alerts_accumulate_rather_than_overwrite(alerts_file):
    tv.record_alert({"symbol": "BTCUSD", "alertType": "approaching"})
    tv.record_alert({"symbol": "ETHUSD", "alertType": "death_cross"})

    assert len(tv.load_alerts()) == 2


def test_missing_alert_file_reads_as_empty(alerts_file):
    """No alerts received yet is the normal state before any are configured."""
    assert tv.load_alerts() == []


def test_corrupt_alert_file_does_not_crash(alerts_file):
    alerts_file.write_text("{ not json")
    assert tv.load_alerts() == []


# --------------------------------------------------------------------- filtering

def test_alerts_are_returned_newest_first():
    alerts = [
        {"symbol": "BTC", "received": "2025-01-01T00:00:00Z"},
        {"symbol": "ETH", "received": "2025-06-01T00:00:00Z"},
    ]
    assert tv.filter_alerts(alerts)[0]["symbol"] == "ETH"


def test_alerts_filter_by_symbol_case_insensitively():
    alerts = [{"symbol": "BTCUSD", "received": "x"}, {"symbol": "ETHUSD", "received": "y"}]
    assert len(tv.filter_alerts(alerts, symbol="btcusd")) == 1


def test_alerts_filter_by_type():
    alerts = [
        {"symbol": "BTC", "alertType": "approaching", "received": "x"},
        {"symbol": "BTC", "alertType": "death_cross", "received": "y"},
    ]
    assert len(tv.filter_alerts(alerts, alert_type="death_cross")) == 1
