import SockJS from 'sockjs-client';
import { env } from '../config/env';

let Stomp = null;
let stompClient = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

async function loadStomp() {
  if (!Stomp) {
    try {
      const stompModule = await import('stompjs');
      // Handle different export formats
      Stomp = stompModule.default || stompModule.Stomp || stompModule;
      // If it's still an object with 'over' method, use it directly
      if (typeof Stomp === 'object' && Stomp.over) {
        return Stomp;
      }
    } catch (error) {
      console.error('Failed to load STOMP library:', error);
      throw error;
    }
  }
  return Stomp;
}

export async function connectWebSocket(onMessageCallback, onErrorCallback, role = null, userId = null) {
  if (stompClient && stompClient.connected) {
    return stompClient;
  }

  // Load STOMP library
  const StompLib = await loadStomp();

  const socket = new SockJS(`${env.API_BASE_URL}/ws`);
  stompClient = StompLib.over(socket);

  // Disable debug logging
  stompClient.debug = null;

  stompClient.connect(
    {},
    () => {
      // Connection successful
      reconnectAttempts = 0;
      console.log('WebSocket connected');

      // Subscribe based on role
      if (role === 'SUPERVISOR') {
        // Subscribe to supervisor notifications
        stompClient.subscribe('/topic/notifications/supervisors', (message) => {
          try {
            const notification = JSON.parse(message.body);
            onMessageCallback(notification);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });
        console.log('Subscribed to /topic/notifications/supervisors');
      } else if (role === 'WORKER') {
        // Subscribe to worker notifications
        stompClient.subscribe('/topic/notifications/workers', (message) => {
          try {
            const notification = JSON.parse(message.body);
            // Filtering by workerId is handled in NotificationContext
            onMessageCallback(notification);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });
        console.log('Subscribed to /topic/notifications/workers');
      }
    },
    (error) => {
      // Connection error
      console.error('WebSocket connection error:', error);
      
      if (onErrorCallback) {
        onErrorCallback(error);
      }

      // Attempt to reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          connectWebSocket(onMessageCallback, onErrorCallback, role, userId);
        }, RECONNECT_DELAY * reconnectAttempts);
      } else {
        console.error('Max reconnection attempts reached');
      }
    }
  );

  return stompClient;
}

export function disconnectWebSocket() {
  if (stompClient && stompClient.connected) {
    stompClient.disconnect(() => {
      console.log('WebSocket disconnected');
    });
    stompClient = null;
    reconnectAttempts = 0;
  }
}

export function isConnected() {
  return stompClient && stompClient.connected;
}

