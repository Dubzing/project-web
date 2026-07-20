export const STATUSES = [
  { key: "todo", label: "TO DO", color: "#A1A1AA" },
  { key: "in_progress", label: "IN PROGRESS", color: "#06B6D4" },
  { key: "done", label: "DONE", color: "#10B981" },
];

export const PRIORITIES = {
  low: { label: "LOW", color: "#A1A1AA" },
  medium: { label: "MEDIUM", color: "#06B6D4" },
  high: { label: "HIGH", color: "#F59E0B" },
  critical: { label: "CRITICAL", color: "#EF4444" },
};

export const PROJECT_COLORS = ["#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#3B82F6"];

export function formatDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export function dueMeta(iso) {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: "#EF4444" };
  if (diff === 0) return { label: "Due today", color: "#F59E0B" };
  if (diff <= 3) return { label: `Due in ${diff}d`, color: "#F59E0B" };
  return { label: formatDate(iso), color: "#A1A1AA" };
}
