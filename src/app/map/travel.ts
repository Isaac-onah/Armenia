import { PIN_DEFS, type PlaceSlug } from '../core/models';

const VIEW_W = 1024;
const VIEW_H = 913;
const SCALE = 1.85;

/** Zoom the board so a pin sits in the part of the map the place sheet does not cover. */
export function travelTransform(
  place: Exclude<PlaceSlug, 'tv' | 'screen'>,
  stage: { width: number; height: number },
): string {
  const pin = PIN_DEFS[place];
  const fit = Math.min(stage.width / VIEW_W, stage.height / VIEW_H) || 1;
  const px = (stage.width - VIEW_W * fit) / 2 + pin.cx * fit;
  const py = (stage.height - VIEW_H * fit) / 2 + pin.cy * fit;
  const cx = stage.width / 2;
  const cy = stage.height / 2;
  const sideSheet = stage.width >= 720;
  const aimX = stage.width * (sideSheet ? 0.3 : 0.5);
  const aimY = stage.height * 0.46;
  const tx = aimX - cx - (px - cx) * SCALE;
  const ty = aimY - cy - (py - cy) * SCALE;
  return `translate(${tx}px, ${ty}px) scale(${SCALE})`;
}
