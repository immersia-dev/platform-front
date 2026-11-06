import {
  SkeletonBlock,
  SkeletonStatGrid,
  SkeletonTable,
  SkeletonText,
} from './Skeleton';

type SkeletonVariant = 'analytics' | 'detail' | 'form' | 'studies' | 'table';

type PageDataSkeletonProps = {
  routePath: string;
};

function getSkeletonVariant(routePath: string): SkeletonVariant {
  if (routePath.includes('/profile')) return 'form';
  if (routePath.includes('/overview') || routePath.includes('/results')) return 'analytics';
  if (routePath.match(/\/app\/(groups|students|organizations|studies)\/[^/]+/)) return 'detail';
  if (routePath.includes('/studies')) return 'studies';
  return 'table';
}

function HeaderSkeleton() {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <SkeletonText className="h-3 w-28" />
        <SkeletonText className="mt-4 h-9 w-72 max-w-full" />
        <SkeletonText className="mt-4 h-4 w-[32rem] max-w-full" />
      </div>
      <div className="flex flex-wrap gap-3">
        <SkeletonBlock className="h-11 w-36 rounded-full" />
        <SkeletonBlock className="h-11 w-40 rounded-full" />
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <>
      <SkeletonStatGrid />
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SkeletonBlock className="h-72 rounded-[28px]" />
        <SkeletonBlock className="h-72 rounded-[28px]" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SkeletonBlock className="h-[360px] rounded-[28px]" />
        <SkeletonBlock className="h-[360px] rounded-[28px]" />
      </section>
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <section className="training-hero">
        <div>
          <SkeletonText className="h-3 w-28" />
          <SkeletonText className="mt-5 h-9 w-80 max-w-full" />
          <SkeletonText className="mt-5 h-4 w-[34rem] max-w-full" />
          <SkeletonText className="mt-3 h-4 w-[26rem] max-w-full" />
          <SkeletonBlock className="mt-8 h-3 w-full rounded-full" />
          <div className="mt-5 flex flex-wrap gap-3">
            <SkeletonBlock className="h-8 w-28 rounded-full" />
            <SkeletonBlock className="h-8 w-32 rounded-full" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="h-36 rounded-[28px]" />
          ))}
        </div>
      </section>
      <SkeletonTable rows={4} columns={5} />
    </>
  );
}

function FormSkeleton() {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <SkeletonBlock className="h-80 rounded-[28px]" />
      <div className="__enableXr__ form-card">
        <SkeletonText className="h-5 w-48" />
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index}>
              <SkeletonText className="h-3 w-24" />
              <SkeletonBlock className="mt-3 h-12 rounded-[20px]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudiesSkeleton() {
  return (
    <>
      <SkeletonStatGrid count={3} />
      <section className="gallery-toolbar-shell">
        <div>
          <SkeletonText className="h-5 w-52" />
          <SkeletonText className="mt-3 h-3 w-80 max-w-full" />
        </div>
        <SkeletonBlock className="h-11 w-80 rounded-full" />
      </section>
      <section className="module-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <article key={index} className="card-training">
            <SkeletonBlock className="h-48 w-full rounded-none" />
            <div className="p-6">
              <SkeletonText className="h-5 w-52" />
              <SkeletonText className="mt-4 h-4 w-full" />
              <SkeletonText className="mt-3 h-4 w-3/4" />
              <SkeletonBlock className="mt-6 h-3 w-full rounded-full" />
              <SkeletonBlock className="mt-6 h-12 w-full rounded-[22px]" />
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

export default function PageDataSkeleton({ routePath }: PageDataSkeletonProps) {
  const variant = getSkeletonVariant(routePath);

  return (
    <div className="space-y-8" role="status" aria-live="polite" aria-label="Carregando dados">
      <HeaderSkeleton />
      {variant === 'analytics' ? <AnalyticsSkeleton /> : null}
      {variant === 'detail' ? <DetailSkeleton /> : null}
      {variant === 'form' ? <FormSkeleton /> : null}
      {variant === 'studies' ? <StudiesSkeleton /> : null}
      {variant === 'table' ? (
        <>
          <SkeletonStatGrid />
          <SkeletonTable />
        </>
      ) : null}
    </div>
  );
}
