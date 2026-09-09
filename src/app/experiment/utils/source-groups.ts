import type { EnhancedTextBlock } from "@/app/experiment/types/text-splitting";
import type { Vector, VectorGroup } from "@/app/experiment/types/chart";

const SOURCE_COLORS = [
  "rgba(37, 99, 235, 0.65)", // blue
  "rgba(22, 163, 74, 0.65)", // green
  "rgba(217, 119, 6, 0.65)", // amber
  "rgba(147, 51, 234, 0.65)", // purple
  "rgba(220, 38, 38, 0.65)", // red
  "rgba(13, 148, 136, 0.65)", // teal
];

/**
 * Split 2-D points into one dataset per source document, so the scatter plot
 * gets a legend and a color per source. `points[i]` must correspond to
 * `blocks[i]`.
 */
export const groupPointsBySource = (
  points: Vector[],
  blocks: EnhancedTextBlock[]
): VectorGroup[] => {
  const groups = new Map<string, VectorGroup>();
  points.forEach((point, index) => {
    const source = blocks[index]?.source;
    const key = source ? `${source.index}` : "unknown";
    const label = source?.shortTitle ?? "Source unknown";
    if (!groups.has(key)) {
      const color = SOURCE_COLORS[groups.size % SOURCE_COLORS.length];
      groups.set(key, { label, color, data: [] });
    }
    groups.get(key)!.data.push(point);
  });
  return Array.from(groups.values());
};
