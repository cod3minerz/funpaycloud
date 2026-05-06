import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from '@/shared/streamline/icons';

import { cn } from "./utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full items-center justify-between gap-3", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn(
        "isolate inline-flex items-center overflow-hidden rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface-2)] shadow-[var(--pf-shadow-soft)]",
        className,
      )}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive,
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        "relative inline-flex min-h-9 min-w-9 items-center justify-center border-r border-[var(--pf-border)] px-3 text-sm font-semibold text-[var(--pf-text-muted)] transition-colors hover:bg-[var(--pf-surface)] hover:text-[var(--pf-text)] focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pf-accent)]",
        isActive && "z-10 bg-[var(--pf-accent)] text-white hover:bg-[var(--pf-accent)] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn("rounded-l-xl pl-2.5 pr-3", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
      <span className="sr-only sm:not-sr-only sm:ml-1">Назад</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn("rounded-r-xl border-r-0 pl-3 pr-2.5", className)}
      {...props}
    >
      <span className="sr-only sm:not-sr-only sm:mr-1">Вперёд</span>
      <ChevronRightIcon className="size-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "relative inline-flex min-h-9 min-w-9 items-center justify-center border-r border-[var(--pf-border)] px-2 text-sm font-semibold text-[var(--pf-text-dim)]",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
