import { useEffect, useState } from 'react';

interface LiveTimeClockProps {
  startDate: string;
}

export const LiveTimeClock = ({ startDate }: LiveTimeClockProps) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const updateElapsed = () => {
      const start = new Date(startDate).getTime();
      const now = Date.now();
      const diff = now - start;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsed(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  return (
    <p className="text-foreground text-lg font-mono font-semibold">
      {elapsed}
    </p>
  );
};
