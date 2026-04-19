import { 
  Grid3X3,
  UtensilsCrossed,
} from 'lucide-react';
import { usePOSStore } from '../store/pos-store';
import { cn } from '../lib/utils';
import { Button, Badge } from './ui';
import CommentDialog from './CommentDialog';
import { useState } from 'react';
import { t } from '../i18n';

interface SidebarProps {
  disabled?: boolean;
}

const Sidebar = ({ disabled }: SidebarProps) => {
  const { selectedCategory, setSelectedCategory, menuItems, categories, orderComment, setOrderComment } = usePOSStore();
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  // Count items per category
  const getCategoryCount = (category: string) => {
    return menuItems.filter(item => item.course === category).length;
  };

  const getAllItemsCount = () => menuItems.length;

  const handleCommentSave = (comment: string) => {
    setOrderComment(comment);
  };

  // Shared category item renderer
  const allCategoryItems = [
    { name: '', label: t('pos_sidebar.all_items'), count: getAllItemsCount() },
    ...categories.map(cat => ({ name: cat.name, label: cat.label, count: getCategoryCount(cat.name) })),
  ];

  return (
    <>
      {/* ── Desktop sidebar (lg+) ── */}
      <div className={cn(
        "hidden lg:flex w-64 bg-white border-e border-gray-200 h-full flex-col",
        disabled && "opacity-50 pointer-events-none"
      )}>
        <nav className="flex-1 p-6 overflow-y-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 px-1">
              {t('pos_sidebar.categories')}
            </h2>

            {/* All Items */}
            <Button
              onClick={() => setSelectedCategory('')}
              variant="ghost"
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative mb-1',
                selectedCategory === ''
                  ? 'bg-white text-gray-900 shadow-sm font-semibold'
                  : 'text-gray-700 hover:bg-white/60 hover:text-gray-900'
              )}
              disabled={disabled}
            >
              {selectedCategory === '' && (
                <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-e-full" />
              )}
              <div className="flex items-center gap-3 ms-1">
                <Grid3X3 className="w-4 h-4 text-gray-500" />
                <span>{t('pos_sidebar.all_items')}</span>
              </div>
              <Badge variant="secondary" size="sm" className="text-xs text-gray-500 bg-gray-100 min-w-[24px] text-center">
                {getAllItemsCount()}
              </Badge>
            </Button>

            <div className="h-px bg-gray-200 my-3 mx-1" />

            <div className="space-y-1">
              {categories.map((category) => {
                const count = getCategoryCount(category.name);
                return (
                  <Button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    variant="ghost"
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                      selectedCategory === category.name
                        ? 'bg-white text-gray-900 shadow-sm font-semibold'
                        : 'text-gray-700 hover:bg-white/60 hover:text-gray-900'
                    )}
                    disabled={disabled}
                  >
                    {selectedCategory === category.name && (
                      <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-e-full" />
                    )}
                    <div className="flex items-center gap-3 ms-1">
                      <UtensilsCrossed className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-start">{category.label}</span>
                    </div>
                    <Badge variant="secondary" size="sm" className="text-xs text-gray-500 bg-gray-100 min-w-[24px] text-center">
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        </nav>

        <CommentDialog
          isOpen={showCommentDialog}
          onClose={() => setShowCommentDialog(false)}
          onSave={handleCommentSave}
          initialComment={orderComment}
        />
      </div>

      {/* ── Mobile horizontal category strip (hidden lg+) ── */}
      <div className={cn(
        "flex lg:hidden w-full bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide",
        disabled && "opacity-50 pointer-events-none"
      )}>
        <div className="flex items-center gap-2 px-3 py-2 min-w-max">
          {allCategoryItems.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                selectedCategory === cat.name
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {cat.name === '' ? (
                <Grid3X3 className="w-3 h-3" />
              ) : (
                <UtensilsCrossed className="w-3 h-3" />
              )}
              {cat.label}
              <span className={cn(
                'ml-0.5 px-1 rounded-full text-[10px] font-semibold',
                selectedCategory === cat.name ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
              )}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;