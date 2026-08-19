import { useEffect, useState, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useSearchOpportunities } from '../hooks/useOpportunities';
import { SearchResultsSkeleton } from './Skeletons';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showResults?: boolean;
}

/**
 * SearchBar component with debounced API search
 * Shows dropdown with results or can trigger parent callback
 * Features:
 * - 300ms debounce to avoid excessive API calls
 * - Requires 3+ characters to search
 * - Displays loading state
 * - Shows error messages
 * - Caches results for 10 minutes
 */
export default function SearchBar({
  onSearch,
  placeholder = 'Search opportunities...',
  showResults = true,
}: SearchBarProps) {
  const [input, setInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(input);
    }, 300);

    return () => clearTimeout(timer);
  }, [input]);

  // Trigger parent callback if provided
  useEffect(() => {
    if (onSearch) {
      onSearch(input);
    }
  }, [input, onSearch]);

  // Search query hook
  const { data, isLoading, error } = useSearchOpportunities(debouncedQuery);

  const handleClear = useCallback(() => {
    setInput('');
    setShowDropdown(false);
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-3.5"
          style={{ color: 'var(--muted)' }}
        />
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="nb-input w-full pl-9 pr-8"
          style={{ fontSize: '14px' }}
        />
        {input && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3.5 hover:opacity-70"
            title="Clear search"
          >
            <X size={16} style={{ color: 'var(--muted)' }} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && showDropdown && input.length >= 3 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 border-4 border-black shadow-[4px_4px_0_#000] z-50 max-h-96 overflow-y-auto"
          style={{ background: 'var(--surface)' }}
        >
          {isLoading ? (
            <div className="p-4">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" style={{ color: '#FF5C00' }} />
                <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
                  Searching...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4">
              <p className="text-xs font-bold text-red-600">
                Search failed. Please try again.
              </p>
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <div className="divide-y-2" style={{ borderColor: 'var(--border)' }}>
              {data.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setInput('');
                    setShowDropdown(false);
                    window.location.href = `/opportunities/${item.id}/apply`;
                  }}
                  className="w-full p-3 text-left hover:opacity-80 transition-opacity"
                >
                  <p className="text-sm font-black" style={{ color: 'var(--ink)' }}>
                    {item.title}
                  </p>
                  <p className="text-xs font-medium mt-1" style={{ color: 'var(--muted)' }}>
                    {item.description || 'Opportunity'}
                  </p>
                  {item.deadline && (
                    <p className="text-xs font-bold mt-1 text-orange-600">
                      Deadline: {item.deadline}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
                No opportunities found
              </p>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
