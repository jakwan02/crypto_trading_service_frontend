import MarkdownIt from "markdown-it";

let renderer: MarkdownIt | null = null;

function isAllowedLink(href: string): boolean {
  const raw = String(href || "").trim();
  if (!raw) return false;
  if (raw.startsWith("#") || raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) return true;
  const lower = raw.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")) return true;
  return false;
}

export function getMarkdownRenderer(): MarkdownIt {
  if (renderer) return renderer;
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    validateLink: (url) => isAllowedLink(String(url || ""))
  });

  const defaultLinkOpen =
    md.renderer.rules.link_open ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token) {
      token.attrSet("rel", "noopener noreferrer nofollow");
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  renderer = md;
  return md;
}

export function renderMarkdown(mdText: string): string {
  return getMarkdownRenderer().render(String(mdText || ""));
}

