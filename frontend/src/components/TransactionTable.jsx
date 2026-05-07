import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Trash2 } from 'lucide-react';
import { formatINR, formatDate } from '../utils/format';
import { TYPE_TONES, MODE_TONES } from '../utils/constants';

export const TransactionTable = ({ transactions, onDelete }) => {
  if (!transactions?.length) {
    return (
      <div
        className="surface-card p-10 text-center"
        data-testid="txn-empty-state"
      >
        <div className="font-display text-lg font-semibold mb-1">
          No transactions yet
        </div>
        <p className="text-sm text-muted-foreground">
          Add your first payment using the form above.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div
        className="hidden md:block surface-card overflow-hidden"
        data-testid="txn-table-desktop"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
              <TableHead className="label-overline">Date</TableHead>
              <TableHead className="label-overline">Person</TableHead>
              <TableHead className="label-overline">Type</TableHead>
              <TableHead className="label-overline">Mode</TableHead>
              <TableHead className="label-overline">Bank</TableHead>
              <TableHead className="label-overline">Notes</TableHead>
              <TableHead className="label-overline text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t, i) => (
              <TableRow
                key={t.id}
                data-testid={`txn-row-${i}`}
                className="hover:bg-secondary/30"
              >
                <TableCell className="tabular text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(t.created_at)}
                </TableCell>
                <TableCell className="font-medium">{t.person}</TableCell>
                <TableCell>
                  <Pill className={TYPE_TONES[t.transaction_type]}>
                    {t.transaction_type}
                  </Pill>
                </TableCell>
                <TableCell>
                  <Pill className={MODE_TONES[t.payment_mode]}>{t.payment_mode}</Pill>
                </TableCell>
                <TableCell className="text-sm">{t.bank}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {t.notes || '—'}
                </TableCell>
                <TableCell className="tabular text-right font-semibold">
                  {t.transaction_type === 'Withdrawal' ? '-' : '+'}
                  {formatINR(t.amount)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-rose-700"
                    onClick={() => onDelete?.(t)}
                    data-testid={`txn-delete-${i}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3" data-testid="txn-list-mobile">
        {transactions.map((t, i) => (
          <div
            key={t.id}
            className="surface-card p-4"
            data-testid={`txn-mobile-${i}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground tabular mb-0.5">
                  {formatDate(t.created_at)}
                </div>
                <div className="font-semibold">{t.person}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="tabular font-semibold">
                  {t.transaction_type === 'Withdrawal' ? '-' : '+'}
                  {formatINR(t.amount)}
                </div>
                <div className="text-xs text-muted-foreground">{t.bank}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Pill className={TYPE_TONES[t.transaction_type]}>
                {t.transaction_type}
              </Pill>
              <Pill className={MODE_TONES[t.payment_mode]}>{t.payment_mode}</Pill>
            </div>
            {t.notes ? (
              <div className="mt-2 text-xs text-muted-foreground">{t.notes}</div>
            ) : null}
            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-700"
                onClick={() => onDelete?.(t)}
                data-testid={`txn-delete-mobile-${i}`}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const Pill = ({ className = '', children }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}
  >
    {children}
  </span>
);
