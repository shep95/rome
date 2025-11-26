import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface TagManagerDialogProps {
  open: boolean;
  onClose: () => void;
  onAddTag: (tagName: string, tagColor: string) => Promise<boolean>;
  existingTags?: Array<{ id: string; tag_name: string; tag_color: string }>;
  onRemoveTag?: (tagId: string) => Promise<boolean>;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export const TagManagerDialog: React.FC<TagManagerDialogProps> = ({
  open,
  onClose,
  onAddTag,
  existingTags = [],
  onRemoveTag
}) => {
  const [tagName, setTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleAddTag = async () => {
    if (!tagName.trim()) return;

    setLoading(true);
    const success = await onAddTag(tagName.trim(), selectedColor);
    setLoading(false);

    if (success) {
      setTagName('');
      setSelectedColor(PRESET_COLORS[0]);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (onRemoveTag) {
      setLoading(true);
      await onRemoveTag(tagId);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-card/95">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add New Tag */}
          <div className="space-y-3">
            <Label>Add New Tag</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tag name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 backdrop-blur-sm bg-card/50"
              />
              <Button
                onClick={handleAddTag}
                disabled={loading || !tagName.trim()}
                size="icon"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tag Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      selectedColor === color ? 'scale-110 ring-2 ring-offset-2 ring-foreground' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Existing Tags */}
          {existingTags.length > 0 && (
            <div className="space-y-2">
              <Label>Current Tags</Label>
              <div className="flex flex-wrap gap-2">
                {existingTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-sm px-3 py-1"
                    style={{ backgroundColor: `${tag.tag_color}20`, color: tag.tag_color }}
                  >
                    {tag.tag_name}
                    {onRemoveTag && (
                      <button
                        onClick={() => handleRemoveTag(tag.id)}
                        className="ml-2 hover:opacity-70"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
