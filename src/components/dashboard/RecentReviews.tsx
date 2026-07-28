import React from 'react';
import { CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import type { Review } from '../../types';
import { formatImageUrl } from '../../utils/imageUtils';

interface RecentReviewsProps {
  reviews: Review[];
  onViewAll?: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'warning':
      return <Clock className="w-5 h-5 text-yellow-600" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-600" />;
    default:
      return null;
  }
};

const getStatusBadgeClass = (status: string) => {
  const statusMap: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

  return date.toLocaleDateString('th-TH');
};

export const RecentReviews: React.FC<RecentReviewsProps> = ({
  reviews,
  onViewAll,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">รายการจองสัติ</h2>
          <p className="text-sm text-gray-500 mt-1">ตรวจสอบและการจัดการ</p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            ดูทั้งหมด →
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">ไม่มีรายการการตรวจสอบล่าสุด</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              {review.avatar ? (
                <img
                  src={formatImageUrl(review.avatar)}
                  alt={review.storeName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gray-600">
                    {review.storeName.charAt(0)}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {review.storeName}
                    </h3>
                    <p className="text-xs text-gray-500">ID: {review.storeId}</p>
                  </div>
                  {getStatusIcon(review.status)}
                </div>

                <p className="text-sm text-gray-600 mb-2">{review.message}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {formatTime(review.timestamp)}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeClass(
                      review.status
                    )}`}
                  >
                    {review.status === 'success' && 'ผ่าน'}
                    {review.status === 'warning' && 'รอการตรวจสอบ'}
                    {review.status === 'error' && 'ปฏิเสธ'}
                    {review.status === 'info' && 'ข้อมูล'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Action */}
      {reviews.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={onViewAll}
            className="w-full py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            ดูรายการทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};
