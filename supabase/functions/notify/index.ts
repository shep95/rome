import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  recipientId: string;
  senderName: string;
  eventType: 'message' | 'call' | 'message_request';
  conversationName?: string;
  isGroup?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const novuApiKey = Deno.env.get('NOVU_API_KEY');
    if (!novuApiKey) {
      throw new Error('NOVU_API_KEY not configured');
    }

    const payload: NotificationPayload = await req.json();
    console.log('Notification payload:', payload);

    const { recipientId, senderName, eventType, conversationName, isGroup } = payload;

    // Determine notification template based on event type
    let notificationBody = '';
    let notificationSubject = '';

    switch (eventType) {
      case 'message':
        notificationSubject = isGroup && conversationName ? conversationName : 'New Message';
        notificationBody = isGroup && conversationName
          ? `${senderName} sent a message`
          : `${senderName} sent you a message`;
        break;
      case 'call':
        notificationSubject = 'Incoming Call';
        notificationBody = `${senderName} is calling you`;
        break;
      case 'message_request':
        notificationSubject = 'New Message Request';
        notificationBody = `${senderName} sent you a message request`;
        break;
    }

    // Send notification via Novu
    const novuResponse = await fetch('https://api.novu.co/v1/events/trigger', {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${novuApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'rome-notification',
        to: {
          subscriberId: recipientId,
        },
        payload: {
          subject: notificationSubject,
          body: notificationBody,
          senderName,
          eventType,
          conversationName: conversationName || '',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!novuResponse.ok) {
      const errorText = await novuResponse.text();
      console.error('Novu API error:', errorText);
      throw new Error(`Novu API error: ${novuResponse.status} ${errorText}`);
    }

    const novuData = await novuResponse.json();
    console.log('Novu notification sent:', novuData);

    return new Response(
      JSON.stringify({ success: true, data: novuData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
