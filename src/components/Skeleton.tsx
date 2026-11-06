type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return (
    <div
      className={['animate-pulse rounded-[20px] bg-white/[0.09]', className].join(' ')}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ className = '' }: SkeletonBlockProps) {
  return (
    <div
      className={['animate-pulse rounded-full bg-white/10', className].join(' ')}
      aria-hidden="true"
    />
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="__enableXr__ stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-9 w-9 rounded-2xl" />
              <SkeletonText className="h-3 w-24" />
            </div>
            <SkeletonBlock className="h-7 w-7 rounded-full" />
          </div>
          <SkeletonText className="mt-5 h-9 w-24" />
          <SkeletonText className="mt-4 h-3 w-36" />
        </article>
      ))}
    </section>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <section className="__enableXr__ table-shell">
      <div className="table-shell-header">
        <div>
          <SkeletonText className="h-5 w-48" />
          <SkeletonText className="mt-3 h-3 w-72 max-w-full" />
        </div>
        <div className="table-toolbar">
          <SkeletonBlock className="h-11 w-60 rounded-full" />
          <SkeletonBlock className="h-11 w-44 rounded-full" />
        </div>
      </div>

      <div className="overflow-hidden px-6 py-5">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, index) => (
            <SkeletonText key={`head-${index}`} className="h-3 w-20" />
          ))}
        </div>

        <div className="mt-6 space-y-5">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid items-center gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }, (_, columnIndex) => (
                <SkeletonText
                  key={`${rowIndex}-${columnIndex}`}
                  className={columnIndex === 0 ? 'h-4 w-32' : 'h-4 w-20'}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
