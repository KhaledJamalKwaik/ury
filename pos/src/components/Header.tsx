import { useState, useEffect, useRef } from 'react';
import { t } from '../i18n';
import { Link, useLocation } from 'react-router-dom';
import { 
  Command,
  User,
  ChevronDown,
  Monitor,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Button, Input } from './ui';
import { useRootStore } from '../store/root-store';
import { usePOSStore } from '../store/pos-store';
import type { RootState } from '../store/root-store';
import { logout } from '../lib/auth-api';
import { showToast } from './ui/toast';
import { getFileUrl } from '../lib/utils';

const Header = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const user = useRootStore((state: RootState) => state.user);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { searchQuery, setSearchQuery } = usePOSStore();
  const { orderSearchQuery, setOrderSearchQuery, brandLogo } = useRootStore();
  const [orderSearchInput, setOrderSearchInput] = useState(orderSearchQuery);

  // Determine placeholder and handlers based on route
  let searchPlaceholder = t('header.search_placeholder_default');
  let searchValue: string | undefined = undefined;
  let searchOnChange: ((e: React.ChangeEvent<HTMLInputElement>) => void) | undefined = undefined;
  if (location.pathname === '/orders') {
    searchPlaceholder = t('header.search_placeholder_orders');
    searchValue = orderSearchInput;
    searchOnChange = (e) => setOrderSearchInput(e.target.value);
  } else if (location.pathname === '/') {
    searchPlaceholder = t('header.search_placeholder_menu');
    searchValue = searchQuery;
    searchOnChange = (e) => setSearchQuery(e.target.value);
  }

  // Debounce order search
  useEffect(() => {
    if (location.pathname !== '/orders') return;
    const handler = setTimeout(() => {
      setOrderSearchQuery(orderSearchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [orderSearchInput, setOrderSearchQuery, location.pathname]);

  // Keep input in sync with store (if cleared elsewhere)
  useEffect(() => {
    if (location.pathname === '/orders') {
      setOrderSearchInput(orderSearchQuery);
    }
  }, [location.pathname, orderSearchQuery]);

  // Handle clicks outside of menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login?redirect-to=%2Fpos';
    } catch (error) {
      showToast.error(t('errors.failed_logout'));
    }
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const showMobileSearch = location.pathname === '/' || location.pathname === '/orders';

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Main header row */}
      <div className="flex items-center justify-between h-14 md:h-16 px-3 md:px-6">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={getFileUrl(brandLogo) || "/assets/ury/Images/URY-POS.jpg"} 
              alt="Brand Logo" 
              className="h-8 md:h-10 w-auto object-contain"
              onError={(e) => {
                console.warn('Brand logo failed to load, falling back to default.');
                e.currentTarget.src = "/assets/ury/Images/URY-POS.jpg";
              }}
            />
          </Link>
        </div>

        {/* Search Bar — hidden on mobile, shown md+ inline */}
        <div className="hidden md:flex px-4 py-2 flex-1 items-center mx-4 md:mx-8 bg-gray-50 hover:bg-gray-100 border border-input rounded-md">
          <Input
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            className="h-fit p-0 w-full bg-transparent border-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchValue}
            onChange={searchOnChange}
          />
          <div className="flex items-center gap-2 text-gray-400">
            <Command className="w-4 h-4" />
            <span>K</span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <Button
              onClick={handleUserMenuToggle}
              variant="ghost"
              className="flex items-center gap-1 md:gap-2 text-gray-600 hover:text-gray-900 px-1.5 md:px-3"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">{user?.full_name || 'User'}</span>
              <ChevronDown className="hidden md:block w-4 h-4" />
            </Button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute end-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.name || ''}</p>
                </div>
                <div className="py-2">
                  <Button
                    variant="ghost"
                    className="flex justify-start items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => window.location.href = '/app'}
                  >
                    <Monitor className="w-4 h-4 me-3" />
                    {t('header.switch_to_desk')}
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex justify-start items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={handleClearCache}
                  >
                    <RefreshCw className="w-4 h-4 me-3" />
                    {t('header.clear_cache')}
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex justify-start items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 me-3" />
                    {t('header.logout')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search strip — shown below the icons row only on small screens */}
      {showMobileSearch && (
        <div className="flex md:hidden px-3 pb-2">
          <div className="flex items-center w-full bg-gray-50 border border-input rounded-md px-3 py-1.5">
            <Input
              placeholder={searchPlaceholder}
              className="h-fit p-0 w-full bg-transparent border-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              value={searchValue}
              onChange={searchOnChange}
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;