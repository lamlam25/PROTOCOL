import type { Database } from "@/types/database.types";

type Allocation = Database["public"]["Tables"]["budget_allocations"]["Row"];
type Transaction = Database["public"]["Tables"]["budget_transactions"]["Row"];

export interface SankeyNodeDatum {
  name: string;
}
export interface SankeyLinkDatum {
  source: number;
  target: number;
  value: number;
}
export interface SankeyChartData {
  nodes: SankeyNodeDatum[];
  links: SankeyLinkDatum[];
}

/**
 * Three tiers: source (funder) -> category -> recipient. Node color in
 * SankeyChart is driven by `payload.depth`, which recharts computes for us
 * (0/1/2) — we don't need to track tier separately.
 */
export function buildBudgetSankeyData(
  allocations: Allocation[],
  transactions: Transaction[],
  locale: string,
  categoryLabels: Record<string, string>
): SankeyChartData {
  const nodeIndex = new Map<string, number>();
  const nodes: SankeyNodeDatum[] = [];

  function nodeFor(name: string): number {
    const existing = nodeIndex.get(name);
    if (existing !== undefined) return existing;
    const index = nodes.length;
    nodeIndex.set(name, index);
    nodes.push({ name });
    return index;
  }

  const linkValue = new Map<string, number>();
  function addLink(source: number, target: number, value: number) {
    if (value <= 0) return;
    const key = `${source}->${target}`;
    linkValue.set(key, (linkValue.get(key) ?? 0) + value);
  }

  const categoryLabelByAllocationId = new Map<string, string>();
  for (const allocation of allocations) {
    const categoryLabel =
      categoryLabels[allocation.category] ?? allocation.category;
    categoryLabelByAllocationId.set(allocation.id, categoryLabel);
    const sourceNode = nodeFor(allocation.source || "—");
    const categoryNode = nodeFor(categoryLabel);
    addLink(sourceNode, categoryNode, Number(allocation.allocated_amount));
  }

  for (const tx of transactions) {
    if (tx.transaction_type !== "disbursement") continue;
    const categoryLabel = tx.allocation_id
      ? categoryLabelByAllocationId.get(tx.allocation_id)
      : undefined;
    if (!categoryLabel) continue;
    const recipientName =
      (locale === "bn" && tx.recipient_name_bn) ||
      tx.recipient_name ||
      "—";
    const categoryNode = nodeFor(categoryLabel);
    const recipientNode = nodeFor(recipientName);
    addLink(categoryNode, recipientNode, Number(tx.amount));
  }

  const links: SankeyLinkDatum[] = Array.from(linkValue.entries()).map(
    ([key, value]) => {
      const [source, target] = key.split("->").map(Number);
      return { source, target, value };
    }
  );

  return { nodes, links };
}
