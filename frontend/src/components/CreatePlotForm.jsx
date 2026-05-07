import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { createPlot } from '../services/api';
import { formatINR } from '../utils/format';
import { Loader2, Eraser, Save } from 'lucide-react';

const initialState = {
  plot_name: '',
  mauja: '',
  plot_size_sqft: '',
  buying_price_per_sqft: '',
  govt_valuation_per_sqft: '',
  registration_percentage: '',
  other_charges: '',
};

export const CreatePlotForm = ({ onCreated }) => {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const num = (v) => (v === '' || v === null ? 0 : Number(v));

  // Live calculations
  const plotCost = num(form.plot_size_sqft) * num(form.buying_price_per_sqft);
  const govtValue = num(form.plot_size_sqft) * num(form.govt_valuation_per_sqft);
  const regBase = Math.max(plotCost, govtValue);
  const regFee = regBase * (num(form.registration_percentage) / 100);
  const finalTotal = plotCost + regFee + num(form.other_charges);

  const validate = () => {
    if (!form.plot_name.trim()) return 'Plot name is required';
    if (!form.mauja.trim()) return 'Mauja / Area is required';
    if (num(form.plot_size_sqft) <= 0) return 'Plot size must be greater than 0';
    if (num(form.buying_price_per_sqft) <= 0)
      return 'Buying price must be greater than 0';
    if (num(form.govt_valuation_per_sqft) < 0)
      return 'Government valuation cannot be negative';
    if (num(form.registration_percentage) < 0)
      return 'Registration % cannot be negative';
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
        plot_name: form.plot_name.trim(),
        mauja: form.mauja.trim(),
        plot_size_sqft: num(form.plot_size_sqft),
        buying_price_per_sqft: num(form.buying_price_per_sqft),
        govt_valuation_per_sqft: num(form.govt_valuation_per_sqft),
        registration_percentage: num(form.registration_percentage),
        other_charges: num(form.other_charges),
      };
      const plot = await createPlot(payload);
      toast.success(`Plot "${plot.plot_name}" created`);
      setForm(initialState);
      onCreated?.(plot);
      navigate(`/plots/${plot.id}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to create plot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      data-testid="create-plot-form"
    >
      <div className="lg:col-span-2 surface-card p-6 sm:p-8 space-y-6">
        <header className="flex flex-col gap-1">
          <span className="label-overline">Plot Details</span>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Create New Plot
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter plot details. Costs and registration fees are calculated
            automatically.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Plot Name" required>
            <Input
              data-testid="plot-name-input"
              value={form.plot_name}
              onChange={update('plot_name')}
              placeholder="e.g. Greenfield A-12"
            />
          </Field>
          <Field label="Mauja / Area" required>
            <Input
              data-testid="plot-mauja-input"
              value={form.mauja}
              onChange={update('mauja')}
              placeholder="e.g. Khasra 412, Mauja Bisrakh"
            />
          </Field>
          <Field label="Plot Size (Sq Ft)" required>
            <Input
              data-testid="plot-size-input"
              type="number"
              step="0.01"
              value={form.plot_size_sqft}
              onChange={update('plot_size_sqft')}
              placeholder="1500"
              className="tabular"
            />
          </Field>
          <Field label="Buying Price / Sq Ft" required>
            <Input
              data-testid="plot-buying-price-input"
              type="number"
              step="0.01"
              value={form.buying_price_per_sqft}
              onChange={update('buying_price_per_sqft')}
              placeholder="3500"
              className="tabular"
            />
          </Field>
          <Field label="Govt Valuation / Sq Ft" required>
            <Input
              data-testid="plot-govt-valuation-input"
              type="number"
              step="0.01"
              value={form.govt_valuation_per_sqft}
              onChange={update('govt_valuation_per_sqft')}
              placeholder="2800"
              className="tabular"
            />
          </Field>
          <Field label="Registration %" required>
            <Input
              data-testid="plot-reg-percent-input"
              type="number"
              step="0.01"
              value={form.registration_percentage}
              onChange={update('registration_percentage')}
              placeholder="7"
              className="tabular"
            />
          </Field>
          <Field label="Other Charges (₹)">
            <Input
              data-testid="plot-other-charges-input"
              type="number"
              step="0.01"
              value={form.other_charges}
              onChange={update('other_charges')}
              placeholder="50000"
              className="tabular"
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={submitting}
            data-testid="plot-submit-button"
            className="rounded-md font-medium"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Create Plot
          </Button>
          <Button
            type="button"
            variant="ghost"
            data-testid="plot-clear-button"
            onClick={() => setForm(initialState)}
          >
            <Eraser className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <aside
        className="surface-card p-6 sm:p-8 self-start lg:sticky lg:top-24"
        data-testid="plot-preview"
      >
        <span className="label-overline">Live Calculation</span>
        <h3 className="font-display text-lg font-semibold tracking-tight mt-1 mb-5">
          Cost Breakdown
        </h3>
        <div className="space-y-3">
          <Row label="Plot Cost" value={formatINR(plotCost)} />
          <Row label="Government Value" value={formatINR(govtValue)} />
          <Row
            label={`Reg. Base (max)`}
            value={formatINR(regBase)}
            sub
          />
          <Row
            label={`Reg. Fee (${num(form.registration_percentage)}%)`}
            value={formatINR(regFee)}
          />
          <Row label="Other Charges" value={formatINR(num(form.other_charges))} />
          <div className="border-t border-border my-3" />
          <div className="flex items-baseline justify-between">
            <span className="label-overline">Final Total</span>
            <span
              className="tabular text-2xl font-semibold tracking-tight"
              data-testid="plot-preview-final-total"
            >
              {formatINR(finalTotal)}
            </span>
          </div>
        </div>
      </aside>
    </form>
  );
};

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <Label className="label-overline text-[10px]">
      {label} {required ? <span className="text-rose-700">*</span> : null}
    </Label>
    {children}
  </div>
);

const Row = ({ label, value, sub }) => (
  <div className="flex items-baseline justify-between gap-3">
    <span
      className={`text-sm ${sub ? 'text-muted-foreground' : 'text-foreground/80'}`}
    >
      {label}
    </span>
    <span className="tabular text-sm font-medium">{value}</span>
  </div>
);
