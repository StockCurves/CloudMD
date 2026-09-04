import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import matter from "gray-matter";
import { FrontmatterData, MarkdownRenderResult, MarkdownHeading } from "./types";

// Callout type configurations with Obsidian-style colors and Lucide-like icons
export const CALLOUT_CONFIGS: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  note: { label: "Note", icon: "📝", color: "var(--color-accent-fg)", bg: "var(--color-accent-subtle)" },
  info: { label: "Info", icon: "ℹ️", color: "#0969da", bg: "rgba(9, 105, 218, 0.1)" },
  todo: { label: "Todo", icon: "📋", color: "#0969da", bg: "rgba(9, 105, 218, 0.1)" },
  tip: { label: "Tip", icon: "💡", color: "#1a7f37", bg: "rgba(26, 127, 55, 0.1)" },
  hint: { label: "Hint", icon: "💡", color: "#1a7f37", bg: "rgba(26, 127, 55, 0.1)" },
  important: { label: "Important", icon: "🔥", color: "#8250df", bg: "rgba(130, 80, 223, 0.1)" },
  success: { label: "Success", icon: "✅", color: "#1a7f37", bg: "rgba(26, 127, 55, 0.1)" },
  check: { label: "Done", icon: "✅", color: "#1a7f37", bg: "rgba(26, 127, 55, 0.1)" },
  warning: { label: "Warning", icon: "⚠️", color: "#9a6700", bg: "rgba(154, 103, 0, 0.1)" },
  caution: { label: "Caution", icon: "⚠️", color: "#d1242f", bg: "rgba(209, 36, 47, 0.1)" },
  danger: { label: "Danger", icon: "⚡", color: "#cf222e", bg: "rgba(207, 34, 46, 0.1)" },
  error: { label: "Error", icon: "❌", color: "#cf222e", bg: "rgba(207, 34, 46, 0.1)" },
  bug: { label: "Bug", icon: "🐛", color: "#cf222e", bg: "rgba(207, 34, 46, 0.1)" },
  example: { label: "Example", icon: "🧪", color: "#8250df", bg: "rgba(130, 80, 223, 0.1)" },
  quote: { label: "Quote", icon: "💬", color: "#6e7781", bg: "rgba(110, 119, 129, 0.1)" },
  cite: { label: "Cite", icon: "💬", color: "#6e7781", bg: "rgba(110, 119, 129, 0.1)" },
  abstract: { label: "Abstract", icon: "📑", color: "#0969da", bg: "rgba(9, 105, 218, 0.1)" },
  summary: { label: "Summary", icon: "📑", color: "#0969da", bg: "rgba(9, 105, 218, 0.1)" },
  tldr: { label: "TL;DR", icon: "📑", color: "#0969da", bg: "rgba(9, 105, 218, 0.1)" },
  question: { label: "Question", icon: "❓", color: "#9a6700", bg: "rgba(154, 103, 0, 0.1)" },
  help: { label: "Help", icon: "❓", color: "#9a6700", bg: "rgba(154, 103, 0, 0.1)" },
  faq: { label: "FAQ", icon: "❓", color: "#9a6700", bg: "rgba(154, 103, 0, 0.1)" },
};

/**
 * Pre-process raw markdown string to convert Obsidian specific syntax into HTML/Markdown constructs
 */
function preprocessObsidianMarkdown(markdown: string): { processed: string; hasMermaid: boolean } {
  let text = markdown;
  let hasMermaid = false;

  // 1. Check for mermaid code blocks and normalize them for client render
  if (text.includes("```mermaid")) {
    hasMermaid = true;
    text = text.replace(/```mermaid\n([\s\S]*?)```/g, (_match, code) => {
      const encoded = encodeURIComponent(code.trim());
      return `<div class="mermaid-container" data-mermaid="${encoded}"><pre class="mermaid">${code.trim()}</pre></div>`;
    });
  }

  // 2. Obsidian Highlights: ==highlight== -> <mark class="obsidian-mark">highlight</mark>
  text = text.replace(/==([^=\n]+)==/g, '<mark class="obsidian-mark">$1</mark>');

  // 3. Obsidian Embeds: ![[image.png]] or ![[image.png|300]]
  text = text.replace(/!\[\[([^\]]+)\]\]/g, (_match, rawTarget) => {
    const parts = rawTarget.split("|");
    const target = parts[0].trim();
    const sizeOrAlt = parts[1]?.trim() || target;
    const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(target);
    const isPdf = /\.pdf$/i.test(target);

    if (isImage) {
      return `<span class="obsidian-embed-image"><img src="${target}" alt="${sizeOrAlt}" data-obsidian-embed="${target}" /></span>`;
    }
    if (isPdf) {
      return `<div class="obsidian-embed-file"><span class="embed-icon">📄</span><span class="embed-title">${target}</span></div>`;
    }
    return `<div class="obsidian-embed-transclusion" data-embed-target="${target}"><span class="embed-icon">🔗</span> ${sizeOrAlt}</div>`;
  });

  // 4. Obsidian Wikilinks: [[Page Name]], [[Page Name#Heading]], [[Page Name|Alias]], [[Page Name#Heading|Alias]]
  text = text.replace(/(?<!\!)\[\[([^\]]+)\]\]/g, (_match, rawTarget) => {
    let target = rawTarget.trim();
    let alias = "";
    let heading = "";

    // Check alias [[target|alias]]
    if (target.includes("|")) {
      const parts = target.split("|");
      target = parts[0].trim();
      alias = parts[1].trim();
    }

    // Check heading [[target#heading]]
    if (target.includes("#")) {
      const parts = target.split("#");
      target = parts[0].trim();
      heading = parts[1].trim();
    }

    const displayText = alias || (heading ? (target ? `${target} > ${heading}` : `#${heading}`) : target);
    const safeTarget = encodeURIComponent(target);
    const safeHeading = encodeURIComponent(heading);

    return `<a class="obsidian-wikilink" href="#wikilink:${safeTarget}${heading ? `#${safeHeading}` : ""}" data-wikilink-target="${safeTarget}" data-wikilink-heading="${safeHeading}">${displayText}</a>`;
  });

  // 5. Obsidian Callouts: > [!type] Title or > [!type]+ Title / > [!type]- Title
  // Process block by block
  const lines = text.split("\n");
  const processedLines: string[] = [];
  let inCallout = false;
  let calloutType = "note";
  let calloutTitle = "";
  let calloutFoldable = false;
  let calloutDefaultFolded = false;
  let calloutContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const calloutMatch = line.match(/^>\s*\[!([a-zA-Z0-9_-]+)\]([+-]?)(.*)$/);

    if (calloutMatch) {
      // If already in a callout, flush previous one
      if (inCallout) {
        processedLines.push(renderCalloutBlock(calloutType, calloutTitle, calloutContent.join("\n"), calloutFoldable, calloutDefaultFolded));
        calloutContent = [];
      }

      inCallout = true;
      calloutType = calloutMatch[1].toLowerCase();
      const foldModifier = calloutMatch[2]; // '+' or '-'
      calloutFoldable = foldModifier === "+" || foldModifier === "-";
      calloutDefaultFolded = foldModifier === "-";
      calloutTitle = calloutMatch[3]?.trim() || "";
    } else if (inCallout && line.startsWith(">")) {
      // Strip leading '>' and optional space
      calloutContent.push(line.replace(/^>\s?/, ""));
    } else {
      if (inCallout) {
        processedLines.push(renderCalloutBlock(calloutType, calloutTitle, calloutContent.join("\n"), calloutFoldable, calloutDefaultFolded));
        inCallout = false;
        calloutContent = [];
      }
      processedLines.push(line);
    }
  }

  if (inCallout) {
    processedLines.push(renderCalloutBlock(calloutType, calloutTitle, calloutContent.join("\n"), calloutFoldable, calloutDefaultFolded));
  }

  return {
    processed: processedLines.join("\n"),
    hasMermaid,
  };
}

function renderCalloutBlock(
  type: string,
  title: string,
  content: string,
  foldable: boolean,
  defaultFolded: boolean
): string {
  const config = CALLOUT_CONFIGS[type] || {
    label: type.charAt(0).toUpperCase() + type.slice(1),
    icon: "📌",
    color: "var(--color-fg-muted)",
    bg: "var(--color-canvas-subtle)",
  };

  const displayTitle = title || config.label;
  const rawType = type.replace(/[^a-z0-9_-]/g, "");

  if (foldable) {
    const openAttr = defaultFolded ? "" : " open";
    return `\n<details class="obsidian-callout obsidian-callout-${rawType} is-collapsible"${openAttr} data-callout="${rawType}">
<summary class="obsidian-callout-title">
  <span class="callout-icon">${config.icon}</span>
  <span class="callout-title-text">${displayTitle}</span>
  <span class="callout-fold-indicator">▾</span>
</summary>
<div class="obsidian-callout-content">\n\n${content}\n\n</div>
</details>\n`;
  }

  return `\n<div class="obsidian-callout obsidian-callout-${rawType}" data-callout="${rawType}">
<div class="obsidian-callout-title">
  <span class="callout-icon">${config.icon}</span>
  <span class="callout-title-text">${displayTitle}</span>
</div>
<div class="obsidian-callout-content">\n\n${content}\n\n</div>
</div>\n`;
}

/**
 * Extract Headings from markdown AST for Table of Contents (TOC)
 */
function extractHeadings(markdown: string): MarkdownHeading[] {
  const headingLines = markdown.match(/^#{1,6}\s+.+$/gm) || [];
  return headingLines.map((line) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) return { depth: 1, text: line, id: "" };
    const depth = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, "")
      .replace(/\s+/g, "-");
    return { depth, text, id };
  });
}

/**
 * Main markdown processing function that converts OFM Markdown string to safe HTML
 */
export async function renderMarkdown(rawMarkdown: string): Promise<MarkdownRenderResult> {
  // 1. Parse YAML Frontmatter
  const { data: frontmatter, content: markdownBody } = matter(rawMarkdown || "");

  // 2. Extract Headings for TOC
  const headings = extractHeadings(markdownBody);

  // 3. Preprocess Obsidian-Flavored Markdown syntax
  const { processed, hasMermaid } = preprocessObsidianMarkdown(markdownBody);

  // 4. Unified pipeline processing
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(processed);

  return {
    html: String(file),
    frontmatter: frontmatter as FrontmatterData,
    headings,
    hasMermaid,
  };
}
