export type LegalDoc = {
  kind: string;
  version: string;
  locale: string;
  title: string;
  body_md: string;
  effective_at: string;
};

export type LegalVersionsResponse = {
  items: Array<{ version: string; locale: string; title: string; effective_at: string }>;
};

