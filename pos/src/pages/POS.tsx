import React, { useState, useRef, useEffect } from 'react';
import { t } from '../i18n';
import { Star, TrendingUp, ShoppingCart, X, ArrowLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import OrderPanel from '../components/OrderPanel';
import ProductDialog from '../components/ProductDialog';
import MenuList from '../components/MenuList';
import SearchBar from '../components/SearchBar';
import { usePOSStore } from '../store/pos-store';
import { cn } from '../lib/utils';
import { Spinner } from '../components/ui/spinner';
import InitialLoader from '../components/InitialLoader';

export default function POS() {
  const {
    searchQuery,
    setSearchQuery,
    quickFilter,
    setQuickFilter,
    setSelectedItem,
    addToOrder,
    loading,
    error,
    isMenuInteractionDisabled,
    isInitializing,
    activeOrders,
  } = usePOSStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  // Mobile cart drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);

  useEffect(() => {
    if (showSearch) {
      // SearchBar component handles its own focus
    }
  }, [showSearch]);

  const handleItemClick = (item: any) => {
    if (isMenuInteractionDisabled()) return;
    
    clickCountRef.current += 1;
    
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      if (clickCountRef.current === 1) {
        addToOrder({ ...item, quantity: 1 });
      } else if (clickCountRef.current === 2) {
        setSelectedItem(item);
        setIsDialogOpen(true);
      }
      clickCountRef.current = 0;
    }, 250);
  };

  const QuickFilterButton = ({ filter, icon: Icon, label }: { 
    filter: 'all' | 'special';
    icon: React.ElementType;
    label: string;
  }) => (
    <button
      onClick={() => setQuickFilter(filter)}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
        quickFilter === filter
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        isMenuInteractionDisabled() && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
      disabled={isMenuInteractionDisabled()}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  if (isInitializing) {
    return <InitialLoader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-600 mb-2">Failed to load POS</p>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner message={t('common.loading_menu_items')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1 h-full overflow-hidden relative">
      {/* Sidebar — vertical on desktop, horizontal strip on mobile (rendered inside component) */}
      <Sidebar disabled={isMenuInteractionDisabled()} />

      {/* Main menu area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filter/search bar */}
        <div className="p-3 md:p-4 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-screen-xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden">
              <QuickFilterButton filter="all" icon={Star} label={t('common.all')} />
              <QuickFilterButton filter="special" icon={TrendingUp} label={t('menu.special_items')} />
            </div>
          </div>
        </div>

        <MenuList onItemClick={handleItemClick} />
      </div>

      {/* ── Desktop OrderPanel (fixed right, hidden on mobile/tablet) ── */}
      <div className="hidden 2xl:block 2xl:w-96 flex-shrink-0">
        <OrderPanel />
      </div>

      {/* ── Mobile: Floating cart button ── */}
      {!isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="2xl:hidden fixed bottom-20 end-4 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
          aria-label="Open cart"
        >
          <ShoppingCart className="w-6 h-6" />
          {activeOrders.length > 0 && (
            <span className="absolute -top-1 -end-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeOrders.length > 9 ? '9+' : activeOrders.length}
            </span>
          )}
        </button>
      )}

      {/* ── Mobile/Tablet: Cart full-screen overlay ── */}
      {isCartOpen && (
        <div className="2xl:hidden fixed inset-0 z-50 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-white min-h-[64px] flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 -ms-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Back to menu"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">{t('cart.title') || 'Your Order'}</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-gray-100"
              aria-label="Close cart"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-hidden relative">
            <OrderPanel mobileMode onClose={() => setIsCartOpen(false)} />
          </div>
        </div>
      )}

      {isDialogOpen && <ProductDialog onClose={() => setIsDialogOpen(false)} />}
    </div>
  );
}
