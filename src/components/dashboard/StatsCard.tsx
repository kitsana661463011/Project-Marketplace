import React from 'react';
import { Star, CheckCircle, AlertCircle, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import type { StatsCardData } from '../../types';

interface StatsCardProps {
  data: StatsCardData;
  className?: string;
}

const getColorClasses = (color?: string) => {
  const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
    green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-600' },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
    },
  };
  return colorMap[color || 'blue'];
};

const getBadgeClasses = (status?: string) => {
  const statusMap: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  return statusMap[status || 'info'];
};

export const StatsCard: React.FC<StatsCardProps> = ({ data, className = '' }) => {
  const colors = getColorClasses(data.color);

  const getIcon = () => {
    switch (data.icon) {
      case 'star':
        return <Star className={`w-6 h-6 ${colors.icon}`} />;
      case 'check':
        return <CheckCircle className={`w-6 h-6 ${colors.icon}`} />;
      case 'alert':
        return <AlertCircle className={`w-6 h-6 ${colors.icon}`} />;
      case 'bell':
        return <Bell className={`w-6 h-6 ${colors.icon}`} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      {/* Icon */}
      <div className="flex items-start justify-between mb-4">
        {getIcon()}
        {data.trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              data.trend === 'up'
                ? 'text-green-600'
                : data.trend === 'down'
                  ? 'text-red-600'
                  : 'text-gray-600'
            }`}
          >
            {data.trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {data.trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {data.trendValue}
          </div>
        )}
      </div>

      {/* Content */}
      <h3 className="text-sm text-gray-600 font-medium mb-2">{data.title}</h3>

      <div className="flex items-end gap-2 mb-4">
        <div className="text-4xl font-bold text-gray-900">{data.value}</div>
        {data.unit && <span className="text-sm text-gray-500 pb-1">{data.unit}</span>}
      </div>

      {/* Badge */}
      {data.badge && (
        <div
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getBadgeClasses(
            data.badge.color
          )}`}
        >
          {data.badge.label}
        </div>
      )}
    </div>
  );
};
