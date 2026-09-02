import React from 'react';
import { Skeleton } from './Skeleton';

export interface ProductCardSkeletonProps {
  className?: string;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`rounded-[20px] bg-white border border-[#eee7ed] p-3 sm:p-3.5 flex flex-col justify-between shadow-[0_2px_12px_rgba(50,31,63,0.03)] overflow-hidden max-w-full select-none ${className}`}
    >
      {/* Product Image Skeleton (Exact aspect-square with 14px radius) */}
      <div className="relative w-full max-w-full aspect-square rounded-[14px] overflow-hidden bg-gray-700 skeleton-shimmer mb-2.5 flex items-center justify-center isolate" />

      {/* Product Information Skeleton */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Rating & Category Row Skeleton */}
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-10 rounded-full" />
          </div>

          {/* Product Title Skeleton (2 Lines matching 2rem min-height) */}
          <div className="min-h-[2rem] space-y-1.5 mb-1">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-3/4 rounded-md" />
          </div>
        </div>

        {/* Price & Quick ADD Button Row Skeleton */}
        <div className="mt-2 pt-2 border-t border-[#f5edf2] flex items-center justify-between gap-1">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-14 rounded-md" />
            <Skeleton className="h-2.5 w-9 rounded-md" />
          </div>

          {/* ADD Button Placeholder */}
          <Skeleton className="h-[32px] sm:h-[34px] w-16 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
