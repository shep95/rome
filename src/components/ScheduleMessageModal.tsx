import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledFor: Date, content: string, isSelfDestruct: boolean) => void;
  defaultContent?: string;
}

export const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  defaultContent = ''
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [content, setContent] = useState(defaultContent);
  const [isSelfDestruct, setIsSelfDestruct] = useState(false);

  const handleSchedule = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Combine date and time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    // Check if the scheduled time is in the future
    if (scheduledDateTime <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    onSchedule(scheduledDateTime, content, isSelfDestruct);
    
    // Reset form
    setSelectedDate(undefined);
    setSelectedTime('12:00');
    setContent('');
    setIsSelfDestruct(false);
    onClose();
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setSelectedTime('12:00');
    setContent(defaultContent);
    setIsSelfDestruct(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Schedule Message
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-foreground">
              Message
            </Label>
            <Textarea
              id="message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your message..."
              className="min-h-[80px] bg-background/50 border-border/50 text-foreground placeholder-muted-foreground"
              rows={3}
            />
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Select Date
            </Label>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedDate ? format(selectedDate, 'PPP') : 'No date selected'}
              </span>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className={cn("rounded-md border border-border/50 bg-background/30 p-3 pointer-events-auto")}
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium text-foreground">
              Select Time
            </Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="bg-background/50 border-border/50 text-foreground"
            />
          </div>

          {/* Self-Destruct Option */}
          <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">
                Self-Destruct Message
              </Label>
              <p className="text-xs text-muted-foreground">
                Message will disappear after being viewed
              </p>
            </div>
            <Switch
              checked={isSelfDestruct}
              onCheckedChange={setIsSelfDestruct}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-border/50 hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Schedule Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};