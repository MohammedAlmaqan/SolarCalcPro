/**
 * Pure signature SVG helpers. The drawing pad captures strokes in a fixed
 * coordinate space (`SIGNATURE_VIEWBOX_*`) and serializes them to an inline
 * SVG markup string that is stored on the company profile and embedded
 * directly in the proposal PDF.
 */

export interface SignaturePoint {
  x: number;
  y: number;
}

export type SignatureStroke = SignaturePoint[];

export const SIGNATURE_VIEWBOX_WIDTH = 800;
export const SIGNATURE_VIEWBOX_HEIGHT = 300;

export const SIGNATURE_VIEWBOX = `0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}`;

export const SIGNATURE_STROKE_COLOR = '#131c20';
export const SIGNATURE_STROKE_WIDTH = 4;

export function strokePath(stroke: SignatureStroke): string {
  return stroke
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

/** Serialize strokes into a self-contained inline SVG markup string. */
export function buildSignatureSvg(strokes: SignatureStroke[]): string {
  const paths = strokes
    .filter((stroke) => stroke.length >= 2)
    .map(
      (stroke) =>
        `<path d="${strokePath(stroke)}" fill="none" stroke="${SIGNATURE_STROKE_COLOR}" ` +
        `stroke-width="${SIGNATURE_STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round" />`,
    )
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="${SIGNATURE_VIEWBOX}">` +
    `${paths}</svg>`
  );
}

/** True when the stored signature contains no drawn strokes. */
export function isEmptySignature(svg: string): boolean {
  return !svg.includes('<path');
}

/** Map a measured layout size to the canonical viewBox coordinate space. */
export function scaleToViewBox(
  point: SignaturePoint,
  layoutWidth: number,
  layoutHeight: number,
): SignaturePoint {
  return {
    x: (point.x / Math.max(layoutWidth, 1)) * SIGNATURE_VIEWBOX_WIDTH,
    y: (point.y / Math.max(layoutHeight, 1)) * SIGNATURE_VIEWBOX_HEIGHT,
  };
}
