import React from 'react';
import { Cake, UtensilsCrossed, Wine, Settings } from 'lucide-react';
import type { CategoryOverview } from '../../types';

interface BusinessOverviewProps {
  title: string;
  subtitle: string;
  categories: CategoryOverview[];
  totalCount: number;
}

const getColorClasses = (
  color: string
): {
  bar: string;
  dot: string;
  text: string;
  bg: string;
} => {
  const colorMap: Record<
    string,
    { bar: string; dot: string; text: string; bg: string }
  > = {
    blue: { bar: 'bg-blue-600', dot: 'bg-blue-600', text: 'text-blue-600', bg: 'bg-blue-100' },
    teal: {
      bar: 'bg-teal-500',
      dot: 'bg-teal-500',
      text: 'text-teal-600',
      bg: 'bg-teal-100',
    },
    orange: {
      bar: 'bg-orange-500',
      dot: 'bg-orange-500',
      text: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    purple: {
      bar: 'bg-purple-600',
      dot: 'bg-purple-600',
      text: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  };
  return colorMap[color] || colorMap.blue;
};

const getIcon = (icon?: string) => {
  switch (icon) {
    case 'UtensilsCrossed':
      return <UtensilsCrossed className="w-5 h-5" />;
    case 'Wine':
      return <Wine className="w-5 h-5" />;
    case 'Cake':
      return <Cake className="w-5 h-5" />;
    case 'Settings':
      return <Settings className="w-5 h-5" />;
    default:
      return null;
  }
};

export const BusinessOverview: React.FC<BusinessOverviewProps> = ({
  title,
  subtitle,
  categories,
  totalCount,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500">
          {subtitle} (ทั้งหมด {totalCount} สัติ)
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((category) => {
          const colors = getColorClasses(category.color);

          return (
            <div key={category.id}>
              {/* Category Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`${colors.bg} ${colors.text} p-2 rounded-lg`}>
                    {getIcon(category.icon)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.count} รายการ</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {category.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full ${colors.bar} transition-all duration-500 rounded-full`}
                  style={{ width: `${category.percentage}%` }}
                  role="progressbar"
                  aria-valuenow={category.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${category.name} progress`}
                />
              </div>

              {/* Stats */}
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>
                  {category.percentage}% ({category.count} สัติ)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.map((category) => (
          <div key={category.id} className="text-center">
            <div className="text-lg font-bold text-gray-900">{category.percentage}%</div>
            <div className="text-xs text-gray-500 mt-1 truncate">{category.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
