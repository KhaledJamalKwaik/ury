import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, 
  ClipboardList, 
  Table,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { t } from '../i18n';

const Footer = () => {

  const navItems = [
    { icon: LayoutGrid, label: t('footer.pos'), path: '/' },
    {icon: Table, label: t('footer.table'), path: '/table'},
    { icon: ClipboardList, label: t('footer.orders'), path: '/orders' },
  ];

  return (
    <div className="bg-white border-t border-gray-200 py-1 md:py-2 relative pb-safe">
      <nav className="px-4">
        <div className="flex justify-around md:justify-center items-center md:gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center px-4 py-2 md:p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors min-w-[60px]',
                  isActive && 'text-blue-600'
                )
              }
            >
              <item.icon className="w-5 h-5 md:w-5 md:h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Footer; 