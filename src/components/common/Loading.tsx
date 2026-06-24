import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

const getSizeClasses = (size: string): string => {
  const sizeMap: Record<string, string> = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };
  return sizeMap[size] || sizeMap.md;
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'กำลังโหลด...',
  fullScreen = false,
}) => {
  const sizeClasses = getSizeClasses(size);

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
        role="status"
        aria-label="Loading"
      >
        <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
          <div
            className={`${sizeClasses} border-gray-300 border-t-blue-600 rounded-full animate-spin`}
          />
          {message && <p className="text-gray-600 text-center">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-8"
      role="status"
      aria-label="Loading"
    >
      <div
        className={`${sizeClasses} border-gray-300 border-t-blue-600 rounded-full animate-spin`}
      />
      {message && <p className="text-gray-600 text-center text-sm">{message}</p>}
    </div>
  );
};

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-10 bg-gray-200 rounded w-full mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </>
  );
};
