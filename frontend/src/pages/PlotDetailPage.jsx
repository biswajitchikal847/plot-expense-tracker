import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2, Trash2, Plus, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionTable } from '../components/TransactionTable';
import { StatCard } from '../components/StatCard';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../components/ui/tabs';
import { useTransactions } from '../hooks/useTransactions';
import {
  deletePlot,
  deleteTransaction,
  getPlot,
  updateTransaction,
} from '../services/api';
import { formatINR, formatNumber } from '../utils/format';
import { toast } from 'sonner';
import { Wallet, TrendingDown, Receipt, Landmark } from 'lucide-react';

export default function PlotDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plot, setPlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTxn, setDeleteTxn] = useState(null);
  const [deletePlotOpen, setDeletePlotOpen] = useState(false);

  const {
    transactions,
    refresh: refreshTxns,
  } = useTransactions(id);

  const loadPlot = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getPlot(id);
      setPlot(p);
    } catch (e) {
      toast.error('Plot not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadPlot();
  }, [loadPlot]);

  const refreshAll = async () => {
    await Promise.all([loadPlot(), refreshTxns()]);
  };

  const onTxnCreated = async () => {
    await refreshAll();
    setSheetOpen(false);
  };

  const confirmDeleteTxn = async () => {
    if (!deleteTxn) return;
    try {
      await deleteTransaction(deleteTxn.id);
      toast.success('Transaction deleted');
      setDeleteTxn(null);
      await refreshAll();
    } catch (e) {
      toast.error('Failed to delete transaction');
    }
  };

  const handleMarkPaid = async (txn) => {
    try {
      await updateTransaction(txn.id, { transaction_type: 'Plot Payment' });
      toast.success(
        `Marked ₹${Number(txn.amount).toLocaleString('en-IN')} as Plot Payment`,
      );
      await refreshAll();
    } catch (e) {
      toast.error('Failed to mark as paid');
    }
  };


  const confirmDeletePlot = async () => {
    try {
      await deletePlot(id);
      toast.success('Plot deleted');
      navigate('/');
    } catch (e) {
      toast.error('Failed to delete plot');
    }
  };

  if (loading || !plot) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // person/bank breakdowns for this plot
  const personTotals = {};
  const bankTotals = {};
  for (const t of transactions) {
    if (['Plot Payment', 'Advance', 'Registration', 'Documentation'].includes(
      t.transaction_type,
    )) {
      personTotals[t.person] =
        (personTotals[t.person] || 0) + Number(t.amount || 0);
      bankTotals[t.bank] = (bankTotals[t.bank] || 0) + Number(t.amount || 0);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          data-testid="back-to-dashboard"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Plot summary header */}
      <section className="surface-card p-6 sm:p-8" data-testid="plot-detail-header">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <MapPin className="h-3 w-3" />
                <span>{plot.mauja}</span>
              </div>
              {plot.kisam ? (
                <span
                  className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  data-testid="plot-detail-kisam"
                >
                  {plot.kisam}
                </span>
              ) : null}
            </div>
            <h1
              className="font-display text-3xl sm:text-4xl tracking-tight font-bold"
              data-testid="plot-detail-name"
            >
              {plot.plot_name}
            </h1>
            <div className="text-sm text-muted-foreground mt-2 tabular">
              {formatNumber(plot.plot_size_sqft)} sqft · ₹
              {formatNumber(plot.buying_price_per_sqft)}/sqft buying · ₹
              {formatNumber(plot.govt_valuation_per_sqft)}/sqft govt
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button data-testid="add-transaction-button">
                  <Plus className="h-4 w-4 mr-2" /> Add Transaction
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:max-w-lg overflow-y-auto"
                data-testid="add-transaction-sheet"
              >
                <SheetHeader className="mb-6">
                  <SheetTitle className="font-display text-2xl tracking-tight">
                    Add Transaction
                  </SheetTitle>
                  <SheetDescription>
                    Record a payment, advance, withdrawal or fee for{' '}
                    <span className="font-medium text-foreground">
                      {plot.plot_name}
                    </span>
                  </SheetDescription>
                </SheetHeader>
                <TransactionForm plotId={id} onCreated={onTxnCreated} />
              </SheetContent>
            </Sheet>
            <Button
              variant="outline"
              className="text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200"
              onClick={() => setDeletePlotOpen(true)}
              data-testid="delete-plot-button"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete Plot
            </Button>
          </div>
        </div>

        {/* Cost grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-7 pt-7 border-t border-border">
          <SmallCell label="Plot Cost" value={plot.plot_cost} />
          <SmallCell label="Govt Value" value={plot.govt_value} />
          <SmallCell label="Reg. Fee" value={plot.registration_fee} />
          <SmallCell label="Other Charges" value={plot.other_charges} />
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Final Total"
          value={plot.final_total_cost}
          icon={Receipt}
          testId="stat-plot-final"
        />
        <StatCard
          label="Total Paid"
          value={plot.total_paid}
          tone="paid"
          icon={Wallet}
          testId="stat-plot-paid"
        />
        <StatCard
          label="Pending"
          value={plot.pending_amount}
          tone="pending"
          icon={TrendingDown}
          testId="stat-plot-pending"
        />
        <StatCard
          label="Reg. Base"
          value={plot.registration_base}
          icon={Landmark}
          hint={`@ ${plot.registration_percentage}%`}
          testId="stat-plot-reg-base"
        />
      </section>

      {/* Transactions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="label-overline">Activity</span>
            <h2 className="font-display text-2xl font-semibold tracking-tight mt-1">
              Transactions
            </h2>
          </div>
          <span className="text-sm text-muted-foreground tabular">
            {transactions.length} entr{transactions.length === 1 ? 'y' : 'ies'}
          </span>
        </div>

        {(() => {
          const PAID_TYPES = ['Plot Payment', 'Advance', 'Registration', 'Documentation'];
          const paidTxns = transactions.filter((t) => PAID_TYPES.includes(t.transaction_type));
          const withdrawalTxns = transactions.filter((t) => t.transaction_type === 'Withdrawal');
          const paidTotal = paidTxns.reduce((s, t) => s + Number(t.amount || 0), 0);
          const withdrawnTotal = withdrawalTxns.reduce((s, t) => s + Number(t.amount || 0), 0);

          return (
            <Tabs defaultValue="paid" className="space-y-4" data-testid="txn-tabs">
              <TabsList className="bg-secondary/60 p-1 h-auto">
                <TabsTrigger
                  value="paid"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2"
                  data-testid="tab-paid"
                >
                  <span className="font-medium">Paid</span>
                  <span className="ml-2 tabular text-xs text-muted-foreground">
                    ({paidTxns.length})
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="withdrawals"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2"
                  data-testid="tab-withdrawals"
                >
                  <span className="font-medium">Withdrawals</span>
                  <span className="ml-2 tabular text-xs text-muted-foreground">
                    ({withdrawalTxns.length})
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paid" className="space-y-4 mt-0">
                <TabSummary
                  label="Total Paid"
                  amount={paidTotal}
                  count={paidTxns.length}
                  tone="paid"
                  testId="paid-summary"
                />
                <TransactionTable
                  transactions={paidTxns}
                  onDelete={(t) => setDeleteTxn(t)}
                  emptyText="No paid transactions yet"
                />
              </TabsContent>

              <TabsContent value="withdrawals" className="space-y-4 mt-0">
                <TabSummary
                  label="Total Withdrawn"
                  amount={withdrawnTotal}
                  count={withdrawalTxns.length}
                  tone="withdrawal"
                  testId="withdrawn-summary"
                  hint="Use Mark Paid to convert into a Plot Payment"
                />
                <TransactionTable
                  transactions={withdrawalTxns}
                  onDelete={(t) => setDeleteTxn(t)}
                  onMarkPaid={handleMarkPaid}
                  emptyText="No withdrawals yet"
                />
              </TabsContent>
            </Tabs>
          );
        })()}
      </section>

      {/* Per-plot breakdowns */}
      {(Object.keys(personTotals).length > 0 ||
        Object.keys(bankTotals).length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <MiniBreakdown
            title="Person-wise"
            data={personTotals}
            testId="plot-person-breakdown"
          />
          <MiniBreakdown
            title="Bank-wise"
            data={bankTotals}
            testId="plot-bank-breakdown"
          />
        </section>
      )}

      {/* Delete txn dialog */}
      <AlertDialog
        open={!!deleteTxn}
        onOpenChange={(open) => !open && setDeleteTxn(null)}
      >
        <AlertDialogContent data-testid="delete-txn-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The amount will be removed from
              ledger totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-txn-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTxn}
              data-testid="delete-txn-confirm"
              className="bg-rose-700 hover:bg-rose-800"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete plot dialog */}
      <AlertDialog open={deletePlotOpen} onOpenChange={setDeletePlotOpen}>
        <AlertDialogContent data-testid="delete-plot-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plot?</AlertDialogTitle>
            <AlertDialogDescription>
              All associated transactions will also be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePlot}
              className="bg-rose-700 hover:bg-rose-800"
              data-testid="delete-plot-confirm"
            >
              Delete Plot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const SmallCell = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="label-overline text-[10px]">{label}</span>
    <span className="tabular text-base sm:text-lg font-semibold">
      {formatINR(value)}
    </span>
  </div>
);

const MiniBreakdown = ({ title, data, testId }) => {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 0;
  return (
    <div className="surface-card p-6" data-testid={testId}>
      <span className="label-overline">{title}</span>
      <h3 className="font-display text-lg font-semibold tracking-tight mt-1 mb-4">
        Breakdown
      </h3>
      <div className="space-y-3">
        {entries.map(([k, v]) => {
          const pct = max > 0 ? (v / max) * 100 : 0;
          return (
            <div key={k} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{k}</span>
                <span className="tabular text-sm font-semibold">
                  {formatINR(v)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary/90"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const TabSummary = ({ label, amount, count, tone, hint, testId }) => {
  const accent =
    tone === 'paid'
      ? 'border-l-emerald-700'
      : tone === 'withdrawal'
      ? 'border-l-amber-600'
      : 'border-l-primary';
  return (
    <div
      className={`surface-card border-l-4 ${accent} p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}
      data-testid={testId}
    >
      <div className="flex flex-col gap-1">
        <span className="label-overline">{label}</span>
        <span className="tabular text-2xl sm:text-3xl font-semibold tracking-tight">
          {formatINR(amount)}
        </span>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      <div className="text-right">
        <span className="label-overline text-[10px]">Count</span>
        <div className="tabular text-xl font-semibold mt-1">{count}</div>
      </div>
    </div>
  );
};
