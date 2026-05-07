from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Real Estate Plot Expense Tracker")
api_router = APIRouter(prefix="/api")


# ============== Models ==============
class PlotCreate(BaseModel):
    plot_name: str
    mauja: str
    kisam: str = "Other"
    plot_size_sqft: float
    buying_price_per_sqft: float
    govt_valuation_per_sqft: float
    registration_percentage: float
    other_charges: float = 0.0


class Plot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plot_name: str
    mauja: str
    kisam: str = "Other"
    plot_size_sqft: float
    buying_price_per_sqft: float
    govt_valuation_per_sqft: float
    registration_percentage: float
    other_charges: float
    plot_cost: float
    govt_value: float
    registration_base: float
    registration_fee: float
    final_total_cost: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TransactionCreate(BaseModel):
    plot_id: str
    person: str
    bank: Literal["IDFC", "SBI", "AXIS", "Cash"]
    payment_mode: Literal["Online", "Cash", "UPI", "ATM Withdrawal"]
    transaction_type: Literal["Plot Payment", "Advance", "Withdrawal", "Registration", "Documentation"]
    amount: float
    notes: Optional[str] = ""


class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plot_id: str
    person: str
    bank: str
    payment_mode: str
    transaction_type: str
    amount: float
    notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ============== Helpers ==============
def calculate_plot_fields(data: dict) -> dict:
    plot_cost = data['plot_size_sqft'] * data['buying_price_per_sqft']
    govt_value = data['plot_size_sqft'] * data['govt_valuation_per_sqft']
    registration_base = max(plot_cost, govt_value)
    registration_fee = registration_base * (data['registration_percentage'] / 100.0)
    final_total_cost = plot_cost + registration_fee + data.get('other_charges', 0.0)
    return {
        "plot_cost": round(plot_cost, 2),
        "govt_value": round(govt_value, 2),
        "registration_base": round(registration_base, 2),
        "registration_fee": round(registration_fee, 2),
        "final_total_cost": round(final_total_cost, 2),
    }


# Withdrawal type does not count as money paid towards plot; it's money pulled out.
PAID_TYPES = {"Plot Payment", "Advance", "Registration", "Documentation"}


async def aggregate_plot_paid(plot_id: str) -> float:
    cursor = db.transactions.find(
        {"plot_id": plot_id, "transaction_type": {"$in": list(PAID_TYPES)}},
        {"_id": 0, "amount": 1}
    )
    total = 0.0
    async for doc in cursor:
        total += float(doc.get("amount", 0))
    return round(total, 2)


async def aggregate_plot_withdrawn(plot_id: str) -> float:
    cursor = db.transactions.find(
        {"plot_id": plot_id, "transaction_type": "Withdrawal"},
        {"_id": 0, "amount": 1}
    )
    total = 0.0
    async for doc in cursor:
        total += float(doc.get("amount", 0))
    return round(total, 2)


# ============== Routes ==============
@api_router.get("/")
async def root():
    return {"message": "Plot Expense Tracker API"}


# --- Plots ---
@api_router.post("/plots", response_model=Plot)
async def create_plot(payload: PlotCreate):
    base = payload.model_dump()
    calc = calculate_plot_fields(base)
    plot = Plot(**base, **calc)
    doc = plot.model_dump()
    await db.plots.insert_one(doc)
    return plot


@api_router.get("/plots")
async def list_plots():
    plots = await db.plots.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    enriched = []
    for p in plots:
        p.setdefault("kisam", "Other")
        paid = await aggregate_plot_paid(p["id"])
        withdrawn = await aggregate_plot_withdrawn(p["id"])
        p["total_paid"] = paid
        p["total_withdrawn"] = withdrawn
        p["pending_amount"] = round(p["final_total_cost"] - paid, 2)
        enriched.append(p)
    return enriched


@api_router.get("/plots/{plot_id}")
async def get_plot(plot_id: str):
    p = await db.plots.find_one({"id": plot_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Plot not found")
    p.setdefault("kisam", "Other")
    paid = await aggregate_plot_paid(plot_id)
    withdrawn = await aggregate_plot_withdrawn(plot_id)
    p["total_paid"] = paid
    p["total_withdrawn"] = withdrawn
    p["pending_amount"] = round(p["final_total_cost"] - paid, 2)
    return p


@api_router.delete("/plots/{plot_id}")
async def delete_plot(plot_id: str):
    res = await db.plots.delete_one({"id": plot_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plot not found")
    await db.transactions.delete_many({"plot_id": plot_id})
    return {"success": True}


# --- Transactions ---
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(payload: TransactionCreate):
    plot = await db.plots.find_one({"id": payload.plot_id}, {"_id": 0})
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    txn = Transaction(**payload.model_dump())
    await db.transactions.insert_one(txn.model_dump())
    return txn


@api_router.get("/transactions", response_model=List[Transaction])
async def list_transactions(plot_id: Optional[str] = None):
    query = {"plot_id": plot_id} if plot_id else {}
    rows = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return rows


@api_router.delete("/transactions/{txn_id}")
async def delete_transaction(txn_id: str):
    res = await db.transactions.delete_one({"id": txn_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"success": True}


class TransactionUpdate(BaseModel):
    transaction_type: Optional[Literal["Plot Payment", "Advance", "Withdrawal", "Registration", "Documentation"]] = None
    payment_mode: Optional[Literal["Online", "Cash", "UPI", "ATM Withdrawal"]] = None
    bank: Optional[Literal["IDFC", "SBI", "AXIS", "Cash"]] = None
    person: Optional[str] = None
    amount: Optional[float] = None
    notes: Optional[str] = None


@api_router.patch("/transactions/{txn_id}", response_model=Transaction)
async def update_transaction(txn_id: str, payload: TransactionUpdate):
    existing = await db.transactions.find_one({"id": txn_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.transactions.update_one({"id": txn_id}, {"$set": updates})
    merged = {**existing, **updates}
    return Transaction(**merged)


# --- Dashboard summary ---
@api_router.get("/dashboard/summary")
async def dashboard_summary():
    plots = await db.plots.find({}, {"_id": 0}).to_list(1000)
    total_final = sum(p["final_total_cost"] for p in plots)

    txns = await db.transactions.find({}, {"_id": 0}).to_list(5000)

    total_paid = 0.0
    total_withdrawn = 0.0
    online_total = 0.0
    cash_total = 0.0
    person_totals: dict = {}
    bank_totals: dict = {}
    mode_totals: dict = {}
    type_totals: dict = {}

    for t in txns:
        amt = float(t.get("amount", 0))
        ttype = t.get("transaction_type")
        mode = t.get("payment_mode")
        bank = t.get("bank")
        person = t.get("person", "Unknown")

        # Paid totals (exclude withdrawals)
        if ttype in PAID_TYPES:
            total_paid += amt
            person_totals[person] = round(person_totals.get(person, 0) + amt, 2)
            bank_totals[bank] = round(bank_totals.get(bank, 0) + amt, 2)

        if ttype == "Withdrawal":
            total_withdrawn += amt

        # Online vs Cash buckets (across all txns)
        if mode in ("Online", "UPI"):
            online_total += amt
        elif mode in ("Cash", "ATM Withdrawal"):
            cash_total += amt

        mode_totals[mode] = round(mode_totals.get(mode, 0) + amt, 2)
        type_totals[ttype] = round(type_totals.get(ttype, 0) + amt, 2)

    return {
        "total_final_cost": round(total_final, 2),
        "total_paid": round(total_paid, 2),
        "total_withdrawn": round(total_withdrawn, 2),
        "pending_amount": round(total_final - total_paid, 2),
        "online_total": round(online_total, 2),
        "cash_total": round(cash_total, 2),
        "person_totals": person_totals,
        "bank_totals": bank_totals,
        "mode_totals": mode_totals,
        "type_totals": type_totals,
        "plot_count": len(plots),
        "transaction_count": len(txns),
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
