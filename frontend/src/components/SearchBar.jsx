import { Search, X } from 'lucide-react';
import { Input } from './ui/input.jsx';
import { Card, CardContent } from './ui/card.jsx';

export default function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange,
  onClear,
  children,
  gridCols = "md:grid-cols-[minmax(0,1fr)_200px]"
}) {
  return (
    <Card>
      <CardContent className="flex min-h-20 items-center px-4 py-8">
        <div className={`mx-auto grid w-full max-w-6xl items-center gap-3 pt-5 ${gridCols}`}>
          <div className="relative flex h-10 items-center w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              className="h-10 w-full pl-10 pr-10 py-0 leading-none"
            />
            {value && (
              <button
                type="button"
                onClick={onClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
