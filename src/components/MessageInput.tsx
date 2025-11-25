import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Calendar, BarChart3, Mic, Image as ImageIcon, Video, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { PollCreator } from '@/components/PollCreator';
import { useMessageDrafts } from '@/hooks/useMessageDrafts';
import { useFileUpload } from '@/hooks/useFileUpload';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { LinkPreview } from '@/components/LinkPreview';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (content: string, options?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    messageType?: string;
    scheduledFor?: Date;
  }) => Promise<void>;
  onSendVoiceMessage: (audioBlob: Blob, duration: number, waveformData: number[]) => Promise<void>;
  onSendPoll: (poll: { question: string; options: string[]; multipleChoice: boolean; closesAt?: Date }) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export const MessageInput = ({
  conversationId,
  onSendMessage,
  onSendVoiceMessage,
  onSendPoll,
  disabled = false,
  className
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date>();
  const [extractedLinks, setExtractedLinks] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { draft, saveDraft, clearDraft } = useMessageDrafts(conversationId);
  const { uploadFile, isUploading } = useFileUpload();

  // Load draft on mount
  useEffect(() => {
    if (draft?.content) {
      setMessage(draft.content);
    }
  }, [draft]);

  // Auto-save draft
  useEffect(() => {
    saveDraft(message);
  }, [message, saveDraft]);

  // Extract links from message
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = message.match(urlRegex) || [];
    setExtractedLinks(links.slice(0, 3)); // Limit to 3 previews
  }, [message]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() && !scheduledFor) return;

    try {
      await onSendMessage(message.trim(), {
        scheduledFor
      });
      
      setMessage('');
      setScheduledFor(undefined);
      setExtractedLinks([]);
      clearDraft();
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileUrl = await uploadFile(file);
      if (fileUrl) {
        await onSendMessage(`Shared a file: ${file.name}`, {
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          messageType: file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('video/') ? 'video' : 'file'
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleVoiceRecordingComplete = async (audioBlob: Blob, duration: number, waveformData: number[]) => {
    try {
      await onSendVoiceMessage(audioBlob, duration, waveformData);
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message');
    }
  };

  const handlePollCreate = async (poll: any) => {
    try {
      await onSendPoll(poll);
      setShowPollCreator(false);
      toast.success('Poll created!');
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (showPollCreator) {
    return (
      <div className={className}>
        <PollCreator
          onCreatePoll={handlePollCreate}
          onCancel={() => setShowPollCreator(false)}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Link Previews */}
      {extractedLinks.length > 0 && (
        <div className="space-y-2 px-4">
          {extractedLinks.map((link, i) => (
            <LinkPreview
              key={i}
              url={link}
              compact
              onRemove={() => {
                const newLinks = extractedLinks.filter((_, idx) => idx !== i);
                setExtractedLinks(newLinks);
                // Remove link from message
                setMessage(message.replace(link, ''));
              }}
            />
          ))}
        </div>
      )}

      {/* Markdown Preview */}
      {showMarkdownPreview && message.trim() && (
        <div className="px-4 py-3 bg-secondary/20 rounded-lg mx-4 max-h-[200px] overflow-auto">
          <div className="text-xs text-muted-foreground mb-2">Preview:</div>
          <MarkdownRenderer content={message} />
        </div>
      )}

      {/* Scheduled Message Indicator */}
      {scheduledFor && (
        <div className="px-4 py-2 bg-primary/10 rounded-lg mx-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Scheduled for {scheduledFor.toLocaleString()}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScheduledFor(undefined)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Draft Indicator */}
      {draft && message.trim() && (
        <div className="px-4 text-xs text-muted-foreground">
          Draft saved
        </div>
      )}

      <div className="flex items-end gap-2 px-4 pb-4">
        {/* File Upload */}
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={disabled || isUploading}
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* More Options */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              title="More options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowPollCreator(true)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Create Poll
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {showMarkdownPreview ? 'Hide' : 'Show'} Preview
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Message
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={scheduledFor}
                    onSelect={setScheduledFor}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </PopoverContent>
        </Popover>

        {/* Message Input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Markdown supported)"
          disabled={disabled}
          className="min-h-[44px] max-h-[200px] resize-none"
          rows={1}
        />

        {/* Voice Recorder or Send Button */}
        {message.trim() || scheduledFor ? (
          <Button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && !scheduledFor)}
            size="icon"
            title={scheduledFor ? "Schedule message" : "Send message"}
          >
            {scheduledFor ? <Calendar className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          </Button>
        ) : (
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecordingComplete}
          />
        )}
      </div>
    </div>
  );
};
