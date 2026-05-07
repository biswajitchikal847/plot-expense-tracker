import { Link } from 'react-router-dom';
import { formatINR, formatNumber } from '../utils/format';
import { MapPin, ArrowUpRight } from 'lucide-react';

export const PlotCard = ({ plot, index }) => {
  const pending = plot.pending_amount ?? 0;
  const paid = plot.total_paid ?? 0;
  const total = plot.final_total_cost ?? 0;
  const pct = total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;

  return (
    <Link
      to={`/plots/${plot.id}`}
      data-testid={`plot-card-${index}`}
      className="group surface-card surface-card-hover p-6 flex flex-col gap-5 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{plot.mauja}</span>
            </div>
            {plot.kisam ? (
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                {plot.kisam}
              </span>
            ) : null}
          </div>
          <h3 className="font-display font-semibold text-xl tracking-tight truncate">
            {plot.plot_name}
          </h3>
          <div className="text-xs text-muted-foreground mt-1 tabular">
            {formatNumber(plot.plot_size_sqft)} sqft · ₹
            {formatNumber(plot.buying_price_per_sqft)}/sqft
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Cell label="Plot Cost" value={formatINR(plot.plot_cost)} />
        <Cell label="Govt Value" value={formatINR(plot.govt_value)} />
        <Cell label="Reg. Fee" value={formatINR(plot.registration_fee)} />
        <Cell label="Final Total" value={formatINR(total)} bold />
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-baseline justify-between text-xs">
          <span className="label-overline">Paid</span>
          <span className="tabular text-muted-foreground">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <div>
            <div className="label-overline mb-0.5">Total Paid</div>
            <div
              className="tabular font-semibold text-emerald-800"
              data-testid={`plot-card-paid-${index}`}
            >
              {formatINR(paid)}
            </div>
          </div>
          <div className="text-right">
            <div className="label-overline mb-0.5">Pending</div>
            <div
              className={`tabular font-semibold ${
                pending > 0 ? 'text-rose-800' : 'text-emerald-800'
              }`}
              data-testid={`plot-card-pending-${index}`}
            >
              {formatINR(pending)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const Cell = ({ label, value, bold }) => (
  <div className="flex flex-col gap-0.5">
    <span className="label-overline text-[10px]">{label}</span>
    <span
      className={`tabular text-sm ${
        bold ? 'font-semibold text-foreground' : 'text-foreground/85'
      }`}
    >
      {value}
    </span>
  </div>
);
