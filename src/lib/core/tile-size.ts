/**
 * Inputs needed to compute a watermark tile big enough for the rendered
 * text plus the configured spacing between repeats.
 */
export interface TileSizeInput {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  rotateDeg: number;
  spaceBetween: number;
}

export interface TileSize {
  width: number;
  height: number;
}

/**
 * Approximate text-height multiplier. Canvas `measureText` reports
 * accurate width but height needs to be derived from the font's
 * em-square. 1.2 is a safe modern-font line-height; it's enough breathing
 * room that the glyph descenders never get clipped in the rotated tile.
 */
const TEXT_HEIGHT_FACTOR = 1.2;

/**
 * Extra room added around the rotated text bounding box so glyphs whose
 * actual rendered extent exceeds what `measureText` reports (notably
 * emoji and bold-weight fonts on some platforms) don't get clipped at
 * the canvas boundary. Scales with font size so it stays proportional.
 *
 * 1.5 (≈ 1.5x the font size of breathing room around the rotated bbox)
 * is generous enough to absorb emoji presentation differences across
 * platforms and the extra advance of bold-weight rendering, with a
 * negligible density cost compared to the alternative (clipped text).
 */
const SAFETY_MARGIN_FACTOR = 1.5;

/**
 * Computes the size of one watermark tile so the text fits inside its
 * rotated bounding box and there's `spaceBetween` pixels of breathing
 * room around it before the pattern repeats.
 *
 * Falls back to a coarse character-width estimate outside the browser
 * (SSR, headless tests with no DOM) so callers don't need to special-case
 * the SSR path.
 */
export function computeTileSize(input: TileSizeInput): TileSize {
  const { width: textWidth, height: textHeight } = measureText(input);
  const radians = Math.abs(input.rotateDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  // Bounding box of the rotated text rectangle.
  const rotatedWidth = textWidth * cos + textHeight * sin;
  const rotatedHeight = textWidth * sin + textHeight * cos;

  // Clamp spaceBetween to >= 0. A negative value would shrink the tile
  // below the text's natural bounding box, and the underlying canvas
  // engine reacts by scaling the text down to fit, producing tiny
  // illegible watermarks. To get denser tiling, use a smaller fontSize
  // or shorter content rather than a negative spaceBetween.
  const space = Math.max(0, input.spaceBetween);
  const safety = input.fontSize * SAFETY_MARGIN_FACTOR;
  return {
    width: Math.ceil(rotatedWidth + space + safety),
    height: Math.ceil(rotatedHeight + space + safety),
  };
}

function measureText({ text, fontSize, fontFamily, fontWeight }: TileSizeInput): TileSize {
  const fallbackWidth = text.length * fontSize * 0.6;
  const height = fontSize * TEXT_HEIGHT_FACTOR;

  if (typeof document === 'undefined') {
    return { width: fallbackWidth, height };
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { width: fallbackWidth, height };

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return { width: ctx.measureText(text).width, height };
}
