import { ChartOptions } from "chart.js";

export interface Vector {
  x: number;
  y: number;
  title?: string;
  details?: string[];
  distance?: number;
}

/** A named, colored set of points (one per source document). */
export interface VectorGroup {
  label: string;
  color: string;
  data: Vector[];
}

export interface LowVectorVisualizationProps {
  data: Vector[];
  /** When given, replaces `data` with one dataset per group. */
  groups?: VectorGroup[];
  query?: Vector;
  title?: string;
  datasetLabel?: string;
  queryLabel?: string;
  className?: string;
}

export interface NearestNeighborsPluginOptions {
  enabled: boolean;
}

export type ExtendedChartOptions = ChartOptions<"scatter"> & {
  plugins: {
    nearestNeighbors: NearestNeighborsPluginOptions;
  };
};
