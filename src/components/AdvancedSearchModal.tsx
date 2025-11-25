import { useState } from 'react';
import { Search, Filter, X, Calendar, User, Paperclip } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AdvancedSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMessage: (conversationId: string, messageId: string) => void;
}

export const AdvancedSearchModal = ({ open, onClose, onSelectMessage }: AdvancedSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [hasAttachment, setHasAttachment] = useState(false);
  
  const { results, totalResults, isSearching, search, clearSearch } = useAdvancedSearch();

  const handleSearch = () => {
    if (query.trim()) {
      search({
        query,
        dateFrom,
        dateTo,
        hasAttachment: hasAttachment || undefined
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setHasAttachment(false);
    clearSearch();
  };

  const highlightMatch = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return (
      <>
        {before}
        <mark className="bg-yellow-200 dark:bg-yellow-800">{match}</mark>
        {after}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
              Search
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-3 gap-2 p-4 bg-secondary/20 rounded-lg">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateTo ? format(dateTo, 'MMM d, yyyy') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant={hasAttachment ? 'default' : 'outline'}
                onClick={() => setHasAttachment(!hasAttachment)}
                className="justify-start"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Has attachment
              </Button>
            </div>
          )}

          {/* Results count */}
          {totalResults > 0 && (
            <div className="text-sm text-muted-foreground">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''}
            </div>
          )}

          {/* Results */}
          <ScrollArea className="flex-1 h-[calc(80vh-250px)]">
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    onSelectMessage(result.conversation_id, result.id);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3" />
                      <span className="font-medium">
                        {result.sender_display_name || result.sender_username}
                      </span>
                      {result.conversation_name && (
                        <span className="text-muted-foreground">
                          in {result.conversation_name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(result.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2">
                    {highlightMatch(result.decrypted_content, query)}
                  </p>
                  {result.file_name && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Paperclip className="h-3 w-3" />
                      {highlightMatch(result.file_name, query)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Clear button */}
          {(query || results.length > 0) && (
            <Button variant="outline" onClick={handleClear} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Clear search
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
