export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer_md: string;
  sort: number;
  updated_at: string;
};

export type FaqListResponse = { items: FaqItem[] };

export type SupportTicketListItem = {
  id: string;
  status: string;
  priority: string;
  category: string;
  subject: string;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
};

export type SupportTicketMessage = {
  id: number;
  author: "user" | "admin" | string;
  body_md: string;
  created_at: string;
};

export type SupportTicketDetail = {
  ticket: SupportTicketListItem;
  messages: SupportTicketMessage[];
};

export type SupportTicketsResponse = { items: SupportTicketListItem[]; cursor_next?: string | null };

