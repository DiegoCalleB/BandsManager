/**
 * Pure time helpers for the concert cutter.
 * Extracted so the timestamp grammar can be unit-tested without rendering the modal.
 */

/** Formats seconds as `mm:ss` (or `h:mm:ss`); invalid or negative input yields `00:00`. */
export const formatSeconds = (totalSecs: number): string => {
  if (isNaN(totalSecs) || totalSecs < 0) return "00:00";
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = Math.floor(totalSecs % 60);

  const mStr = String(mins).padStart(2, "0");
  const sStr = String(secs).padStart(2, "0");

  if (hrs > 0) {
    return `${hrs}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
};

/** Parses `ss`, `mm:ss` or `h:mm:ss` into seconds; empty or malformed input yields 0. */
export const parseTimeToSeconds = (str: string): number => {
  if (!str) return 0;
  const parts = str.split(":").map((p) => parseFloat(p) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseFloat(str) || 0;
};
