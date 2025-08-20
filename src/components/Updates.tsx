import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Update {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
  expires_at: string;
  display_order: number;
}

interface UpdatesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Updates: React.FC<UpdatesProps> = ({ isOpen, onClose }) => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('updates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading updates:', error);
        return;
      }

      setUpdates(data || []);
    } catch (error) {
      console.error('Error loading updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextUpdate = () => {
    if (updates.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % updates.length);
    }
  };

  const prevUpdate = () => {
    if (updates.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + updates.length) % updates.length);
    }
  };

  if (updates.length === 0 && !loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Updates</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-8">
            <div className="text-xl font-bold text-foreground">No Updates Available</div>
            <p className="text-muted-foreground">Check back later for new updates!</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentUpdate = updates[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle>Updates</DialogTitle>
          {updates.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {currentIndex + 1} of {updates.length}
            </Badge>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-foreground">Loading updates...</div>
          </div>
        ) : updates.length > 0 && currentUpdate ? (
          <div className="space-y-6">
            {/* Main Update Card */}
            <Card className="overflow-hidden border border-border bg-card">
              <CardContent className="p-0">
                {/* Update Image */}
                {currentUpdate.image_url && (
                  <div className="relative w-full h-48 md:h-64 overflow-hidden">
                    <img
                      src={currentUpdate.image_url}
                      alt={currentUpdate.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}

                {/* Update Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      {currentUpdate.title}
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {currentUpdate.description}
                    </p>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border">
                    <span>Posted on {new Date(currentUpdate.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Controls */}
            {updates.length > 1 && (
              <div className="flex justify-center items-center gap-4">
                <Button
                  onClick={prevUpdate}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                {/* Dot Indicators */}
                <div className="flex gap-2">
                  {updates.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextUpdate}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};