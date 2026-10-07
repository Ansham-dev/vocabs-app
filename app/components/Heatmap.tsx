"use client";

import type { DayCount } from "./types";

function level(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  return 3;
}

const SHADES = [
  "bg-zinc-200 dark:bg-zinc-800",
  "bg-green-200 dark:bg-green-900",
  "bg-green-400 dark:bg-green-700",
  "bg-green-600 dark:bg-green-500",
];

export default function Heatmap({ days }: { days: DayCount[] }) {
  // GitHub-style: columns = weeks (oldest left), 7 rows = weekdays.
  if (days.length === 0) return null;
  const weeks: DayCount[][] = [];
  const firstWeekday = new Date(days[0].date + "T00:00:00Z").getUTCDay();
  const padded: (DayCount | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...days,
  ];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7) as DayCount[]);
  }

  return (
    <div>
      <div
        className="grid auto-cols-[12px] grid-flow-col gap-[3px]"
        style={{ gridTemplateRows: "repeat(7, 12px)" }}
      >
        {weeks.map((week, wi) =>
          week.map((d, di) =>
            d === null || d === undefined ? (
              <span key={`${wi}-${di}`} className="h-3 w-3" />
            ) : (
              <span
                key={d.date}
                title={`${d.date}: ${d.count} review${d.count === 1 ? "" : "s"}`}
                className={`h-3 w-3 rounded-[3px] ${SHADES[level(d.count)]}`}
              />
            )
          )
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
        <span>Less</span>
        {SHADES.map((s, i) => (
          <span key={i} className={`h-3 w-3 rounded-[3px] ${s}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
