export interface FrontmatterData {
  title?: string;
  tags?: string[] | string;
  aliases?: string[] | string;
  date?: string;
  created?: string;
  updated?: string;
  author?: string;
  [key: string]: unknown;
}

export interface MarkdownRenderResult {
  html: string;
  frontmatter: FrontmatterData;
  headings: MarkdownHeading[];
  hasMermaid: boolean;
}

export interface MarkdownHeading {
  depth: number;
  text: string;
  id: string;
}

export interface WikilinkMatch {
  raw: string;
  target: string;
  heading?: string;
  alias?: string;
}
