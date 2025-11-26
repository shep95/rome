import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, Paperclip, Image, Video, File, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [hasAttachment, setHasAttachment] = useState(false);
  
  const { results, totalResults, isSearching, search, clearSearch } = useAdvancedSearch();

  // Auto-search as user types (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, dateFrom, dateTo, hasAttachment, activeTab]);

  const handleSearch = () => {
    if (query.trim()) {
      let fileTypeFilter: string | undefined;
      let attachmentFilter = hasAttachment;
      
      if (activeTab === 'images') fileTypeFilter = 'image';
      else if (activeTab === 'videos') fileTypeFilter = 'video';
      else if (activeTab === 'files') fileTypeFilter = 'file';
      else if (activeTab === 'media') attachmentFilter = true;
      
      search({
        query,
        dateFrom,
        dateTo,
        hasAttachment: attachmentFilter || undefined,
        fileType: fileTypeFilter
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    setActiveTab('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setHasAttachment(false);
    clearSearch();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 text-foreground rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <File className="h-4 w-4" />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    if (['mp4', 'webm', 'mov'].includes(ext || '')) {
      return <Video className="h-4 w-4 text-purple-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const filteredResults = results.filter(result => {
    if (activeTab === 'all') return true;
    if (activeTab === 'media') return result.file_name;
    if (activeTab === 'images') {
      const ext = result.file_name?.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
    }
    if (activeTab === 'videos') {
      const ext = result.file_name?.split('.').pop()?.toLowerCase();
      return ['mp4', 'webm', 'mov'].includes(ext || '');
    }
    if (activeTab === 'files') {
      const ext = result.file_name?.split('.').pop()?.toLowerCase();
      return result.file_name && !['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'].includes(ext || '');
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col bg-background">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Search className="h-6 w-6 text-primary" />
            Search Messages & Files
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col">
          {/* Search input with live search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Type to search messages, files, keywords..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 text-base"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 w-12"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-3 gap-3 p-4 bg-secondary/20 rounded-lg border">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start h-10">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start h-10">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateTo ? format(dateTo, 'MMM d, yyyy') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
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
                className="justify-start h-10"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Has attachment
              </Button>
            </div>
          )}

          {/* Tabs for filtering */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-5 w-full bg-secondary/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-background">
                <MessageSquare className="h-4 w-4 mr-2" />
                All ({totalResults})
              </TabsTrigger>
              <TabsTrigger value="media" className="data-[state=active]:bg-background">
                <Paperclip className="h-4 w-4 mr-2" />
                Media
              </TabsTrigger>
              <TabsTrigger value="images" className="data-[state=active]:bg-background">
                <Image className="h-4 w-4 mr-2" />
                Images
              </TabsTrigger>
              <TabsTrigger value="videos" className="data-[state=active]:bg-background">
                <Video className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-background">
                <File className="h-4 w-4 mr-2" />
                Files
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 mt-4">
              {/* Results count */}
              {filteredResults.length > 0 && (
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="text-sm text-muted-foreground">
                    {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                    {query && <span className="text-foreground font-medium"> for "{query}"</span>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}

              {/* Results */}
              <ScrollArea className="h-[calc(85vh-340px)]">
                <div className="space-y-2">
                  {isSearching && query ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Searching...
                    </div>
                  ) : filteredResults.length === 0 && query ? (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No results found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Try different keywords or adjust filters
                      </p>
                    </div>
                  ) : !query ? (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Start typing to search</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Search through messages, files, and attachments
                      </p>
                    </div>
                  ) : (
                    filteredResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          onSelectMessage(result.conversation_id, result.id);
                          onClose();
                        }}
                        className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all hover:shadow-md group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-semibold text-sm">
                              {result.sender_display_name || result.sender_username}
                            </span>
                            {result.conversation_name && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">
                                  {result.conversation_name}
                                </span>
                              </>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {format(new Date(result.created_at), 'MMM d, h:mm a')}
                          </Badge>
                        </div>
                        
                        <p className="text-sm line-clamp-2 mb-2 group-hover:text-foreground">
                          {highlightMatch(result.decrypted_content, query)}
                        </p>
                        
                        {result.file_name && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-secondary/30 rounded text-sm">
                            {getFileIcon(result.file_name)}
                            <span className="font-medium">
                              {highlightMatch(result.file_name, query)}
                            </span>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
