import { BrowserRouter as Router } from 'react-router-dom';
import { CartProvider } from './hooks/useCart';
import { AppRouter } from './routes/AppRouter';
import { ToastProvider } from './components/ui/Toast';
import ScrollToTop from './components/layout/ScrollToTop';

import { ObserverBanner } from './components/dashboard/ObserverBanner';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <CartProvider>
        <ToastProvider>
          <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50">
            <ObserverBanner />
            <div className="flex-1 flex flex-col min-h-0 relative overflow-y-auto">
              <AppRouter />
            </div>
          </div>
        </ToastProvider>
      </CartProvider>
    </Router>
  );
}

export default App;
