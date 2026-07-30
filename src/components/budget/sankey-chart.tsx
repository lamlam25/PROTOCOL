"use client";

import { useTheme } from "next-themes";
import {
  Sankey,
  ResponsiveContainer,
  Tooltip,
  Rectangle,
  Layer,
  type TooltipContentProps,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { SankeyChartData, SankeyLinkDatum } from "@/lib/budget-sankey";
import type { SankeyNode, SankeyNodeProps, SankeyLinkProps } from "recharts";

// Ordinal ramp (source -> category -> recipient), darkest -> lightest,
// validated with the dataviz skill's validator: passes lightness-monotone,
// adjacent-ΔL, light-end-contrast, and single-hue checks in both modes.
const TIER_COLORS_LIGHT = ["#004D39", "#006A4E", "#5FAE8F"];
const TIER_COLORS_DARK = ["#1D6B4C", "#1F9D73", "#8FE0C0"];
const LINK_COLOR = "var(--border)";

function renderNode(tierColors: string[]) {
  return function Node(props: SankeyNodeProps) {
    const { x, y, width, height, payload } = props;
    const depth = (payload as SankeyNode).depth ?? 0;
    const color = tierColors[Math.min(depth, tierColors.length - 1)];
    const isLeftmost = depth === 0;

    return (
      <Layer>
        <Rectangle
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          radius={2}
        />
        <text
          x={isLeftmost ? x - 6 : x + width + 6}
          y={y + height / 2}
          textAnchor={isLeftmost ? "end" : "start"}
          dominantBaseline="middle"
          className="fill-foreground text-xs"
        >
          {payload.name}
        </text>
      </Layer>
    );
  };
}

function renderLink(props: SankeyLinkProps) {
  const {
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    sourceRelativeY,
    targetRelativeY,
    linkWidth,
  } = props;

  const path = `
    M${sourceX},${sourceY + sourceRelativeY}
    C${sourceControlX},${sourceY + sourceRelativeY}
      ${targetControlX},${targetY + targetRelativeY}
      ${targetX},${targetY + targetRelativeY}
  `;

  return (
    <path
      d={path}
      fill="none"
      stroke={LINK_COLOR}
      strokeOpacity={0.4}
      strokeWidth={Math.max(linkWidth, 1)}
    />
  );
}

function renderTooltip(locale: string) {
  return function CustomTooltip({ active, payload }: TooltipContentProps) {
    if (!active || !payload || payload.length === 0) return null;
    const entry = payload[0];
    const raw = entry.payload as SankeyLinkDatum & {
      source?: SankeyNode;
      target?: SankeyNode;
      name?: string;
    };

    const isLink = raw.source && raw.target;
    const title = isLink
      ? `${(raw.source as SankeyNode).name} → ${(raw.target as SankeyNode).name}`
      : raw.name;

    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <p className="font-semibold">
          {formatCurrency(Number(entry.value ?? 0), locale)}
        </p>
        <p className="text-muted-foreground">{title}</p>
      </div>
    );
  };
}

export function BudgetSankeyChart({
  data,
  locale,
}: {
  data: SankeyChartData;
  locale: string;
}) {
  const { resolvedTheme } = useTheme();
  const tierColors = resolvedTheme === "dark" ? TIER_COLORS_DARK : TIER_COLORS_LIGHT;

  if (data.links.length === 0) return null;

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          nodeWidth={10}
          nodePadding={20}
          margin={{ top: 8, right: 180, bottom: 8, left: 150 }}
          link={renderLink}
          node={renderNode(tierColors)}
        >
          <Tooltip content={renderTooltip(locale)} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
