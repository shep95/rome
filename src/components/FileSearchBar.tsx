import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type SortOption = 'name' | 'date' | 'size' | 'views' | 'downloads';
export type FilterType = 'all' | 'images' | 'documents' | 'videos' | 'audio' | 'text' | 'archives';

interface FileSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterType: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedTags: string[];
  onRemoveTag: (tag: string) => void;
}

export const FileSearchBar: React.FC<FileSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterType,
  onFilterChange,
  selectedTags,
  onRemoveTag
}) => {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 backdrop-blur-sm bg-card/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={filterType} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Files</SelectItem>
            <SelectItem value="images">Images</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="videos">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="archives">Archives</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="views">Views</SelectItem>
            <SelectItem value="downloads">Downloads</SelectItem>
          </SelectContent>
        </Select>

        {/* Selected Tags */}
        {selectedTags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-xs px-2 py-1 cursor-pointer hover:bg-destructive/20"
            onClick={() => onRemoveTag(tag)}
          >
            {tag}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        ))}
      </div>
    </div>
  );
};
