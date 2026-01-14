/**
 * Collaboration Service
 * Handles real-time collaboration, presence tracking, and activity logs
 */

/**
 * User presence status
 */
export const PresenceStatus = {
  ONLINE: 'online',
  AWAY: 'away',
  OFFLINE: 'offline'
};

/**
 * Activity types
 */
export const ActivityType = {
  JOINED: 'joined',
  LEFT: 'left',
  EDITED: 'edited',
  COMMENTED: 'commented',
  SHARED: 'shared',
  VIEWED: 'viewed'
};

/**
 * Collaboration event types
 */
export const CollaborationEvent = {
  PRESENCE_UPDATE: 'presence_update',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ACTIVITY_LOGGED: 'activity_logged',
  CURSOR_MOVE: 'cursor_move',
  SELECTION_CHANGE: 'selection_change'
};

/**
 * Get user color for collaboration
 * @param {number} userId - User ID
 * @returns {string} Hex color
 */
export function getUserColor(userId) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ];
  return colors[userId % colors.length];
}

/**
 * Format activity timestamp
 * @param {Date|string} timestamp - Activity timestamp
 * @returns {string} Formatted time
 */
export function formatActivityTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get activity icon
 * @param {string} activityType - Activity type
 * @returns {string} PrimeIcon class
 */
export function getActivityIcon(activityType) {
  const icons = {
    [ActivityType.JOINED]: 'pi-sign-in',
    [ActivityType.LEFT]: 'pi-sign-out',
    [ActivityType.EDITED]: 'pi-pencil',
    [ActivityType.COMMENTED]: 'pi-comment',
    [ActivityType.SHARED]: 'pi-share-alt',
    [ActivityType.VIEWED]: 'pi-eye'
  };
  return icons[activityType] || 'pi-info-circle';
}

/**
 * Get activity description
 * @param {object} activity - Activity object
 * @returns {string} Human-readable description
 */
export function getActivityDescription(activity) {
  const descriptions = {
    [ActivityType.JOINED]: 'joined the project',
    [ActivityType.LEFT]: 'left the project',
    [ActivityType.EDITED]: 'made changes',
    [ActivityType.COMMENTED]: 'added a comment',
    [ActivityType.SHARED]: 'shared the project',
    [ActivityType.VIEWED]: 'viewed the project'
  };
  
  const baseDesc = descriptions[activity.type] || 'performed an action';
  
  if (activity.details) {
    return `${baseDesc}: ${activity.details}`;
  }
  
  return baseDesc;
}

/**
 * CollaborationService class
 * Manages real-time collaboration features
 */
export class CollaborationService {
  constructor() {
    this.ws = null;
    this.projectId = null;
    this.userId = null;
    this.currentUser = null;
    this.presenceMap = new Map();
    this.activityLog = [];
    this.listeners = new Map();
    this.heartbeatInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize collaboration session
   * @param {string} wsUrl - WebSocket URL
   * @param {number} projectId - Project ID
   * @param {object} currentUser - Current user data
   * @returns {Promise<void>}
   */
  async connect(wsUrl, projectId, currentUser) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('Already connected to collaboration session');
      return;
    }

    this.projectId = projectId;
    this.currentUser = currentUser;
    this.userId = currentUser.id;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Collaboration WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Join project
          this.send({
            type: 'join_project',
            project_id: projectId,
            user: currentUser
          });

          // Start heartbeat
          this.startHeartbeat();

          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('Collaboration WebSocket error:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = () => {
          console.log('Collaboration WebSocket closed');
          this.stopHeartbeat();
          this.handleDisconnection();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from collaboration session
   */
  disconnect() {
    if (this.ws) {
      // Notify leaving
      this.send({
        type: 'leave_project',
        project_id: this.projectId,
        user_id: this.userId
      });

      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
    }

    this.presenceMap.clear();
    this.activityLog = [];
  }

  /**
   * Handle incoming WebSocket message
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case CollaborationEvent.PRESENCE_UPDATE:
          this.handlePresenceUpdate(data);
          break;
        case CollaborationEvent.USER_JOINED:
          this.handleUserJoined(data);
          break;
        case CollaborationEvent.USER_LEFT:
          this.handleUserLeft(data);
          break;
        case CollaborationEvent.ACTIVITY_LOGGED:
          this.handleActivityLogged(data);
          break;
        case CollaborationEvent.CURSOR_MOVE:
          this.handleCursorMove(data);
          break;
        case CollaborationEvent.SELECTION_CHANGE:
          this.handleSelectionChange(data);
          break;
        default:
          console.warn('Unknown collaboration event:', data.type);
      }
    } catch (error) {
      console.error('Failed to parse collaboration message:', error);
    }
  }

  /**
   * Handle presence update
   * @param {object} data - Presence data
   */
  handlePresenceUpdate(data) {
    const { user_id, status, timestamp } = data;
    
    this.presenceMap.set(user_id, {
      userId: user_id,
      status,
      lastSeen: timestamp,
      user: data.user
    });

    this.notifyListeners(CollaborationEvent.PRESENCE_UPDATE, data);
  }

  /**
   * Handle user joined
   * @param {object} data - User data
   */
  handleUserJoined(data) {
    const { user, timestamp } = data;
    
    this.presenceMap.set(user.id, {
      userId: user.id,
      status: PresenceStatus.ONLINE,
      lastSeen: timestamp,
      user
    });

    this.logActivity({
      type: ActivityType.JOINED,
      user_id: user.id,
      user_name: user.name,
      timestamp
    });

    this.notifyListeners(CollaborationEvent.USER_JOINED, data);
  }

  /**
   * Handle user left
   * @param {object} data - User data
   */
  handleUserLeft(data) {
    const { user_id, timestamp } = data;
    
    const presence = this.presenceMap.get(user_id);
    if (presence) {
      presence.status = PresenceStatus.OFFLINE;
      presence.lastSeen = timestamp;
      this.presenceMap.set(user_id, presence);
    }

    this.logActivity({
      type: ActivityType.LEFT,
      user_id,
      user_name: presence?.user?.name || 'User',
      timestamp
    });

    this.notifyListeners(CollaborationEvent.USER_LEFT, data);
  }

  /**
   * Handle activity logged
   * @param {object} data - Activity data
   */
  handleActivityLogged(data) {
    this.logActivity(data.activity);
    this.notifyListeners(CollaborationEvent.ACTIVITY_LOGGED, data);
  }

  /**
   * Handle cursor move
   * @param {object} data - Cursor data
   */
  handleCursorMove(data) {
    this.notifyListeners(CollaborationEvent.CURSOR_MOVE, data);
  }

  /**
   * Handle selection change
   * @param {object} data - Selection data
   */
  handleSelectionChange(data) {
    this.notifyListeners(CollaborationEvent.SELECTION_CHANGE, data);
  }

  /**
   * Send message through WebSocket
   * @param {object} data - Message data
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Update user presence
   * @param {string} status - Presence status
   */
  updatePresence(status) {
    this.send({
      type: 'update_presence',
      project_id: this.projectId,
      user_id: this.userId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast cursor position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  broadcastCursor(x, y) {
    this.send({
      type: 'cursor_move',
      project_id: this.projectId,
      user_id: this.userId,
      x,
      y,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast selection
   * @param {object} selection - Selection data
   */
  broadcastSelection(selection) {
    this.send({
      type: 'selection_change',
      project_id: this.projectId,
      user_id: this.userId,
      selection,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log activity
   * @param {object} activity - Activity data
   */
  logActivity(activity) {
    const logEntry = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: activity.timestamp || new Date().toISOString()
    };

    this.activityLog.unshift(logEntry);

    // Keep only last 100 activities
    if (this.activityLog.length > 100) {
      this.activityLog = this.activityLog.slice(0, 100);
    }

    // Broadcast activity
    if (activity.user_id === this.userId) {
      this.send({
        type: 'log_activity',
        project_id: this.projectId,
        activity: logEntry
      });
    }
  }

  /**
   * Get online users
   * @returns {Array} List of online users
   */
  getOnlineUsers() {
    const users = [];
    for (const presence of this.presenceMap.values()) {
      if (presence.status === PresenceStatus.ONLINE) {
        users.push(presence);
      }
    }
    return users;
  }

  /**
   * Get all users
   * @returns {Array} List of all users
   */
  getAllUsers() {
    return Array.from(this.presenceMap.values());
  }

  /**
   * Get user presence
   * @param {number} userId - User ID
   * @returns {object|null} Presence data or null
   */
  getUserPresence(userId) {
    return this.presenceMap.get(userId) || null;
  }

  /**
   * Get activity log
   * @param {number} limit - Maximum number of activities
   * @returns {Array} Activity log
   */
  getActivityLog(limit = 50) {
    return this.activityLog.slice(0, limit);
  }

  /**
   * Clear activity log
   */
  clearActivityLog() {
    this.activityLog = [];
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          project_id: this.projectId,
          user_id: this.userId,
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle disconnection and attempt reconnect
   */
  async handleDisconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (this.projectId && this.currentUser) {
          const wsUrl = this.getWebSocketUrl();
          this.connect(wsUrl, this.projectId, this.currentUser).catch(error => {
            console.error('Reconnection failed:', error);
          });
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyListeners('connection_lost', {
        message: 'Lost connection to collaboration server'
      });
    }
  }

  /**
   * Get WebSocket URL
   * @returns {string} WebSocket URL
   */
  getWebSocketUrl() {
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    return `${baseUrl}/collaboration`;
  }

  /**
   * Get connection status
   * @returns {string} Connection status
   */
  getConnectionStatus() {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if connected
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in collaboration event listener:', error);
        }
      });
    }
  }
}

/**
 * Create collaboration service instance
 * @returns {CollaborationService} Service instance
 */
export function useCollaborationService() {
  return new CollaborationService();
}

export default {
  PresenceStatus,
  ActivityType,
  CollaborationEvent,
  getUserColor,
  formatActivityTime,
  getActivityIcon,
  getActivityDescription,
  CollaborationService,
  useCollaborationService
};
