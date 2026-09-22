export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface BrowserNotificationConfig {
  enabled: boolean;
  soundEnabled: boolean;
  events: {
    leadStatusChanged: boolean;
    leadNewMessage: boolean;
    agentPendingApproval: boolean;
    concertConfirmed: boolean;
    leadDiscovered: boolean;
  };
}

export type NotificationCategory = 
  | 'lead_status'
  | 'new_message'
  | 'agent_approval'
  | 'concert_confirmed'
  | 'lead_discovered'
  | 'system';

export interface NotificationHistoryItem {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  leadId?: string;
  leadName?: string;
  url?: string;
}

export const DEFAULT_NOTIFICATION_CONFIG: BrowserNotificationConfig = {
  enabled: true,
  soundEnabled: true,
  events: {
    leadStatusChanged: true,
    leadNewMessage: true,
    agentPendingApproval: true,
    concertConfirmed: true,
    leadDiscovered: true,
  },
};
