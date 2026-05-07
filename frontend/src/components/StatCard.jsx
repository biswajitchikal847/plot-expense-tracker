import { formatINR } from '../utils/format';

const tones = {
  default: 'bg-card border-border',
  paid: 'bg-card border-border',
  pending: 'bg-card border-border',
  online: 'bg-card border-border',
  cash: 'bg-card border-border',
};

const accentBar = {
  default: 'bg-primary',
  paid: 'bg-emerald-700',
  pending: 'bg-rose-800',
  online: 'bg-indigo-700',
  cash: 'bg-amber-600',
};

export const StatCard = ({
  label,
  value,
  hint,
  tone = 'default',
  icon: Icon,
  testId,
}) => {
  return (
    <div
      data-testid={testId}
      className={`relative overflow-hidden rounded-lg border ${tones[tone]} p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_12px_-4px_rgba(30,58,52,0.12)]`}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 ${accentBar[tone]}`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 min-w-0">
          <span className="label-overline">{label}</span>
          <span className="stat-value truncate" data-testid={`${testId}-value`}>
            {formatINR(value)}
          </span>
          {hint ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
        {Icon ? (
          <div className="h-9 w-9 rounded-md bg-secondary/60 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-foreground/70" />
          </div>
        ) : null}
      </div>
    </div>
  );
};
