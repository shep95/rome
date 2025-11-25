import { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollViewerProps {
  pollId: string;
  question: string;
  options: PollOption[];
  multipleChoice: boolean;
  closesAt?: string;
  messageId: string;
  onVote?: () => void;
}

export const PollViewer = ({ 
  pollId, 
  question, 
  options: initialOptions, 
  multipleChoice,
  closesAt,
  messageId,
  onVote 
}: PollViewerProps) => {
  const { user } = useAuth();
  const [options, setOptions] = useState(initialOptions);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isClosed = closesAt && new Date(closesAt) < new Date();
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  useEffect(() => {
    checkUserVote();
  }, [pollId, user]);

  const checkUserVote = async () => {
    if (!user) return;
    // TODO: Implement vote checking once poll_votes table is created
    // For now, assume user hasn't voted
  };

  const handleVote = async () => {
    if (!user || selectedOptions.length === 0 || isClosed) return;

    setIsLoading(true);

    try {
      // TODO: Implement vote recording once poll_votes table is created
      // For now, just update local state
      setHasVoted(true);
      const updatedOptions = options.map(opt => ({
        ...opt,
        votes: opt.votes + (selectedOptions.includes(opt.id) ? 1 : 0)
      }));
      setOptions(updatedOptions);

      toast.success('Vote recorded!');
      onVote?.();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to record vote');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOption = (optionId: string) => {
    if (hasVoted || isClosed) return;

    if (multipleChoice) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <BarChart3 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          <h4 className="font-semibold">{question}</h4>

          {/* Options */}
          {!hasVoted && !isClosed ? (
            <div className="space-y-2">
              {multipleChoice ? (
                options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => toggleOption(option.id)}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer flex-1">
                      {option.text}
                    </Label>
                  </div>
                ))
              ) : (
                <RadioGroup value={selectedOptions[0]} onValueChange={toggleOption}>
                  {options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="cursor-pointer flex-1">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          ) : (
            // Results view
            <div className="space-y-3">
              {options.map((option) => {
                const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                const isSelected = selectedOptions.includes(option.id);

                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn("flex items-center gap-2", isSelected && "font-medium")}>
                        {option.text}
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </span>
                      <span className="text-muted-foreground">
                        {option.votes} {option.votes === 1 ? 'vote' : 'votes'} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              {closesAt && (
                <>
                  {' • '}
                  <Clock className="inline h-3 w-3 mr-1" />
                  {isClosed ? 'Closed' : `Closes ${format(new Date(closesAt), 'MMM d')}`}
                </>
              )}
            </span>
            
            {!hasVoted && !isClosed && (
              <Button
                size="sm"
                onClick={handleVote}
                disabled={selectedOptions.length === 0 || isLoading}
              >
                Vote
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
