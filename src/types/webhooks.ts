export type WebhookEndpoint = {
  id: string;
  url: string;
  enabled: boolean;
  created_at?: string;
};

export type WebhookListResponse = {
  items?: WebhookEndpoint[];
};

