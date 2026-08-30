import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { Home } from './pages/Home';
import type { Product, CartItem, UserProfile } from './types';
import { productsData } from './data/products';

export function App() {
  const [cart, setCart] = useState<CartItem[]>([
    { product: productsData[0], quantity: 1 },
    { product: productsData[1], quantity: 1 },
  ]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Surprises');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    showToast(`Welcome, ${authenticatedUser.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    showToast('You have signed out successfully.');
  };

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`Added "${product.name}" to cart!`);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart');
  };

  const handleCheckout = () => {
    showToast('Redirecting to secure bank checkout...');
  };

  const handleWishlistToggle = (product: Product) => {
    showToast(`Saved "${product.name}" to wishlist!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#141219]">
      {/* 1. Header / Navbar with Sign In, Sign Up & Profile */}
      <Header
        cartCount={totalCartCount}
        cartSubtotal={cartSubtotal}
        user={user}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onSearch={(q) => setSearchQuery(q)}
      />

      {/* Main Homepage Sections (2 through 7) */}
      <Home
        cart={cart}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onWishlistToggle={handleWishlistToggle}
      />

      {/* 8. Footer */}
      <Footer />

      {/* Sign In & Login / Create Account Modal Page */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Luxury Quick-Commerce Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#171219] text-white px-4 py-2 rounded-[14px] shadow-2xl text-xs font-bold animate-in fade-in duration-200 border border-stone-800 flex items-center gap-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
