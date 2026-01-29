export type BriefingKind = "daily" | "weekly" | (string & {});

export type Briefing = {
  id: string;
  kind: BriefingKind;
  as_of_date: string; // YYYY-MM-DD
  tz?: string | null;
  payload?: Record<string, unknown>;
  md_text?: string | null;
  created_at?: string;
};

export type BriefingListResponse = {
  items?: Array<Pick<Briefing, "id" | "kind" | "as_of_date" | "tz" | "created_at">>;
  cursor_next?: string | null;
};

