export type ChangelogListItem = {
  slug: string;
  type: string;
  title: string;
  summary?: string | null;
  published_at?: string | null;
};

export type ChangelogDetail = {
  slug: string;
  type: string;
  title: string;
  summary?: string | null;
  body_md: string;
  published_at?: string | null;
};

export type ChangelogListResponse = {
  items: ChangelogListItem[];
  cursor_next?: string | null;
};

