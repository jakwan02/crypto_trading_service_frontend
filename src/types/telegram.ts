export type TelegramLinkResponse = {
  token?: string;
  expires_in_sec?: number;
  deep_link?: string | null;
};

export type TelegramUnlinkResponse = {
  ok?: boolean;
};

export type TelegramTestResponse = {
  ok?: boolean;
};

