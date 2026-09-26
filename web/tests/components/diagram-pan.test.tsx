import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createProject } from '../../src/domain/project';
import { PrismaDiagram } from '../../src/features/builder/PrismaDiagram';

describe('canvas do diagrama', () => {
  it('arrasta para mover sem selecionar o nó sob o cursor, e o clique simples ainda seleciona', () => {
    const onSelect = vi.fn();
    render(<PrismaDiagram project={createProject({ example: true })} locale="pt-BR" selected="databases" onSelect={onSelect} zoom={2} />);
    const scroller = screen.getByLabelText('Área panorâmica do diagrama');
    scroller.setPointerCapture = vi.fn(); // not implemented by jsdom
    Object.assign(scroller, { scrollLeft: 300, scrollTop: 200 });
    const node = screen.getAllByRole('button', { name: /Selecionar para editar detalhes/ })[0];

    fireEvent.pointerDown(node, { button: 0, pointerType: 'mouse', clientX: 100, clientY: 100 });
    fireEvent.pointerMove(node, { pointerType: 'mouse', clientX: 160, clientY: 140 });
    expect(scroller.scrollLeft).toBe(240);
    expect(scroller.scrollTop).toBe(160);
    fireEvent.pointerUp(node, { pointerType: 'mouse', clientX: 160, clientY: 140 });
    fireEvent.click(node);
    expect(onSelect).not.toHaveBeenCalled();

    // Movement under the threshold is still a click.
    fireEvent.pointerDown(node, { button: 0, pointerType: 'mouse', clientX: 100, clientY: 100 });
    fireEvent.pointerMove(node, { pointerType: 'mouse', clientX: 102, clientY: 101 });
    fireEvent.pointerUp(node, { pointerType: 'mouse', clientX: 102, clientY: 101 });
    fireEvent.click(node);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('Ctrl/⌘ + roda aplica zoom e bloqueia o zoom da página; a roda sozinha só rola', () => {
    const onZoom = vi.fn();
    render(<PrismaDiagram project={createProject({ example: true })} locale="pt-BR" selected="databases" onSelect={() => undefined} zoom={1} onZoom={onZoom} />);
    const scroller = screen.getByLabelText('Área panorâmica do diagrama');

    const zoomIn = new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, cancelable: true });
    scroller.dispatchEvent(zoomIn);
    expect(zoomIn.defaultPrevented).toBe(true);
    const update = onZoom.mock.calls[0][0] as (zoom: number) => number;
    expect(update(1)).toBeCloseTo(Math.exp(0.2));

    const scroll = new WheelEvent('wheel', { deltaY: 100, cancelable: true });
    scroller.dispatchEvent(scroll);
    expect(scroll.defaultPrevented).toBe(false);
    expect(onZoom).toHaveBeenCalledTimes(1);
  });
});
