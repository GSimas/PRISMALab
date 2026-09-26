'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, type PointerEvent } from 'react';
import type { CountKey, Locale, PrismaProject } from '../../domain/types';
import { describeFlow } from '../../domain/calculations';
import { getDiagramChrome, getDiagramConnections, getDiagramNodes } from './diagramModel';

export type DiagramStage = 'identification' | 'screening' | 'included';

interface Props {
  project: PrismaProject;
  locale: Locale;
  selected: CountKey;
  onSelect: (field: CountKey, nodeId?: string) => void;
  onSelectStage?: (stage: DiagramStage) => void;
  zoom?: number;
  /** Requests a zoom change from the canvas (Ctrl/⌘ + wheel, trackpad pinch); the owner clamps it. */
  onZoom?: (update: (zoom: number) => number) => void;
}

/** Pointer travel (px) before a press on the canvas becomes a pan instead of a click. */
const PAN_THRESHOLD = 4;
/** Wheel sensitivity: 100px of wheel delta ≈ 20% zoom. Exponential so trackpad pinch stays smooth. */
const WHEEL_ZOOM_SPEED = 0.002;

export function PrismaDiagram({ project, locale, selected, onSelect, onSelectStage, zoom = 1, onZoom }: Props) {
  const style = project.presentation.diagramStyle ?? 'classic';
  const nodes = useMemo(() => getDiagramNodes(project, locale, style), [project, locale, style]);
  const chrome = useMemo(() => getDiagramChrome(project, locale, style), [project, locale, style]);
  const connections = useMemo(() => getDiagramConnections(nodes, style), [nodes, style]);
  const lastNodeBottom = Math.max(...nodes.map((node) => node.y + node.height));

  const scrollerRef = useRef<HTMLDivElement>(null);
  const pan = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // Zooming keeps one point fixed on screen: the cursor for wheel zoom, otherwise the centre of the view.
  const previousZoom = useRef(zoom);
  const anchor = useRef<{ clientX: number; clientY: number } | null>(null);
  // The diagram's top-left in scroll-content coordinates (unchanged by panning), measured after each zoom.
  const svgOffset = useRef<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const svg = svgRef.current;
    if (!scroller || !svg) return;
    const view = scroller.getBoundingClientRect();
    const measure = () => {
      const box = svg.getBoundingClientRect();
      svgOffset.current = { x: box.left - view.left + scroller.scrollLeft, y: box.top - view.top + scroller.scrollTop };
    };
    const ratio = zoom / previousZoom.current;
    previousZoom.current = zoom;
    const before = svgOffset.current;
    const point = anchor.current ?? { clientX: view.left + view.width / 2, clientY: view.top + view.height / 2 };
    anchor.current = null;
    if (before && ratio !== 1) {
      // Scale the fixed point's distance from the diagram's corner, then scroll it back under the anchor.
      const beforeLeft = view.left + before.x - scroller.scrollLeft;
      const beforeTop = view.top + before.y - scroller.scrollTop;
      const after = svg.getBoundingClientRect();
      scroller.scrollLeft += after.left + (point.clientX - beforeLeft) * ratio - point.clientX;
      scroller.scrollTop += after.top + (point.clientY - beforeTop) * ratio - point.clientY;
    }
    measure();
  }); // every render: style/model changes also move the diagram, and one rect read is cheap

  // Ctrl/⌘ + wheel (and trackpad pinch, which browsers report the same way) zooms at the cursor.
  // A native non-passive listener is needed to stop the browser zooming the whole page.
  const onZoomRef = useRef(onZoom);
  useEffect(() => { onZoomRef.current = onZoom; });
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !onZoomRef.current) return;
      event.preventDefault();
      anchor.current = { clientX: event.clientX, clientY: event.clientY };
      const pixels = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY;
      onZoomRef.current((value) => value * Math.exp(-pixels * WHEEL_ZOOM_SPEED));
    };
    scroller.addEventListener('wheel', onWheel, { passive: false });
    return () => scroller.removeEventListener('wheel', onWheel);
  }, []);

  // Drag to pan with a mouse or pen; touch keeps native scrolling.
  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    if (event.button !== 0 || event.pointerType === 'touch') return;
    const { scrollLeft, scrollTop } = event.currentTarget;
    pan.current = { x: event.clientX, y: event.clientY, left: scrollLeft, top: scrollTop, moved: false };
  };
  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    const state = pan.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (!state.moved) {
      if (Math.hypot(dx, dy) < PAN_THRESHOLD) return;
      state.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.panning = 'true';
    }
    event.currentTarget.scrollLeft = state.left - dx;
    event.currentTarget.scrollTop = state.top - dy;
  };
  const endPan = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = pan.current?.moved ?? false;
    pan.current = null;
    delete event.currentTarget.dataset.panning;
  };

  return (
    <div
      ref={scrollerRef}
      className="diagram-scroller"
      tabIndex={0}
      aria-label="Área panorâmica do diagrama"
      onPointerDown={startPan}
      onPointerMove={movePan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      // A drag that ends over a node must not select it.
      onClickCapture={(event) => { if (suppressClick.current) { event.stopPropagation(); suppressClick.current = false; } }}
    >
      <svg
        ref={svgRef}
        id="prisma-diagram-svg"
        className={`prisma-svg prisma-svg-${style}`}
        data-style={style}
        viewBox={`0 0 ${chrome.width} ${chrome.height}`}
        width={chrome.width * zoom}
        height={chrome.height * zoom}
        role="group"
        aria-labelledby="diagram-title diagram-description"
      >
        <title id="diagram-title">{project.title}</title>
        <desc id="diagram-description">{describeFlow(project)}</desc>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" className="diagram-arrow-head" />
          </marker>
        </defs>
        {style === 'classic' && (
          <g className="classic-chrome">
            <g aria-hidden="true">
              <rect className="classic-source-header main-source" x="70" y="30" width="557" height="31" rx="15.5" />
              <text className="classic-source-label" x="348.5" y="50">{chrome.mainHeader}</text>
              {chrome.hasOtherSources && <>
                <rect className="classic-source-header other-source" x="662" y="30" width="558" height="31" rx="15.5" />
                <text className="classic-source-label" x="941" y="50">{chrome.otherHeader}</text>
              </>}
            </g>
            {([
              ['identification', chrome.identificationTop, chrome.screeningTop - chrome.identificationTop - 54, chrome.identification],
              ['screening', chrome.screeningTop, chrome.includedTop - chrome.screeningTop - 18, chrome.screening],
              ['included', chrome.includedTop, lastNodeBottom - chrome.includedTop + 15, chrome.included],
            ] as [DiagramStage, number, number, string][]).map(([stage, y, height, label]) => (
              <g
                key={stage}
                className="classic-stage-group"
                role="button"
                tabIndex={0}
                aria-label={`${label}. Ir para o formulário desta etapa.`}
                onClick={() => onSelectStage?.(stage)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectStage?.(stage);
                  }
                }}
              >
                <rect className="classic-stage-band" x="17" y={y} width="31" height={height} rx="11" />
                <text className="classic-stage-label" transform={`translate(36 ${y + height / 2}) rotate(-90)`}>{label}</text>
              </g>
            ))}
          </g>
        )}
        <g aria-hidden="true" className="diagram-connections">
          {connections.map((connection) => <path key={connection.id} d={connection.d} markerEnd="url(#arrowhead)" />)}
        </g>
        <g>
          {nodes.map((node) => (
            <g
              key={node.id}
              className={`diagram-node ${node.kind ?? ''} ${selected === node.field ? 'selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`${node.lines.join('. ')}. Selecionar para editar detalhes.`}
              onClick={() => onSelect(node.field, node.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(node.field, node.id);
                }
              }}
            >
              <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={style === 'classic' ? 0 : 2} />
              {node.lines.map((line, index) => (
                <text
                  key={`${line}-${index}`}
                  x={style === 'classic' ? node.x + node.width / 2 : node.x + 18}
                  y={style === 'classic' ? node.y + node.height / 2 - ((node.lines.length - 1) * 15) / 2 + index * 15 + 4 : node.y + 24 + index * 20}
                  textAnchor={style === 'classic' ? 'middle' : undefined}
                  className={index === 0 ? 'node-heading' : 'node-line'}
                >
                  {line}
                </text>
              ))}
            </g>
          ))}
        </g>
        <text x={style === 'classic' ? 70 : 22} y={chrome.height - 16} className="diagram-credit">{chrome.credit}</text>
      </svg>
    </div>
  );
}
