/**
 * Reusable skeleton loaders for different UI layouts
 * Match component dimensions for accurate perceived loading
 */

export function OpportunitySkeleton() {
  return (
    <article className="nb-card overflow-hidden flex flex-col animate-pulse">
      {/* Cover Image */}
      <div className="h-32 bg-gray-200" />
      <div className="h-2 bg-gray-100" />
      
      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Badge row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 bg-gray-200 rounded-full" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>
        
        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-32 bg-gray-200 rounded-full" />
          <div className="h-6 w-32 bg-gray-200 rounded-full" />
        </div>
        
        {/* Description */}
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <div className="h-10 flex-1 bg-gray-200 rounded-lg" />
          <div className="h-10 flex-1 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </article>
  );
}

export function ApplicationWorkspaceSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Opportunity summary */}
        <div className="nb-card p-6 space-y-4 animate-pulse">
          <div className="h-8 w-3/4 bg-gray-200 rounded" />
          <div className="flex gap-4">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-5 w-32 bg-gray-200 rounded" />
          </div>
          <div className="space-y-2 pt-4">
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Requirements */}
        <div className="nb-card p-6 space-y-3 animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded" />
              <div className="h-4 flex-1 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Checklist */}
        <div className="nb-card p-6 space-y-3 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Quick actions */}
        <div className="nb-card p-6 space-y-3 animate-pulse sticky top-24">
          <div className="h-5 w-24 bg-gray-200 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>

        {/* AI Companion */}
        <div className="nb-card p-6 space-y-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="space-y-2 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function OpportunityDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-64 bg-gray-200 rounded-xl" />
      <div className="space-y-3">
        <div className="h-8 w-3/4 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-5 w-32 bg-gray-200 rounded-full" />
          <div className="h-5 w-32 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 w-full bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <OpportunitySkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="h-48 bg-gray-200 rounded-xl" />
      
      {/* Profile info */}
      <div className="space-y-3 px-4">
        <div className="h-6 w-1/3 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="nb-card p-4 space-y-2 animate-pulse">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
