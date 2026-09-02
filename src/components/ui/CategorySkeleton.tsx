import React from 'react';
import { Skeleton } from './Skeleton';

export interface CategorySkeletonProps {
  className?: string;
}

export const CategorySkeleton: React.FC<CategorySkeletonProps> = ({
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`p-3.5 sm:p-4 rounded-[20px] border border-[#eee7ed] bg-white flex flex-col items-center text-center shadow-[0_4px_16px_rgba(50,31,63,0.03)] select-none ${className}`}
    >
      {/* Category Image Box Skeleton */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[16px] overflow-hidden bg-gray-700 skeleton-shimmer mb-3" />

      {/* Category Title Skeleton */}
      <Skeleton className="h-3.5 w-20 rounded-md mb-1.5" />

      {/* Category Tagline Skeleton */}
      <Skeleton className="h-2.5 w-24 rounded-md" />
    </div>
  );
};

export default CategorySkeleton;
