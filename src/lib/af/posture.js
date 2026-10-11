// Spoken posture cues from hand position in the camera frame (pixel landmarks, ~640x480 video).
export function postureIssue(lm, w = 640, h = 480) {
  if (!lm) return "I can't see your hand. Raise it in front of the camera";
  const palm = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y);
  if (palm < h * 0.08) return "Bring your hand a little closer to the camera";
  if (palm > h * 0.38) return "Move your hand back a little";
  const cx = lm[9].x / w, cy = lm[9].y / h;
  if (cx < 0.12 || cx > 0.88) return "Move your hand toward the center";
  if (cy < 0.08) return "Lower your hand a little";
  if (cy > 0.92) return "Raise your hand a little";
  return null;
}