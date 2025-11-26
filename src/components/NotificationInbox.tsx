import { Inbox } from '@novu/react';

interface NotificationInboxProps {
  subscriberId: string;
}

export function NotificationInbox({ subscriberId }: NotificationInboxProps) {
  const applicationIdentifier = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER;

  if (!applicationIdentifier) {
    console.warn('VITE_NOVU_APPLICATION_IDENTIFIER is not set');
    return null;
  }

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={subscriberId}
      appearance={{
        variables: {
          colorBackground: 'hsl(var(--background))',
          colorForeground: 'hsl(var(--foreground))',
          colorPrimary: 'hsl(var(--primary))',
          colorPrimaryForeground: 'hsl(var(--primary-foreground))',
          colorSecondary: 'hsl(var(--secondary))',
          colorSecondaryForeground: 'hsl(var(--secondary-foreground))',
          colorCounter: 'hsl(var(--destructive))',
          colorCounterForeground: 'hsl(var(--destructive-foreground))',
          colorNeutral: 'hsl(var(--muted))',
          colorShadow: 'hsl(var(--border))',
          fontSize: '14px',
        },
        elements: {
          bellIcon: {
            color: 'hsl(var(--foreground))',
          },
        },
      }}
      placement="bottom-end"
      placementOffset={8}
    />
  );
}
