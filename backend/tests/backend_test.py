"""Backend tests for Real Estate Plot Expense Tracker."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://plot-tracker-app.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s
    # Cleanup: delete TEST_ plots
    try:
        plots = s.get(f"{API}/plots", timeout=15).json()
        for p in plots:
            if p.get("plot_name", "").startswith("TEST_"):
                s.delete(f"{API}/plots/{p['id']}", timeout=15)
    except Exception:
        pass


# ----- Plot creation & calculation -----
class TestPlotCalculation:
    def test_create_plot_auto_calculations(self, session):
        payload = {
            "plot_name": "TEST_CalcPlot",
            "mauja": "TEST_Mauja",
            "plot_size_sqft": 1500,
            "buying_price_per_sqft": 3500,
            "govt_valuation_per_sqft": 2800,
            "registration_percentage": 7,
            "other_charges": 50000,
        }
        r = session.post(f"{API}/plots", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["plot_cost"] == 5250000
        assert d["govt_value"] == 4200000
        assert d["registration_base"] == 5250000
        assert d["registration_fee"] == 367500
        assert d["final_total_cost"] == 5667500
        assert "id" in d
        # Persistence check
        g = session.get(f"{API}/plots/{d['id']}", timeout=15)
        assert g.status_code == 200
        gd = g.json()
        assert gd["final_total_cost"] == 5667500
        assert gd["total_paid"] == 0
        assert gd["pending_amount"] == 5667500
        # cleanup
        session.delete(f"{API}/plots/{d['id']}", timeout=15)

    def test_get_invalid_plot_returns_404(self, session):
        r = session.get(f"{API}/plots/nonexistent-id-xyz", timeout=15)
        assert r.status_code == 404


# ----- Transactions -----
class TestTransactions:
    @pytest.fixture(scope="class")
    def plot_id(self, session):
        payload = {
            "plot_name": "TEST_TxnPlot",
            "mauja": "TEST_Mauja",
            "plot_size_sqft": 1000,
            "buying_price_per_sqft": 1000,
            "govt_valuation_per_sqft": 800,
            "registration_percentage": 5,
            "other_charges": 0,
        }
        r = session.post(f"{API}/plots", json=payload, timeout=15)
        assert r.status_code == 200
        pid = r.json()["id"]
        yield pid
        session.delete(f"{API}/plots/{pid}", timeout=15)

    def test_create_transaction_invalid_plot(self, session):
        payload = {
            "plot_id": "nonexistent",
            "person": "TEST_P",
            "bank": "IDFC",
            "payment_mode": "Online",
            "transaction_type": "Plot Payment",
            "amount": 1000,
        }
        r = session.post(f"{API}/transactions", json=payload, timeout=15)
        assert r.status_code == 404

    def test_create_transaction_invalid_literal(self, session, plot_id):
        payload = {
            "plot_id": plot_id,
            "person": "TEST_P",
            "bank": "INVALID_BANK",
            "payment_mode": "Online",
            "transaction_type": "Plot Payment",
            "amount": 1000,
        }
        r = session.post(f"{API}/transactions", json=payload, timeout=15)
        assert r.status_code == 422

    def test_create_and_list_transactions(self, session, plot_id):
        txns = [
            {"plot_id": plot_id, "person": "TEST_Alice", "bank": "IDFC", "payment_mode": "Online", "transaction_type": "Plot Payment", "amount": 100000},
            {"plot_id": plot_id, "person": "TEST_Bob", "bank": "SBI", "payment_mode": "UPI", "transaction_type": "Advance", "amount": 50000},
            {"plot_id": plot_id, "person": "TEST_Alice", "bank": "Cash", "payment_mode": "Cash", "transaction_type": "Documentation", "amount": 10000},
            {"plot_id": plot_id, "person": "TEST_Bob", "bank": "Cash", "payment_mode": "ATM Withdrawal", "transaction_type": "Withdrawal", "amount": 20000},
        ]
        ids = []
        for t in txns:
            r = session.post(f"{API}/transactions", json=t, timeout=15)
            assert r.status_code == 200, r.text
            ids.append(r.json()["id"])

        # List for plot
        r = session.get(f"{API}/transactions", params={"plot_id": plot_id}, timeout=15)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) >= 4
        assert all(t["plot_id"] == plot_id for t in rows)
        # Sort desc by created_at
        timestamps = [t["created_at"] for t in rows]
        assert timestamps == sorted(timestamps, reverse=True)

        # Plot total_paid should exclude Withdrawal: 100000+50000+10000 = 160000
        g = session.get(f"{API}/plots/{plot_id}", timeout=15).json()
        assert g["total_paid"] == 160000

        # Delete one txn
        dr = session.delete(f"{API}/transactions/{ids[0]}", timeout=15)
        assert dr.status_code == 200
        g2 = session.get(f"{API}/plots/{plot_id}", timeout=15).json()
        assert g2["total_paid"] == 60000


# ----- Dashboard summary -----
class TestDashboard:
    def test_dashboard_summary_aggregations(self, session):
        # Create dedicated plot
        p = session.post(f"{API}/plots", json={
            "plot_name": "TEST_DashPlot", "mauja": "TEST", "plot_size_sqft": 100,
            "buying_price_per_sqft": 100, "govt_valuation_per_sqft": 100,
            "registration_percentage": 0, "other_charges": 0
        }, timeout=15).json()
        pid = p["id"]
        # Add: Online 1000, UPI 500, Cash 200, ATM Withdrawal 300 (Withdrawal type)
        for t in [
            {"plot_id": pid, "person": "TEST_X", "bank": "IDFC", "payment_mode": "Online", "transaction_type": "Plot Payment", "amount": 1000},
            {"plot_id": pid, "person": "TEST_X", "bank": "SBI", "payment_mode": "UPI", "transaction_type": "Advance", "amount": 500},
            {"plot_id": pid, "person": "TEST_Y", "bank": "Cash", "payment_mode": "Cash", "transaction_type": "Documentation", "amount": 200},
            {"plot_id": pid, "person": "TEST_Y", "bank": "Cash", "payment_mode": "ATM Withdrawal", "transaction_type": "Withdrawal", "amount": 300},
        ]:
            assert session.post(f"{API}/transactions", json=t, timeout=15).status_code == 200

        r = session.get(f"{API}/dashboard/summary", timeout=15)
        assert r.status_code == 200
        d = r.json()
        # online_total = Online + UPI = 1500
        assert d["online_total"] >= 1500
        # cash_total = Cash + ATM Withdrawal = 500
        assert d["cash_total"] >= 500
        # Withdrawal excluded from total_paid
        # Type totals should include Withdrawal
        assert d["type_totals"].get("Withdrawal", 0) >= 300
        # cleanup
        session.delete(f"{API}/plots/{pid}", timeout=15)
