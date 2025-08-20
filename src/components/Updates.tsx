import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Update {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
  expires_at: string;
}

export const Updates: React.FC = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpdates();
    
    // Auto-advance slideshow every 10 seconds
    const interval = setInterval(() => {
      if (updates.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % updates.length);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [updates.length]);

  const loadUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('updates')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
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
    setCurrentIndex((prev) => (prev + 1) % updates.length);
  };

  const prevUpdate = () => {
    setCurrentIndex((prev) => (prev - 1 + updates.length) % updates.length);
  };

  const goToUpdate = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading updates...</div>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">No Updates Available</h2>
          <p className="text-muted-foreground">
            There are currently no active updates to display.
          </p>
        </div>
      </div>
    );
  }

  const currentUpdate = updates[currentIndex];
  const timeRemaining = formatDistanceToNow(new Date(currentUpdate.expires_at), { addSuffix: true });

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Updates</h1>
          <p className="text-muted-foreground mt-1">
            Stay informed with the latest announcements and features
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Expires {timeRemaining}</span>
        </div>
      </div>

      {/* Main Update Card */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="relative h-full flex flex-col">
            {/* Image Section */}
            {currentUpdate.image_url && (
              <div className="h-64 md:h-80 lg:h-96 relative overflow-hidden">
                <img
                  src={currentUpdate.image_url}
                  alt={currentUpdate.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            )}

            {/* Content Section */}
            <div className="flex-1 p-8 space-y-4">
              <div>
                <h2 className="text-4xl font-bold text-foreground mb-4">
                  {currentUpdate.title}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {currentUpdate.description}
                </p>
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Posted {formatDistanceToNow(new Date(currentUpdate.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      {updates.length > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={prevUpdate}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {/* Dots Indicator */}
          <div className="flex space-x-2">
            {updates.map((_, index) => (
              <button
                key={index}
                onClick={() => goToUpdate(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary scale-110'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={nextUpdate}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Update Counter */}
      <div className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} of {updates.length} update{updates.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};