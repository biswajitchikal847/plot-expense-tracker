import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import { createTransaction } from '../services/api';
import { BANKS, PAYMENT_MODES, TRANSACTION_TYPES } from '../utils/constants';
import { Loader2, Eraser, PlusCircle } from 'lucide-react';

const initialState = {
  person: '',
  bank: '',
  payment_mode: '',
  transaction_type: '',
  amount: '',
  notes: '',
};

export const TransactionForm = ({ plotId, onCreated }) => {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    if (!form.person.trim()) return 'Person is required';
    if (!form.bank) return 'Select a bank';
    if (!form.payment_mode) return 'Select a payment mode';
    if (!form.transaction_type) return 'Select a transaction type';
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return 'Amount must be greater than 0';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        plot_id: plotId,
        person: form.person.trim(),
        bank: form.bank,
        payment_mode: form.payment_mode,
        transaction_type: form.transaction_type,
        amount: Number(form.amount),
        notes: form.notes.trim(),
      };
      const txn = await createTransaction(payload);
      toast.success('Transaction added');
      setForm(initialState);
      onCreated?.(txn);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      data-testid="transaction-form"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Person">
          <Input
            data-testid="txn-person-input"
            value={form.person}
            onChange={(e) => set('person', e.target.value)}
            placeholder="e.g. Rahul"
          />
        </Field>

        <Field label="Amount (₹)">
          <Input
            data-testid="txn-amount-input"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="100000"
            className="tabular"
          />
        </Field>

        <Field label="Bank">
          <Select value={form.bank} onValueChange={(v) => set('bank', v)}>
            <SelectTrigger data-testid="txn-bank-select">
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>
            <SelectContent>
              {BANKS.map((b) => (
                <SelectItem key={b} value={b} data-testid={`txn-bank-option-${b}`}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Payment Mode">
          <Select
            value={form.payment_mode}
            onValueChange={(v) => set('payment_mode', v)}
          >
            <SelectTrigger data-testid="txn-mode-select">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODES.map((m) => (
                <SelectItem key={m} value={m} data-testid={`txn-mode-option-${m}`}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Transaction Type" full>
          <Select
            value={form.transaction_type}
            onValueChange={(v) => set('transaction_type', v)}
          >
            <SelectTrigger data-testid="txn-type-select">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t} data-testid={`txn-type-option-${t}`}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Notes (optional)">
        <Textarea
          data-testid="txn-notes-input"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Cheque #, reference, remarks..."
          rows={3}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={submitting}
          data-testid="txn-submit-button"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4 mr-2" />
          )}
          Add Transaction
        </Button>
        <Button
          type="button"
          variant="ghost"
          data-testid="txn-clear-button"
          onClick={() => setForm(initialState)}
        >
          <Eraser className="h-4 w-4 mr-2" /> Clear
        </Button>
      </div>
    </form>
  );
};

const Field = ({ label, children, full }) => (
  <div className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
    <Label className="label-overline text-[10px]">{label}</Label>
    {children}
  </div>
);
