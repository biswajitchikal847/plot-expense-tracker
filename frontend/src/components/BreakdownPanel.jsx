import { formatINR } from '../utils/format';

export const BreakdownPanel = ({ title, data, testId }) => {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 0;

  return (
    <div className="surface-card p-6" data-testid={testId}>
      <span className="label-overline">{title}</span>
      <h3 className="font-display text-lg font-semibold tracking-tight mt-1 mb-4">
        Distribution
      </h3>
      {entries.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          No data yet
        </div>
      ) : (
        <div className="space-y-3.5">
          {entries.map(([key, val]) => {
            const pct = max > 0 ? (val / max) * 100 : 0;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium truncate">{key}</span>
                  <span className="tabular text-sm font-semibold">
                    {formatINR(val)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary/90 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
