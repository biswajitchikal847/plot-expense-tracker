import { Link } from 'react-router-dom';
import { usePlots } from '../hooks/usePlots';
import { useDashboard } from '../hooks/useDashboard';
import { StatCard } from '../components/StatCard';
import { PlotCard } from '../components/PlotCard';
import { BreakdownPanel } from '../components/BreakdownPanel';
import { Button } from '../components/ui/button';
import { Plus, Wallet, TrendingDown, Banknote, Coins, Loader2, FileDown } from 'lucide-react';
import { exportFullLedger } from '../utils/pdfExport';
import { useState } from 'react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { plots, loading: plotsLoading, refresh: refreshPlots } = usePlots();
  const { summary, loading: summaryLoading } = useDashboard();
  const [exporting, setExporting] = useState(false);

  const loading = plotsLoading || summaryLoading;

  const handleExport = async () => {
    if (plots.length === 0) {
      toast.error('No data to export yet');
      return;
    }
    setExporting(true);
    try {
      await exportFullLedger();
      toast.success('PDF exported');
    } catch (e) {
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Hero */}
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="label-overline">Overview</span>
          <h1
            className="font-display text-4xl sm:text-5xl tracking-tight font-bold mt-2"
            data-testid="dashboard-title"
          >
            Plot Ledger
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Track plot purchase expenses, registration calculations, contributions
            and bank-wise payments — all in one ledger.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="rounded-md"
            onClick={handleExport}
            disabled={exporting || loading}
            data-testid="dashboard-export-pdf"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
          <Link to="/plots/new" data-testid="dashboard-new-plot">
            <Button size="lg" className="rounded-md">
              <Plus className="h-4 w-4 mr-2" /> New Plot
            </Button>
          </Link>
        </div>
      </section>

      {/* Summary stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total Paid"
          value={summary?.total_paid}
          tone="paid"
          icon={Wallet}
          hint={`${summary?.transaction_count ?? 0} transactions`}
          testId="stat-total-paid"
        />
        <StatCard
          label="Pending"
          value={summary?.pending_amount}
          tone="pending"
          icon={TrendingDown}
          hint={`across ${summary?.plot_count ?? 0} plots`}
          testId="stat-pending"
        />
        <StatCard
          label="Online + UPI"
          value={summary?.online_total}
          tone="online"
          icon={Banknote}
          testId="stat-online"
        />
        <StatCard
          label="Cash + ATM"
          value={summary?.cash_total}
          tone="cash"
          icon={Coins}
          testId="stat-cash"
        />
      </section>

      {/* Plots */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="label-overline">Plots</span>
            <h2 className="font-display text-2xl font-semibold tracking-tight mt-1">
              Your Properties
            </h2>
          </div>
          <span className="text-sm text-muted-foreground tabular">
            {plots.length} plot{plots.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div
            className="flex items-center justify-center py-20"
            data-testid="dashboard-loading"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : plots.length === 0 ? (
          <div
            className="surface-card p-10 sm:p-16 text-center"
            data-testid="dashboard-empty-state"
          >
            <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-secondary/60 flex items-center justify-center">
              <Plus className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold tracking-tight">
              No plots yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
              Add your first plot to start tracking purchase expenses, registration
              fees and contributions.
            </p>
            <Link to="/plots/new">
              <Button className="mt-6">
                <Plus className="h-4 w-4 mr-2" /> Create First Plot
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {plots.map((p, i) => (
              <PlotCard key={p.id} plot={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Breakdowns */}
      {summary &&
      ((Object.keys(summary.person_totals || {}).length > 0) ||
        (Object.keys(summary.bank_totals || {}).length > 0)) ? (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <BreakdownPanel
            title="Person-wise Contributions"
            data={summary.person_totals}
            testId="breakdown-person"
          />
          <BreakdownPanel
            title="Bank-wise Outflows"
            data={summary.bank_totals}
            testId="breakdown-bank"
          />
        </section>
      ) : null}
      {/* hidden refresh helper for sub-components */}
      <button
        type="button"
        className="hidden"
        onClick={refreshPlots}
        data-testid="hidden-refresh-plots"
      >
        refresh
      </button>
    </div>
  );
}
