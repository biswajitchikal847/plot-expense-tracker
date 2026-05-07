import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppHeader } from './components/AppHeader';
import DashboardPage from './pages/DashboardPage';
import CreatePlotPage from './pages/CreatePlotPage';
import PlotDetailPage from './pages/PlotDetailPage';

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <AppHeader />
        <main>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/plots/new" element={<CreatePlotPage />} />
            <Route path="/plots/:id" element={<PlotDetailPage />} />
          </Routes>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                'bg-card border-border text-foreground rounded-md shadow-sm',
            },
          }}
        />
      </BrowserRouter>
    </div>
  );
}

export default App;
