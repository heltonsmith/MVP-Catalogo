import { BrowserRouter as Router } from 'react-router-dom';
import { CartProvider } from './hooks/useCart';
import { AppRouter } from './routes/AppRouter';

function App() {
  return (
    <Router>
      <CartProvider>
        <AppRouter />
      </CartProvider>
    </Router>
  );
}

export default App;
