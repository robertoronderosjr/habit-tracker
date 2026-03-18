type Point = { date: string; completed: number; rate: number };

export default function CompletionChart({ data }: { data: Point[] }) {
  const max = Math.max(...data.map((d) => d.rate), 100);

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex h-56 items-end gap-1 overflow-x-auto">
        {data.map((d) => (
          <div key={d.date} className="flex min-w-5 flex-1 flex-col items-center justify-end gap-1">
            <div
              className="w-full rounded-t bg-indigo-500"
              style={{ height: `${Math.max(4, Math.round((d.rate / max) * 180))}px` }}
              title={`${d.date}: ${d.rate}%`}
            />
            <span className="text-[10px] text-zinc-500">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
