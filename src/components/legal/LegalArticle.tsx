import type { ReactNode } from 'react';

type LegalArticleProps = {
  title: string;
  description: string;
  updatedAt: string;
  children: ReactNode;
};

export default function LegalArticle({ title, description, updatedAt, children }: LegalArticleProps) {
  return (
    <article className="legal-article">
      <header className="legal-hero">
        <span className="legal-chip">Юридическая информация</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="legal-updated">Последнее обновление: {updatedAt}</div>
      </header>
      <div className="legal-content">{children}</div>
    </article>
  );
}

