import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: 'connected' | 'new_token' | 'token_update' | 'price_alert';
  data?: any;
  message?: string;
}

interface PriceAlert {
  mint: string;
  previousPrice: number;
  currentPrice: number;
  changePercent: number;
  marketcap: number;
  volume24h: number;
  timestamp: Date;
}

export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(url);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setSocket(ws);
          reconnectAttempts.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            setLastMessage(message);
            
            if (message.type === 'connected') {
              console.log('WebSocket:', message.message);
            } else if (message.type === 'new_token') {
              console.log('New token received:', message.data);
            } else if (message.type === 'token_update') {
              console.log('Token update received:', message.data);
            } else if (message.type === 'price_alert') {
              console.log('🚨 PRICE ALERT:', message.data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          setSocket(null);
          
          // Attempt to reconnect
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('Max reconnection attempts reached');
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [url]);

  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage
  };
};
