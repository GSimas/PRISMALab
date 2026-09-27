'use client';

import type { Locale, PrismaProject } from '../../domain/types';
import { calculateProject, describeFlow } from '../../domain/calculations';
import { validateProject } from '../../domain/validation';
import { checklistTitles } from '../../domain/checklist';
import { getDiagramChrome, getDiagramConnections, getDiagramNodes } from '../builder/diagramModel';
import { downloadBlob, safeFileName, serializeProject } from '../../storage/serialization';

const xml = (value: string) => value.replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] ?? character);
const html = xml;

export function generateSvg(project: PrismaProject, locale: Locale): string {
  const style = project.presentation.diagramStyle ?? 'classic';
  const nodes = getDiagramNodes(project, locale, style);
  const chrome = getDiagramChrome(project, locale, style);
  const connections = getDiagramConnections(nodes, style).map((connection) => `<path d="${connection.d}"/>`).join('');
  // Column headers and stage bands, as drawn on the canvas (geometry from diagramModel).
  const chromeMarkup = `<g aria-hidden="true">${chrome.headers.map((header) => `<rect class="source ${header.id}" x="${header.x}" y="${header.y}" width="${header.width}" height="${header.height}" rx="${chrome.headerRadius}"/><text class="source-label" x="${header.x + header.width / 2}" y="${header.y + header.height / 2}">${xml(header.label)}</text>`).join('')}${chrome.bands.map((band) => `<rect class="stage" x="${band.x}" y="${band.y}" width="${band.width}" height="${band.height}" rx="${chrome.bandRadius}"/><text class="stage-label" transform="translate(${band.x + band.width / 2 + 3.5} ${band.y + band.height / 2}) rotate(-90)">${xml(band.label)}</text>`).join('')}</g>`;
  const nodeMarkup = nodes.map((node) => {
    const text = node.lines.map((line, index) => `<text x="${style === 'classic' ? node.x + node.width / 2 : node.x + 18}" y="${style === 'classic' ? node.y + node.height / 2 - ((node.lines.length - 1) * 15) / 2 + index * 15 + 4 : node.y + 25 + index * 20}"${style === 'classic' ? ' text-anchor="middle"' : ''} class="${index === 0 ? 'heading' : 'line'}">${xml(line)}</text>`).join('');
    return `<g id="${node.id}" class="node ${node.kind ?? ''}" tabindex="0" role="link"><title>${xml(node.lines.join('. '))}</title><rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${style === 'classic' ? 0 : 2}"/>${text}</g>`;
  }).join('');
  const classicCss = `.source.main{fill:#ffbf24;stroke:none}.source.other{fill:#d9d9d9;stroke:none}.source-label,.stage-label{fill:#000;font:12px Arial,'Noto Sans SC',sans-serif;text-anchor:middle;dominant-baseline:central}.stage{fill:#b8d2f2;stroke:none}.node rect{fill:#fff;stroke:#000;stroke-width:1}.node.other rect{fill:#ddd;stroke:none}.heading,.line{font:12px Arial,'Noto Sans SC',sans-serif;fill:#000}.heading{font-weight:400}path{stroke:#000;stroke-width:1.1}`;
  const modernCss = `.source.main{fill:#e3ecf5;stroke:#17345d;stroke-width:1.2}.source.other{fill:#eceef1;stroke:#59697d;stroke-width:1.2}.source-label{fill:#10233f;font:600 12.5px Arial,'Noto Sans SC',sans-serif;text-anchor:middle;dominant-baseline:central}.stage{fill:#dce7f5;stroke:none}.stage-label{fill:#17345d;font:600 12px Arial,'Noto Sans SC',sans-serif;letter-spacing:.08em;text-anchor:middle;dominant-baseline:central}.node rect{fill:#fff;stroke:#17345d;stroke-width:1.5}.node.other rect{fill:#e4e7ec;stroke:#17345d;stroke-width:1.5}.heading{font-size:14px;font-weight:700;fill:#10233f}.line{font-size:13px;fill:#31445e}path{stroke:#17345d;stroke-width:1.5}`;
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${chrome.width}" height="${chrome.height}" viewBox="0 0 ${chrome.width} ${chrome.height}" role="img" aria-labelledby="title desc"><title id="title">${xml(project.title)}</title><desc id="desc">${xml(describeFlow(project))}</desc><defs><marker id="a" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="${style === 'classic' ? '#000' : '#17345d'}"/></marker></defs><style>svg{background:#fff;font-family:Arial,'Noto Sans SC',sans-serif}${style === 'classic' ? classicCss : modernCss}path{fill:none;marker-end:url(#a)}g[role=link]:focus rect{stroke:#aa6900;stroke-width:3}.credit{font-size:10px;fill:#59697d}</style>${chromeMarkup}<g>${connections}</g><g>${nodeMarkup}</g><text x="${chrome.creditX}" y="${chrome.height - 16}" class="credit">${xml(chrome.credit)}</text></svg>`;
}

export async function generatePng(project: PrismaProject, locale: Locale, scale = 2): Promise<Blob> {
  const svg = generateSvg(project, locale);
  const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = source; });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth * scale;
    canvas.height = image.naturalHeight * scale;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas indisponível');
    context.scale(scale, scale);
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Falha ao gerar PNG')), 'image/png'));
  } finally {
    URL.revokeObjectURL(source);
  }
}

const PDF_FONT_SIZES = [8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3];

function fitNodeText(doc: import('jspdf').jsPDF, node: { lines: string[] }, x: number, y: number, w: number, h: number): void {
  const paddingX = 1.6;
  const paddingY = 1.8;
  const availWidth = Math.max(4, w - paddingX * 2);
  const availHeight = Math.max(3, h - paddingY * 1.6);
  let size = PDF_FONT_SIZES[PDF_FONT_SIZES.length - 1];
  let lineHeight = 0;
  let wrapped: { text: string; bold: boolean }[] = [];
  for (const candidate of PDF_FONT_SIZES) {
    doc.setFontSize(candidate);
    const candidateLineHeight = candidate * 0.3528 * 1.22;
    const candidateWrapped: { text: string; bold: boolean }[] = [];
    node.lines.forEach((line, index) => {
      doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
      const parts = doc.splitTextToSize(line, availWidth) as string[];
      parts.forEach((part) => candidateWrapped.push({ text: part, bold: index === 0 }));
    });
    size = candidate;
    lineHeight = candidateLineHeight;
    wrapped = candidateWrapped;
    if (candidateWrapped.length * candidateLineHeight <= availHeight) break;
  }
  doc.setFontSize(size);
  let cy = y + paddingY + lineHeight * 0.8;
  wrapped.forEach((entry) => {
    doc.setFont('helvetica', entry.bold ? 'bold' : 'normal');
    doc.text(entry.text, x + paddingX, cy, { maxWidth: availWidth });
    cy += lineHeight;
  });
}

function drawConnectionPath(doc: import('jspdf').jsPDF, d: string, ox: number, oy: number, scale: number): void {
  const tokens = d.trim().split(/\s+/);
  if (tokens[0] !== 'M') return;
  let cx = ox + parseFloat(tokens[1]) * scale;
  let cy = oy + parseFloat(tokens[2]) * scale;
  let i = 3;
  while (i < tokens.length - 1) {
    const command = tokens[i];
    const value = parseFloat(tokens[i + 1]);
    if (command === 'V') {
      const ny = oy + value * scale;
      doc.line(cx, cy, cx, ny);
      cy = ny;
    } else if (command === 'H') {
      const nx = ox + value * scale;
      doc.line(cx, cy, nx, cy);
      cx = nx;
    } else break;
    i += 2;
  }
}

export async function generatePdf(project: PrismaProject, locale: Locale): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const style = project.presentation.diagramStyle ?? 'classic';
  const nodes = getDiagramNodes(project, locale, style);
  const chrome = getDiagramChrome(project, locale, style);
  const connections = getDiagramConnections(nodes, style);
  const orientation = chrome.width > chrome.height ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const pageHeight = orientation === 'landscape' ? 210 : 297;
  const ox = 15;
  const oy = 24;
  const usableWidth = pageWidth - ox * 2;
  const usableHeight = pageHeight - oy - 14;
  const scale = Math.min(usableWidth / chrome.width, usableHeight / chrome.height);
  doc.setTextColor(16, 35, 63);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(project.title || 'PRISMA Lab', ox, 14, { maxWidth: usableWidth });
  doc.setDrawColor(23, 52, 93);
  doc.setLineWidth(0.35);
  connections.forEach((connection) => drawConnectionPath(doc, connection.d, ox, oy, scale));
  nodes.forEach((node) => {
    const x = ox + node.x * scale;
    const y = oy + node.y * scale;
    const w = node.width * scale;
    const h = node.height * scale;
    doc.rect(x, y, w, h);
    doc.setTextColor(16, 35, 63);
    fitNodeText(doc, node, x, y, w, h);
  });
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text('Baseado no PRISMA 2020 · CC BY 4.0 · PRISMA Lab | Scientata', ox, pageHeight - 8);
  return doc.output('blob');
}

export function generateCsv(project: PrismaProject): string {
  const calculated = calculateProject(project);
  const rows = Object.entries(calculated.values).map(([field, value]) => [
    field, value ?? '', calculated.origins[field as keyof typeof calculated.origins], calculated.formulas[field as keyof typeof calculated.formulas] ?? '',
  ]);
  return '\uFEFF' + [['field', 'value', 'origin', 'calculation'], ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n');
}

export async function generateXlsx(project: PrismaProject): Promise<Blob> {
  const XLSX = await import('xlsx');
  const calculated = calculateProject(project);
  const counts = Object.entries(calculated.values).map(([field, value]) => ({ field, value, origin: calculated.origins[field as keyof typeof calculated.origins], calculation: calculated.formulas[field as keyof typeof calculated.formulas] ?? '' }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(counts), 'Flow');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(project.exclusionReasons), 'Exclusion reasons');
  if (project.otherExclusionReasons.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(project.otherExclusionReasons), 'Exclusion reasons (other)');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(project.checklist.map((entry) => ({ ...entry, title: checklistTitles[entry.item] }))), 'Checklist');
  const array = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function generateInteractiveHtml(project: PrismaProject, locale: Locale): string {
  const svg = generateSvg(project, locale).replace(/^<\?xml[^>]+>/, '');
  const details = getDiagramNodes(project, locale).map((node) => `<article id="detail-${node.id}"><h2>${html(node.lines[0])}</h2><p>${html(node.lines.slice(1).join(' · '))}</p><p>Origem: ${html(calculateProject(project).origins[node.field])}</p></article>`).join('');
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html(project.title)} — PRISMA Lab</title><style>body{margin:0;font:16px/1.6 system-ui;color:#10233f;background:#f5f1e8}header,main,footer{max-width:1100px;margin:auto;padding:24px}svg{max-width:100%;height:auto;background:white;border:1px solid #bac5d2}article{border-top:1px solid #bac5d2;padding:16px 0}g[role=link]{cursor:pointer}g[role=link]:hover rect{stroke:#c97a16;stroke-width:3}</style></head><body><header><h1>${html(project.title)}</h1><p>Baseado no PRISMA 2020 · PRISMA Lab | Scientata</p></header><main>${svg}<section id="details">${details}</section></main><footer>CC BY 4.0 · Gerado pelo PRISMA Lab</footer><script>document.querySelectorAll('g[role=link]').forEach(function(n){n.addEventListener('click',function(){var d=document.getElementById('detail-'+n.id);if(d)d.scrollIntoView({behavior:'smooth'})})})</script></body></html>`;
}

export function generateReportHtml(project: PrismaProject, locale: Locale): string {
  const issues = validateProject(project);
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>Relatório — ${html(project.title)}</title><style>body{font:12pt/1.5 Georgia,serif;max-width:900px;margin:auto;padding:32px;color:#17263b}h1,h2{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #aaa;padding:6px;text-align:left}@media print{body{padding:0}}</style></head><body><h1>${html(project.title)}</h1><p><strong>Diretriz:</strong> PRISMA 2020 · <strong>Modelo:</strong> ${html(project.model)}</p><p>${html(describeFlow(project))}</p>${generateSvg(project, locale).replace(/^<\?xml[^>]+>/, '')}<h2>Validação</h2><table><thead><tr><th>Status</th><th>Verificação</th><th>Como revisar</th></tr></thead><tbody>${issues.map((item) => `<tr><td>${html(item.status)}</td><td>${html(item.title)}</td><td>${html(item.how)}</td></tr>`).join('')}</tbody></table><h2>Checklist PRISMA 2020</h2><table><tbody>${project.checklist.map((entry) => `<tr><td>${entry.item}</td><td>${html(checklistTitles[entry.item])}</td><td>${html(entry.status)}</td><td>${html(entry.location || entry.note)}</td></tr>`).join('')}</tbody></table><h2>Referências</h2><p>Page MJ et al. BMJ 2021;372:n71. doi:10.1136/bmj.n71. Templates PRISMA 2020 sob CC BY 4.0. Verificado em 26 ago. 2026.</p></body></html>`;
}

export async function exportProject(project: PrismaProject, locale: Locale, format: 'json' | 'csv' | 'xlsx' | 'svg' | 'png' | 'pdf' | 'html' | 'report' | 'zip'): Promise<void> {
  const name = (ext: string) => safeFileName(project.shortTitle || project.title, ext);
  if (format === 'json') return downloadBlob(serializeProject(project), name('json'), 'application/json');
  if (format === 'csv') return downloadBlob(generateCsv(project), name('csv'), 'text/csv;charset=utf-8');
  if (format === 'svg') return downloadBlob(generateSvg(project, locale), name('svg'), 'image/svg+xml;charset=utf-8');
  if (format === 'html') return downloadBlob(generateInteractiveHtml(project, locale), name('html'), 'text/html;charset=utf-8');
  if (format === 'report') return downloadBlob(generateReportHtml(project, locale), name('report.html'), 'text/html;charset=utf-8');
  if (format === 'xlsx') return downloadBlob(await generateXlsx(project), name('xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  if (format === 'png') return downloadBlob(await generatePng(project, locale), name('png'), 'image/png');
  if (format === 'pdf') return downloadBlob(await generatePdf(project, locale), name('pdf'), 'application/pdf');
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file(name('json'), serializeProject(project));
  zip.file(name('csv'), generateCsv(project));
  zip.file(name('svg'), generateSvg(project, locale));
  zip.file(name('png'), await generatePng(project, locale));
  zip.file(name('pdf'), await generatePdf(project, locale));
  zip.file(name('html'), generateInteractiveHtml(project, locale));
  zip.file(name('report.html'), generateReportHtml(project, locale));
  zip.file(name('xlsx'), await generateXlsx(project));
  zip.file('README.txt', `PRISMA Lab\n\nProjeto: ${project.title}\nDiretriz: PRISMA 2020\nPRISMA Lab | Scientata. Templates PRISMA 2020: CC BY 4.0.\nFontes verificadas em 26 ago. 2026.\nhttps://www.prisma-statement.org/prisma-2020\n`);
  downloadBlob(await zip.generateAsync({ type: 'blob' }), name('zip'), 'application/zip');
}
