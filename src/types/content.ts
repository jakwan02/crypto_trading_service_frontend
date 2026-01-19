export type PublicPostListItem = {
  slug: string;
  title?: string | null;
  summary?: string | null;
  published_at?: string | null;
  category_id?: string | null;
};

export type PublicPostsResponse = {
  items?: PublicPostListItem[];
  cursor_next?: string | null;
};

export type PublicPost = {
  slug: string;
  title?: string | null;
  summary?: string | null;
  body_md?: string | null;
  published_at?: string | null;
  category?: { slug: string; name: string } | null;
  tags?: Array<{ slug: string; name: string }>;
};

