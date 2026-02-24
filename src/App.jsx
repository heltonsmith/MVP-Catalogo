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
          <ObserverBanner />
          <AppRouter />
        </ToastProvider>
      </CartProvider>
    </Router>
  );
}

export default App;
