import type { ReactNode } from 'react';

/**
 * Minimal Markdown renderer for Primi replies. Model output is untrusted, so it
 * builds React elements (never HTML strings) and only links http(s)/mailto URLs.
 * Supports what chat models commonly emit: paragraphs, headings, bold, italics,
 * strikethrough, inline and fenced code, nested bullet/numbered lists, quotes,
 * tables, horizontal rules and links.
 */

const SAFE_URL = /^(https?:\/\/|mailto:)/i;
const INLINE = new RegExp([
  '(`+)([^`]+?)\\1', // 1-2 code
  '\\*\\*(?=\\S)([\\s\\S]+?)(?<=\\S)\\*\\*', // 3 bold
  '__(?=\\S)([\\s\\S]+?)(?<=\\S)__', // 4 bold
  '\\*(?=[^\\s*])([^*\\n]+?)(?<=\\S)\\*', // 5 italic
  '(?<![\\w])_(?=\\S)([^_\\n]+?)(?<=\\S)_(?![\\w])', // 6 italic (not inside snake_case)
  '~~(?=\\S)([\\s\\S]+?)(?<=\\S)~~', // 7 strikethrough
  '\\[([^\\]\\n]+)\\]\\(([^)\\s]+)\\)', // 8-9 link
  '(https?:\\/\\/[^\\s<>()]+[^\\s<>().,;:!?\'"])', // 10 bare URL
].join('|'), 'g');

const LIST_ITEM = /^(\s*)([-*+•]|\d{1,3}[.)])\s+(.*)$/;
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const HR = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const FENCE = /^\s*(```|~~~)/;
const QUOTE = /^\s{0,3}>\s?/;

const link = (href: string, children: ReactNode, key: string) =>
  SAFE_URL.test(href) ? <a key={key} href={href} target="_blank" rel="noopener noreferrer">{children}</a> : children;

export function renderInline(text: string, prefix = 'i'): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${prefix}-${n++}`;
    const [, , code, bold1, bold2, italic1, italic2, strike, label, href, url] = match;
    if (code !== undefined) nodes.push(<code key={key}>{code}</code>);
    else if (bold1 ?? bold2) nodes.push(<strong key={key}>{renderInline(bold1 ?? bold2, key)}</strong>);
    else if (italic1 ?? italic2) nodes.push(<em key={key}>{renderInline(italic1 ?? italic2, key)}</em>);
    else if (strike) nodes.push(<del key={key}>{renderInline(strike, key)}</del>);
    else if (label) nodes.push(link(href, renderInline(label, key), key));
    else if (url) nodes.push(link(url, url, key));
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const indentOf = (line: string) => line.replace(/\t/g, '  ').match(/^ */)![0].length;
const splitRow = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
const startsBlock = (line: string, next = '') =>
  FENCE.test(line) || HEADING.test(line) || HR.test(line) || QUOTE.test(line) || LIST_ITEM.test(line) || (line.includes('|') && TABLE_RULE.test(next));

function parseList(lines: string[], start: number, base: number, key: string): [ReactNode, number] {
  const ordered = /\d/.test(lines[start].match(LIST_ITEM)![2]);
  const first = Number.parseInt(lines[start].match(LIST_ITEM)![2], 10);
  const items: { text: string; children: ReactNode[] }[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(LIST_ITEM);
    if (!match) {
      if (line.trim() && indentOf(line) > base && items.length) { items.at(-1)!.text += ` ${line.trim()}`; i++; continue; }
      const next = lines[i + 1];
      if (!line.trim() && next && LIST_ITEM.test(next) && indentOf(next) >= base) { i++; continue; }
      break;
    }
    const indent = indentOf(line);
    if (indent < base) break;
    if (indent > base && items.length) {
      const [child, end] = parseList(lines, i, indent, `${key}-${i}`);
      items.at(-1)!.children.push(child);
      i = end;
      continue;
    }
    if (/\d/.test(match[2]) !== ordered) break;
    items.push({ text: match[3], children: [] });
    i++;
  }
  const content = items.map((item, index) => (
    <li key={index}>{renderInline(item.text, `${key}-${index}`)}{item.children}</li>
  ));
  return [ordered ? <ol key={key} start={first !== 1 ? first : undefined}>{content}</ol> : <ul key={key}>{content}</ul>, i];
}

function parseBlocks(source: string, prefix = 'b'): ReactNode[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = `${prefix}-${i}`;
    if (!line.trim()) { i++; continue; }

    const fence = line.match(FENCE);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) body.push(lines[i++]);
      i++;
      blocks.push(<pre key={key}><code>{body.join('\n')}</code></pre>);
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) {
      const Tag = heading[1].length <= 2 ? 'h4' : 'h5';
      blocks.push(<Tag key={key}>{renderInline(heading[2], key)}</Tag>);
      i++;
      continue;
    }
    if (HR.test(line)) { blocks.push(<hr key={key} />); i++; continue; }
    if (QUOTE.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) quoted.push(lines[i++].replace(QUOTE, ''));
      blocks.push(<blockquote key={key}>{parseBlocks(quoted.join('\n'), key)}</blockquote>);
      continue;
    }
    if (line.includes('|') && TABLE_RULE.test(lines[i + 1] ?? '')) {
      const header = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(splitRow(lines[i++]));
      blocks.push(
        <div className="table-scroll" key={key}>
          <table>
            <thead><tr>{header.map((cell, c) => <th key={c}>{renderInline(cell, `${key}-h${c}`)}</th>)}</tr></thead>
            <tbody>{rows.map((row, r) => <tr key={r}>{header.map((_, c) => <td key={c}>{renderInline(row[c] ?? '', `${key}-${r}-${c}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (LIST_ITEM.test(line)) {
      const [list, end] = parseList(lines, i, indentOf(line), key);
      blocks.push(list);
      i = end;
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && (paragraph.length === 0 || !startsBlock(lines[i], lines[i + 1]))) paragraph.push(lines[i++].trim());
    blocks.push(
      <p key={key}>
        {paragraph.map((text, index) => (
          <span key={index}>{index > 0 && <br />}{renderInline(text, `${key}-${index}`)}</span>
        ))}
      </p>,
    );
  }
  return blocks;
}

export function Markdown({ text }: { text: string }) {
  return <div className="assistant-markdown">{parseBlocks(text)}</div>;
}
