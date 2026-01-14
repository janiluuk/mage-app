import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PresenceStatus,
  ActivityType,
  CollaborationEvent,
  getUserColor,
  formatActivityTime,
  getActivityIcon,
  getActivityDescription,
  CollaborationService,
  useCollaborationService
} from './collaborationService';

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this.sentMessages = [];
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }

  send(data) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }

  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

global.WebSocket = MockWebSocket;
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

describe('collaborationService', () => {
  describe('PresenceStatus', () => {
    it('defines presence statuses', () => {
      expect(PresenceStatus.ONLINE).toBe('online');
      expect(PresenceStatus.AWAY).toBe('away');
      expect(PresenceStatus.OFFLINE).toBe('offline');
    });
  });

  describe('ActivityType', () => {
    it('defines activity types', () => {
      expect(ActivityType.JOINED).toBe('joined');
      expect(ActivityType.LEFT).toBe('left');
      expect(ActivityType.EDITED).toBe('edited');
      expect(ActivityType.COMMENTED).toBe('commented');
      expect(ActivityType.SHARED).toBe('shared');
      expect(ActivityType.VIEWED).toBe('viewed');
    });
  });

  describe('CollaborationEvent', () => {
    it('defines collaboration events', () => {
      expect(CollaborationEvent.PRESENCE_UPDATE).toBe('presence_update');
      expect(CollaborationEvent.USER_JOINED).toBe('user_joined');
      expect(CollaborationEvent.USER_LEFT).toBe('user_left');
    });
  });

  describe('getUserColor', () => {
    it('returns consistent colors for user IDs', () => {
      const color1 = getUserColor(1);
      const color2 = getUserColor(1);
      expect(color1).toBe(color2);
    });

    it('returns different colors for different users', () => {
      const colors = [
        getUserColor(0),
        getUserColor(1),
        getUserColor(2),
        getUserColor(3)
      ];
      
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBeGreaterThan(1);
    });

    it('returns valid hex colors', () => {
      const color = getUserColor(1);
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('formatActivityTime', () => {
    it('formats recent activity as "Just now"', () => {
      const now = new Date();
      expect(formatActivityTime(now)).toBe('Just now');
    });

    it('formats minutes ago', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 5);
      expect(formatActivityTime(date)).toBe('5m ago');
    });

    it('formats hours ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 3);
      expect(formatActivityTime(date)).toBe('3h ago');
    });

    it('formats days ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 2);
      expect(formatActivityTime(date)).toBe('2d ago');
    });

    it('formats old dates with full date', () => {
      const date = new Date();
      date.setDate(date.getDate() - 10);
      const result = formatActivityTime(date);
      expect(result).toContain('/');
    });
  });

  describe('getActivityIcon', () => {
    it('returns correct icons for activity types', () => {
      expect(getActivityIcon(ActivityType.JOINED)).toBe('pi-sign-in');
      expect(getActivityIcon(ActivityType.LEFT)).toBe('pi-sign-out');
      expect(getActivityIcon(ActivityType.EDITED)).toBe('pi-pencil');
      expect(getActivityIcon(ActivityType.COMMENTED)).toBe('pi-comment');
    });

    it('returns default icon for unknown type', () => {
      expect(getActivityIcon('unknown')).toBe('pi-info-circle');
    });
  });

  describe('getActivityDescription', () => {
    it('returns basic description', () => {
      const activity = { type: ActivityType.JOINED };
      expect(getActivityDescription(activity)).toBe('joined the project');
    });

    it('includes details when available', () => {
      const activity = {
        type: ActivityType.EDITED,
        details: 'Updated frame 5'
      };
      expect(getActivityDescription(activity)).toContain('Updated frame 5');
    });
  });

  describe('CollaborationService', () => {
    let service;
    let mockUser;

    beforeEach(() => {
      service = new CollaborationService();
      mockUser = { id: 123, name: 'Test User', email: 'test@example.com' };
      // Disable reconnection in tests
      service.maxReconnectAttempts = 0;
    });

    afterEach(() => {
      if (service.ws) {
        service.stopHeartbeat();
        service.ws.onclose = null; // Prevent reconnection attempts
        service.ws.close();
        service.ws = null;
      }
    });

    describe('constructor', () => {
      it('initializes with default values', () => {
        expect(service.ws).toBeNull();
        expect(service.projectId).toBeNull();
        expect(service.userId).toBeNull();
        expect(service.reconnectAttempts).toBe(0);
      });

      it('initializes empty collections', () => {
        expect(service.presenceMap).toBeInstanceOf(Map);
        expect(service.activityLog).toBeInstanceOf(Array);
        expect(service.listeners).toBeInstanceOf(Map);
      });
    });

    describe('connect', () => {
      it('establishes WebSocket connection', async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
        expect(service.ws).toBeTruthy();
        expect(service.projectId).toBe(1);
        expect(service.userId).toBe(123);
      });

      it('sends join message on connection', async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
        
        const messages = service.ws.sentMessages;
        const joinMessage = JSON.parse(messages.find(m => m.includes('join_project')));
        
        expect(joinMessage.type).toBe('join_project');
        expect(joinMessage.project_id).toBe(1);
      });

      it('starts heartbeat on connection', async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
        expect(service.heartbeatInterval).toBeTruthy();
      });

      it('warns if already connected', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        await service.connect('ws://localhost:8080', 1, mockUser);
        await service.connect('ws://localhost:8080', 1, mockUser);
        
        expect(consoleSpy).toHaveBeenCalledWith('Already connected to collaboration session');
        consoleSpy.mockRestore();
      });
    });

    describe('disconnect', () => {
      it('closes WebSocket connection', async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
        service.disconnect();
        
        expect(service.ws).toBeNull();
        expect(service.heartbeatInterval).toBeNull();
      });

      it('sends leave message before disconnect', async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
        const ws = service.ws;
        service.disconnect();
        
        const messages = ws.sentMessages;
        const leaveMessage = messages.find(m => m.includes('leave_project'));
        
        expect(leaveMessage).toBeTruthy();
      });

      it('clears presence and activity data', async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
        service.presenceMap.set(456, { userId: 456, status: 'online' });
        service.activityLog.push({ type: 'test' });
        
        service.disconnect();
        
        expect(service.presenceMap.size).toBe(0);
        expect(service.activityLog.length).toBe(0);
      });
    });

    describe('message handling', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
      });

      it('handles presence update', () => {
        const message = {
          type: CollaborationEvent.PRESENCE_UPDATE,
          user_id: 456,
          status: PresenceStatus.ONLINE,
          timestamp: new Date().toISOString(),
          user: { id: 456, name: 'Other User' }
        };

        service.ws.simulateMessage(message);

        const presence = service.getUserPresence(456);
        expect(presence).toBeTruthy();
        expect(presence.status).toBe(PresenceStatus.ONLINE);
      });

      it('handles user joined', () => {
        const message = {
          type: CollaborationEvent.USER_JOINED,
          user: { id: 456, name: 'New User' },
          timestamp: new Date().toISOString()
        };

        service.ws.simulateMessage(message);

        const presence = service.getUserPresence(456);
        expect(presence).toBeTruthy();
        expect(presence.status).toBe(PresenceStatus.ONLINE);
        expect(service.activityLog.length).toBeGreaterThan(0);
      });

      it('handles user left', () => {
        // First add user
        service.presenceMap.set(456, {
          userId: 456,
          status: PresenceStatus.ONLINE,
          user: { id: 456, name: 'Leaving User' }
        });

        const message = {
          type: CollaborationEvent.USER_LEFT,
          user_id: 456,
          timestamp: new Date().toISOString()
        };

        service.ws.simulateMessage(message);

        const presence = service.getUserPresence(456);
        expect(presence.status).toBe(PresenceStatus.OFFLINE);
      });

      it('handles cursor move', () => {
        const callback = vi.fn();
        service.addEventListener(CollaborationEvent.CURSOR_MOVE, callback);

        const message = {
          type: CollaborationEvent.CURSOR_MOVE,
          user_id: 456,
          x: 100,
          y: 200
        };

        service.ws.simulateMessage(message);

        expect(callback).toHaveBeenCalledWith(message);
      });
    });

    describe('presence management', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
      });

      it('updates own presence', () => {
        service.updatePresence(PresenceStatus.AWAY);

        const messages = service.ws.sentMessages;
        const updateMessage = JSON.parse(messages[messages.length - 1]);

        expect(updateMessage.type).toBe('update_presence');
        expect(updateMessage.status).toBe(PresenceStatus.AWAY);
      });

      it('gets online users', () => {
        service.presenceMap.set(456, { userId: 456, status: PresenceStatus.ONLINE });
        service.presenceMap.set(789, { userId: 789, status: PresenceStatus.OFFLINE });

        const onlineUsers = service.getOnlineUsers();

        expect(onlineUsers.length).toBe(1);
        expect(onlineUsers[0].userId).toBe(456);
      });

      it('gets all users', () => {
        service.presenceMap.set(456, { userId: 456, status: PresenceStatus.ONLINE });
        service.presenceMap.set(789, { userId: 789, status: PresenceStatus.AWAY });

        const allUsers = service.getAllUsers();

        expect(allUsers.length).toBe(2);
      });
    });

    describe('activity logging', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
      });

      it('logs activity', () => {
        const activity = {
          type: ActivityType.EDITED,
          user_id: 123,
          user_name: 'Test User'
        };

        service.logActivity(activity);

        expect(service.activityLog.length).toBeGreaterThan(0);
        expect(service.activityLog[0].type).toBe(ActivityType.EDITED);
      });

      it('broadcasts own activity', () => {
        const activity = {
          type: ActivityType.EDITED,
          user_id: 123
        };

        service.logActivity(activity);

        const messages = service.ws.sentMessages;
        const activityMessage = messages.find(m => m.includes('log_activity'));
        
        expect(activityMessage).toBeTruthy();
      });

      it('limits activity log size', () => {
        for (let i = 0; i < 150; i++) {
          service.logActivity({ type: ActivityType.VIEWED, user_id: 123 });
        }

        expect(service.activityLog.length).toBe(100);
      });

      it('gets limited activity log', () => {
        for (let i = 0; i < 50; i++) {
          service.logActivity({ type: ActivityType.VIEWED, user_id: 123 });
        }

        const log = service.getActivityLog(10);
        expect(log.length).toBe(10);
      });

      it('clears activity log', () => {
        service.logActivity({ type: ActivityType.VIEWED, user_id: 123 });
        service.clearActivityLog();
        
        expect(service.activityLog.length).toBe(0);
      });
    });

    describe('broadcasting', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
      });

      it('broadcasts cursor position', () => {
        service.broadcastCursor(150, 250);

        const messages = service.ws.sentMessages;
        const cursorMessage = JSON.parse(messages[messages.length - 1]);

        expect(cursorMessage.type).toBe('cursor_move');
        expect(cursorMessage.x).toBe(150);
        expect(cursorMessage.y).toBe(250);
      });

      it('broadcasts selection', () => {
        const selection = { start: 0, end: 10 };
        service.broadcastSelection(selection);

        const messages = service.ws.sentMessages;
        const selectionMessage = JSON.parse(messages[messages.length - 1]);

        expect(selectionMessage.type).toBe('selection_change');
        expect(selectionMessage.selection).toEqual(selection);
      });
    });

    describe('heartbeat', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
      });

      it('starts heartbeat on connect', () => {
        expect(service.heartbeatInterval).toBeTruthy();
      });

      it('stops heartbeat on disconnect', () => {
        service.disconnect();
        expect(service.heartbeatInterval).toBeNull();
      });
    });

    describe('connection status', () => {
      it('returns disconnected when no connection', () => {
        expect(service.getConnectionStatus()).toBe('disconnected');
      });

      it('returns connected when connection is open', async () => {
        await service.connect('ws://localhost:8080', 1, mockUser);
        expect(service.getConnectionStatus()).toBe('connected');
      });

      it('checks if connected', async () => {
        // Initial state - should return false, not throw
        expect(() => {
          const isConnected = service.isConnected();
          expect(isConnected).toBeFalsy();
        }).not.toThrow();
        
        await service.connect('ws://localhost:8080', 1, mockUser);
        expect(service.isConnected()).toBe(true);
      });
    });

    describe('event listeners', () => {
      it('adds event listener', () => {
        const callback = vi.fn();
        service.addEventListener('test_event', callback);

        expect(service.listeners.has('test_event')).toBe(true);
      });

      it('removes event listener', () => {
        const callback = vi.fn();
        service.addEventListener('test_event', callback);
        service.removeEventListener('test_event', callback);

        const listeners = service.listeners.get('test_event');
        expect(listeners).toHaveLength(0);
      });

      it('notifies listeners', () => {
        const callback = vi.fn();
        service.addEventListener('test_event', callback);

        service.notifyListeners('test_event', { data: 'test' });

        expect(callback).toHaveBeenCalledWith({ data: 'test' });
      });

      it('handles errors in listeners', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const callback = vi.fn(() => {
          throw new Error('Test error');
        });
        service.addEventListener('test_event', callback);

        service.notifyListeners('test_event', {});

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('useCollaborationService', () => {
    it('creates service instance', () => {
      const service = useCollaborationService();
      expect(service).toBeInstanceOf(CollaborationService);
    });
  });
});
