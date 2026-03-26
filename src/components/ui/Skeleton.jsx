import React from 'react';

// Base skeleton component with shimmer effect
export const Skeleton = ({ className = '', ...props }) => (
  <div className={`skeleton ${className}`} {...props} />
);

// Text skeleton - single line
export const SkeletonText = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <Skeleton className={`${width} ${height} ${className}`} />
);

// Circle skeleton - for avatars
export const SkeletonCircle = ({ size = 'w-10 h-10', className = '' }) => (
  <Skeleton className={`${size} rounded-full ${className}`} />
);

// Box skeleton - for images/cards
export const SkeletonBox = ({ width = 'w-full', height = 'h-40', className = '' }) => (
  <Skeleton className={`${width} ${height} ${className}`} />
);

// Event Card Skeleton
export const EventCardSkeleton = () => (
  <div className="card animate-fade-in">
    {/* Image placeholder */}
    <SkeletonBox height="h-48" className="rounded-t-2xl rounded-b-none" />
    
    {/* Content */}
    <div className="p-5 space-y-4">
      {/* Title */}
      <SkeletonText width="w-3/4" height="h-6" />
      
      {/* Description */}
      <div className="space-y-2">
        <SkeletonText width="w-full" />
        <SkeletonText width="w-2/3" />
      </div>
      
      {/* Meta info */}
      <div className="flex items-center gap-4 pt-2">
        <SkeletonText width="w-24" height="h-3" />
        <SkeletonText width="w-20" height="h-3" />
      </div>
      
      {/* Social bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-4">
          <SkeletonText width="w-12" height="h-5" />
          <SkeletonText width="w-12" height="h-5" />
          <SkeletonText width="w-8" height="h-5" />
        </div>
        <SkeletonText width="w-24" height="h-9" className="rounded-lg" />
      </div>
    </div>
  </div>
);

// Activity Item Skeleton
export const ActivityItemSkeleton = () => (
  <div className="flex gap-4 p-4 card animate-fade-in">
    {/* Icon */}
    <SkeletonCircle size="w-12 h-12" />
    
    {/* Content */}
    <div className="flex-1 space-y-2">
      <SkeletonText width="w-3/4" height="h-5" />
      <SkeletonText width="w-1/2" height="h-3" />
    </div>
    
    {/* Thumbnail */}
    <SkeletonBox width="w-16" height="h-16" className="rounded-lg flex-shrink-0" />
  </div>
);

// Browse Page Skeleton
export const BrowsePageSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Search bar skeleton */}
    <div className="card p-4">
      <SkeletonText height="h-12" className="rounded-xl" />
    </div>
    
    {/* Filter pills */}
    <div className="flex gap-3">
      <SkeletonText width="w-32" height="h-8" className="rounded-full" />
      <SkeletonText width="w-28" height="h-8" className="rounded-full" />
      <SkeletonText width="w-24" height="h-8" className="rounded-full" />
    </div>
    
    {/* Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Activities Page Skeleton
export const ActivitiesPageSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    {/* Date header */}
    <SkeletonText width="w-24" height="h-4" className="mb-2" />
    
    {/* Activity items */}
    {[...Array(5)].map((_, i) => (
      <ActivityItemSkeleton key={i} />
    ))}
  </div>
);

// Dashboard Hero Skeleton
export const HeroSkeleton = () => (
  <div className="relative rounded-3xl overflow-hidden animate-fade-in">
    <SkeletonBox height="h-[400px] sm:h-[500px]" className="rounded-3xl" />
    
    {/* Content overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-8">
      <div className="space-y-4">
        <SkeletonText width="w-32" height="h-6" className="rounded-full" />
        <SkeletonText width="w-2/3" height="h-10" />
        <SkeletonText width="w-1/2" height="h-5" />
        <div className="flex gap-4 pt-4">
          <SkeletonText width="w-32" height="h-12" className="rounded-xl" />
          <SkeletonText width="w-28" height="h-12" className="rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

// Event Details Modal Skeleton
export const EventDetailsSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Hero image */}
    <SkeletonBox height="h-64 sm:h-80" className="rounded-2xl" />
    
    {/* Title and meta */}
    <div className="space-y-4">
      <SkeletonText width="w-3/4" height="h-8" />
      <div className="flex gap-3">
        <SkeletonText width="w-24" height="h-6" className="rounded-full" />
        <SkeletonText width="w-20" height="h-6" className="rounded-full" />
      </div>
    </div>
    
    {/* Info grid */}
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-4 space-y-2">
          <SkeletonText width="w-8" height="h-8" className="rounded-lg" />
          <SkeletonText width="w-20" height="h-3" />
          <SkeletonText width="w-full" height="h-5" />
        </div>
      ))}
    </div>
    
    {/* Description */}
    <div className="space-y-3">
      <SkeletonText width="w-32" height="h-6" />
      <SkeletonText width="w-full" />
      <SkeletonText width="w-full" />
      <SkeletonText width="w-2/3" />
    </div>
  </div>
);

export default Skeleton;
