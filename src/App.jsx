import { BrowserRouter as Router } from 'react-router-dom';
import { CartProvider } from './hooks/useCart';
import { AppRouter } from './routes/AppRouter';
import { ToastProvider } from './components/ui/Toast';
import ScrollToTop from './components/layout/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <CartProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </CartProvider>
    </Router>
  );
}

export default App;
