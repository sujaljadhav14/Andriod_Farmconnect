/**
 * Socket Service
 * Handles Socket.IO real-time connections
 */

import { io } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS } from '../config/constants';
import storageService from './storageService';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.IO server
   */
  async connect() {
    if (this.socket && this.isConnected) {
      console.log('✅ Socket already connected');
      return;
    }

    try {
      const token = await storageService.getToken();

      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 3, // Reduced from 5 to 3
      });

      this.setupDefaultListeners();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('⚠️ Socket connection timeout - backend may not have Socket.IO configured');
          // Don't reject, just warn - the app should still work with HTTP APIs
          resolve();
        }, 5000); // Reduced from 10000 to 5000

        this.socket.on(SOCKET_EVENTS.CONNECT, () => {
          clearTimeout(timeout);
          this.isConnected = true;
          console.log('✅ Socket connected:', this.socket.id);
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.warn('⚠️ Socket connection error:', error?.message || error);
          // Don't reject - the app should work without Socket.IO
          // Just resolve after a timeout to continue the app flow
          this.isConnected = false;
        });
      });
    } catch (error) {
      console.warn('⚠️ Error connecting socket:', error?.message || error);
      // Don't throw - socket is optional
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('Socket disconnected');
    }
  }

  /**
   * Setup default event listeners
   */
  setupDefaultListeners() {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.isConnected = true;
      console.log('✅ Socket connected');
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      this.isConnected = false;
      console.warn('⚠️ Socket disconnected:', reason);

      // Auto-reconnect if disconnect was unexpected
      if (reason === 'io server disconnect') {
        this.socket.connect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error?.message || error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    // Reduce log spam - only log on first attempt and failures
    let reconnectAttemptCount = 0;
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      reconnectAttemptCount = attemptNumber;
      // Only log every 5th attempt to reduce spam
      if (attemptNumber % 5 === 1 || attemptNumber === 1) {
        console.log('🔄 Socket reconnecting... Attempt', attemptNumber);
      }
    });

    this.socket.on('reconnect_error', (error) => {
      // Only log errors, not every attempt
      console.warn('⚠️ Socket reconnection error:', error?.message || error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after', reconnectAttemptCount, 'attempts');
      this.isConnected = false;
    });
  }

  /**
   * Listen to a specific event
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not connected. Call connect() first.');
      return;
    }

    this.socket.on(event, callback);

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Stop listening to a specific event
   */
  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to the server
   */
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  /**
   * Emit with acknowledgment
   */
  emitWithAck(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Socket acknowledgment timeout'));
      }, 5000);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  /**
   * Join a room
   */
  joinRoom(roomName) {
    return this.emitWithAck('join-room', { room: roomName });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomName) {
    return this.emitWithAck('leave-room', { room: roomName });
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  /**
   * Reconnect manually
   */
  reconnect(token) {
    this.disconnect();
    return this.connect(token);
  }
}

export default new SocketService();
