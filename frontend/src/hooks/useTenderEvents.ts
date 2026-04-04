import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

interface TenderEvent {
  event: string;
  data: string;
}

export function useTenderEvents() {
  const [events, setEvents] = useState<TenderEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = api.getToken();
    if (!token) return;

    const connect = () => {
      eventSourceRef.current = new EventSource(`/api/events?token=${token}`);

      eventSourceRef.current.onmessage = (event) => {
        setEvents((prev) => [...prev, { event: 'message', data: event.data }]);
      };

      eventSourceRef.current.addEventListener('new_comment', (event) => {
        setEvents((prev) => [...prev, { event: 'new_comment', data: event.data }]);
        console.log('Новый комментарий:', JSON.parse(event.data));
      });

      eventSourceRef.current.addEventListener('new_tender', (event) => {
        setEvents((prev) => [...prev, { event: 'new_tender', data: event.data }]);
        console.log('Новый тендер:', JSON.parse(event.data));
      });

      eventSourceRef.current.onerror = () => {
        console.error('SSE connection error');
        eventSourceRef.current?.close();
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return events;
}
