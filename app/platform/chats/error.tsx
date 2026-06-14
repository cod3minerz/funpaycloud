'use client';

export default function ChatsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-[520px] rounded-2xl border border-[var(--pf-border-strong)] bg-[var(--pf-surface)] p-6 text-center shadow-[var(--pf-shadow-soft)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          !
        </div>
        <h1 className="text-2xl font-black text-[var(--pf-text)]">Чаты не загрузились</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--pf-text-muted)]">
          Не удалось открыть страницу чатов. Попробуйте перезагрузить раздел или вернуться назад.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button type="button" className="platform-btn-primary justify-center" onClick={() => reset()}>
            Повторить
          </button>
          <button type="button" className="platform-btn-secondary justify-center" onClick={() => window.history.back()}>
            Назад
          </button>
        </div>
      </div>
    </section>
  );
}
