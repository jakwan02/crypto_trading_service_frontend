export type VapidPublicKeyResponse = {
  public_key?: string;
};

export type PushSubscribeRequest = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  ua?: string | null;
  device_id?: string | null;
};

export type PushSubscribeResponse = {
  ok?: boolean;
};

export type PushUnsubscribeRequest = {
  endpoint: string;
};

export type PushUnsubscribeResponse = {
  ok?: boolean;
};

