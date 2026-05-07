import { Link } from 'react-router-dom';
import { CreatePlotForm } from '../components/CreatePlotForm';
import { ChevronLeft } from 'lucide-react';

export default function CreatePlotPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="back-to-dashboard"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="mt-3">
          <span className="label-overline">New Plot</span>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">
            Add a new plot
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
            Enter your plot details. Registration fee is auto-calculated on the
            higher of plot cost or government value.
          </p>
        </div>
      </div>
      <CreatePlotForm />
    </div>
  );
}
