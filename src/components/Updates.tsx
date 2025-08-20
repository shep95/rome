import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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

export const Updates: React.FC = () => {
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
        .order('display_order', { ascending: true })
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

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground">Loading updates...</div>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-foreground">No Updates Available</div>
          <p className="text-muted-foreground">Check back later for new updates!</p>
        </div>
      </div>
    );
  }

  const currentUpdate = updates[currentIndex];
  const daysRemaining = getDaysRemaining(currentUpdate.expires_at);

  return (
    <div className="flex-1 min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Updates</h1>
          <p className="text-muted-foreground">Stay informed with the latest features and improvements</p>
        </div>

        {/* Update Counter */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-4 py-2">
            {currentIndex + 1} of {updates.length}
          </Badge>
        </div>

        {/* Main Update Card */}
        <Card className="overflow-hidden border border-border bg-card">
          <CardContent className="p-0">
            {/* Update Image */}
            {currentUpdate.image_url && (
              <div className="relative w-full h-64 md:h-96 overflow-hidden">
                <img
                  src={currentUpdate.image_url}
                  alt={currentUpdate.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            )}

            {/* Update Content */}
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {currentUpdate.title}
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {currentUpdate.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                  <span>{daysRemaining} days left</span>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border">
                <span>Posted on {new Date(currentUpdate.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={prevUpdate}
            variant="outline"
            size="sm"
            disabled={updates.length <= 1}
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
            disabled={updates.length <= 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Auto-advance info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Updates expire after 7 days from posting
          </p>
        </div>
      </div>
    </div>
  );
};