import React from "react";

/**
 * The scheme data contains markdown (`**bold**`, `[label](url)`, lists, `#`).
 * React renders those characters literally, which is why users saw stray
 * `*` and `#`. These helpers turn the text into real elements (detail pages)
 * or clean plain text (cards, search, line-clamped previews).
 */

export const cleanMarkdownEscapes = (text = "") =>
  String(text)
    .replace(/\\~/g, "~")
    .replace(/\\&/g, "&")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const stripMarkdown = (text = "") =>
  cleanMarkdownEscapes(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[*_`#]/g, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

const INLINE_RE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

const isTableRow = (line) => /^\|.*\|$/.test(line);
const isTableSeparator = (line) =>
  /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line);
const splitTableRow = (line) =>
  line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

function renderInline(text, keyPrefix) {
  return String(text)
    .split(INLINE_RE)
    .map((part, i) => {
      const key = `${keyPrefix}-${i}`;
      if (!part) return null;
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={key}>{part.slice(2, -2)}</strong>;
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        return (
          <a key={key} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>
        );
      }
      return <React.Fragment key={key}>{part}</React.Fragment>;
    });
}

/** Renders markdown-ish text as paragraphs / headings / lists. */
export default function RichText({ text, className }) {
  const clean = cleanMarkdownEscapes(text);
  if (!clean) return null;

  const blocks = [];
  let list = null;
  const flush = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  const lines = clean.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      flush();
      continue;
    }

    if (isTableRow(line) && isTableSeparator(lines[i + 1]?.trim() || "")) {
      flush();
      const headers = splitTableRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i].trim())) {
        rows.push(splitTableRow(lines[i].trim()));
        i += 1;
      }
      i -= 1;
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (/^---+$/.test(line)) {
      flush();
      blocks.push({ type: "hr" });
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({ type: "h", text: heading[1] });
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      if (!list || list.type !== "ul") {
        flush();
        list = { type: "ul", items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }
    const numbered = line.match(/^\d+\.\s+(.*)$/);
    if (numbered) {
      if (!list || list.type !== "ol") {
        flush();
        list = { type: "ol", items: [] };
      }
      list.items.push(numbered[1]);
      continue;
    }
    flush();
    blocks.push({ type: "p", text: line });
  }
  flush();

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.type === "h") {
          return <h3 key={i}>{renderInline(block.text, `h${i}`)}</h3>;
        }
        if (block.type === "hr") {
          return <hr key={i} />;
        }
        if (block.type === "table") {
          return (
            <div className="rich-table-wrap" key={i}>
              <table>
                <thead>
                  <tr>
                    {block.headers.map((header, j) => (
                      <th key={j}>{renderInline(header, `th${i}-${j}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r}>
                      {block.headers.map((_, c) => (
                        <td key={c}>{renderInline(row[c] || "", `td${i}-${r}-${c}`)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, `ul${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, `ol${i}-${j}`)}</li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{renderInline(block.text, `p${i}`)}</p>;
      })}
    </div>
  );
}
