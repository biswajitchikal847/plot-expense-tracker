import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Plus, LayoutDashboard, Map } from 'lucide-react';

export const AppHeader = () => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <header
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-border/60"
      data-testid="app-header"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" data-testid="brand-link">
            <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Map className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-[15px] tracking-tight">
                Plot Ledger
              </span>
              <span className="label-overline text-[9px]">
                Real Estate Expense Tracker
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" data-testid="nav-dashboard">
              <Button
                variant={isHome ? 'secondary' : 'ghost'}
                size="sm"
                className="font-medium"
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" /> Dashboard
              </Button>
            </Link>
          </nav>

          <Link to="/plots/new" data-testid="header-create-plot">
            <Button size="sm" className="rounded-md font-medium">
              <Plus className="h-4 w-4 mr-1.5" /> New Plot
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
