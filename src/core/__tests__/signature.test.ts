import {
  buildSignatureSvg,
  isEmptySignature,
  scaleToViewBox,
  SIGNATURE_VIEWBOX_WIDTH,
  SIGNATURE_VIEWBOX_HEIGHT,
  type SignatureStroke,
} from '../../core/signature';

describe('signature SVG helpers', () => {
  it('serializes strokes into a self-contained SVG', () => {
    const strokes: SignatureStroke[] = [
      [
        { x: 0, y: 0 },
        { x: 100, y: 50 },
        { x: 200, y: 0 },
      ],
    ];
    const svg = buildSignatureSvg(strokes);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain(`viewBox="0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}"`);
    expect(svg).toContain('<path');
    expect(svg).toContain('M 0.0 0.0');
    expect(svg).toContain('L 100.0 50.0');
    expect(svg).toContain('L 200.0 0.0');
  });

  it('ignores single-point strokes', () => {
    const svg = buildSignatureSvg([[{ x: 5, y: 5 }]]);
    expect(svg).not.toContain('<path');
    expect(isEmptySignature(svg)).toBe(true);
  });

  it('reports an empty signature correctly', () => {
    expect(isEmptySignature(buildSignatureSvg([]))).toBe(true);
    expect(
      isEmptySignature(
        buildSignatureSvg([
          [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
        ]),
      ),
    ).toBe(false);
  });

  it('maps layout coordinates into the viewBox space', () => {
    const mapped = scaleToViewBox({ x: 100, y: 50 }, 400, 150);
    expect(mapped.x).toBe(200);
    expect(mapped.y).toBe(100);
  });

  it('does not divide by zero on an empty layout', () => {
    const mapped = scaleToViewBox({ x: 1, y: 2 }, 0, 0);
    expect(Number.isFinite(mapped.x)).toBe(true);
    expect(Number.isFinite(mapped.y)).toBe(true);
  });
});
