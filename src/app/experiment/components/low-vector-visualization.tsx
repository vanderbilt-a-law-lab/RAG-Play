import { FC, useMemo } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  Plugin,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import {
  Vector,
  LowVectorVisualizationProps,
} from "@/app/experiment/types/chart";

const nearestNeighborsPlugin: Plugin<"scatter"> = {
  id: "nearestNeighbors",
  afterDraw: (chart) => {
    const { ctx, scales } = chart;
    // The query is always the last dataset; every other dataset holds chunks.
    const datasets = chart.data.datasets;
    const queryDataset = datasets.length > 1 ? datasets[datasets.length - 1] : undefined;
    const vectors = datasets
      .slice(0, -1)
      .flatMap((dataset) => dataset.data as Vector[]);

    if (!queryDataset?.data[0] || vectors.length === 0) {
      return;
    }

    const query = queryDataset.data[0] as Vector;

    // Calculate distances and find 5 nearest neighbors
    const nearestPoints = vectors
      .map((point) => ({
        ...point,
        distance: Math.sqrt(
          Math.pow((point.x as number) - (query.x as number), 2) +
            Math.pow((point.y as number) - (query.y as number), 2)
        ),
      }))
      .sort((a, b) => a.distance! - b.distance!)
      .slice(0, 5);

    // Draw dashed lines with more visible style
    ctx.save();
    ctx.strokeStyle = "rgba(128, 128, 128, 0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();

    nearestPoints.forEach((point) => {
      const startX = scales.x.getPixelForValue(query.x as number);
      const startY = scales.y.getPixelForValue(query.y as number);
      const endX = scales.x.getPixelForValue(point.x as number);
      const endY = scales.y.getPixelForValue(point.y as number);

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    });

    ctx.stroke();
    ctx.restore();
  },
};

// Register the plugin
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  nearestNeighborsPlugin
);

const toPoints = (points: Vector[]) =>
  points.map((point) => ({
    x: point.x,
    y: point.y,
    title: point.title,
    details: point.details,
  }));

const LowVectorVisualization: FC<LowVectorVisualizationProps> = ({
  data,
  groups,
  query,
  title = "Low Vector Visualization",
  datasetLabel = "Vectors",
  queryLabel = "Query",
  className,
}) => {
  const chartData = useMemo(() => {
    const datasets =
      groups && groups.length > 0
        ? groups.map((group) => ({
            label: group.label,
            data: toPoints(group.data),
            backgroundColor: group.color,
            pointRadius: 6,
            pointHoverRadius: 8,
          }))
        : [
            {
              label: datasetLabel,
              data: toPoints(data),
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              pointRadius: 6,
              pointHoverRadius: 8,
            },
          ];

    if (query) {
      datasets.push({
        label: queryLabel,
        data: [
          {
            x: query.x,
            y: query.y,
            title: query.title,
            details: query.details,
          },
        ],
        backgroundColor: "rgba(255, 99, 132, 0.8)",
        pointRadius: 8,
        pointHoverRadius: 10,
      });
    }

    return { datasets };
  }, [data, groups, query, datasetLabel, queryLabel]);

  const options: ChartOptions<"scatter"> & {
    plugins: {
      nearestNeighbors: {
        enabled: boolean;
      };
    };
  } = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"scatter">) => {
            const point = context.raw as Vector;
            const lines: string[] = [];

            if (point.title) {
              lines.push(point.title);
            }

            if (point.details?.length) {
              lines.push(...point.details);
            }

            return lines;
          },
        },
      },
      nearestNeighbors: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
        title: {
          display: true,
          text: "X Axis",
        },
      },
      y: {
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
        title: {
          display: true,
          text: "Y Axis",
        },
      },
    },
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm",
        className
      )}
      role="region"
      aria-label={`${title} scatter plot`}
    >
      <Scatter options={options} data={chartData} />
    </div>
  );
};

export default LowVectorVisualization;
