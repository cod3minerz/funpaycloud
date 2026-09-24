'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as RadixAccordion from '@radix-ui/react-accordion';
import * as RadixSlider from '@radix-ui/react-slider';
import * as RadixTabs from '@radix-ui/react-tabs';
import Link from 'next/link';
import {
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { X } from '@/shared/streamline/icons';

function join(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

export function Button({ href, variant = 'primary', size = 'md', block, startIcon, endIcon, className, children, ...props }: ButtonProps) {
  const classes = join('ds-button', `ds-button--${variant}`, `ds-button--${size}`, block && 'ds-button--block', className);
  const content = <>{startIcon}{children}{endIcon}</>;
  if (href) return <Link href={href} className={classes} onClick={props.onClick as unknown as MouseEventHandler<HTMLAnchorElement>} aria-label={props['aria-label']}>{content}</Link>;
  return <button className={classes} {...props}>{content}</button>;
}

export function IconButton({ label, children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" aria-label={label} title={label} className={join('ds-icon-button', className)} {...props}>{children}</button>;
}

export function Card({ className, raised, interactive, ...props }: HTMLAttributes<HTMLDivElement> & { raised?: boolean; interactive?: boolean }) {
  return <div className={join('ds-card', raised && 'ds-card--raised', interactive && 'ds-card--interactive', className)} {...props} />;
}
export function CardHeader(props: HTMLAttributes<HTMLDivElement>) { return <div {...props} className={join('ds-card__header', props.className)} />; }
export function CardContent(props: HTMLAttributes<HTMLDivElement>) { return <div {...props} className={join('ds-card__content', props.className)} />; }
export function CardFooter(props: HTMLAttributes<HTMLDivElement>) { return <div {...props} className={join('ds-card__footer', props.className)} />; }

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: 'brand' | 'success' | 'warning' | 'neutral' }) {
  return <span className={join('ds-badge', `ds-badge--${tone}`, className)} {...props} />;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(function Input({ className, error, ...props }, ref) {
  return <input ref={ref} className={join('ds-input', className)} aria-invalid={error || undefined} {...props} />;
});
export function Textarea({ className, error, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={join('ds-textarea', className)} aria-invalid={error || undefined} {...props} />;
}
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={join('ds-select', className)} {...props} />;
}
export function Checkbox({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return <label className={join('ds-checkbox-row', className)}><input type="checkbox" className="ds-checkbox" {...props} /><span>{label}</span></label>;
}
export function Field({ label, hint, error, children }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode }) {
  return <label className="ds-field"><span className="ds-field__label">{label}</span>{children}{error ? <span className="ds-field__error">{error}</span> : hint ? <span className="ds-field__hint">{hint}</span> : null}</label>;
}

export function Heading({ as: Tag = 'h2', size = 'h2', className, ...props }: HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' | 'h4'; size?: 'display' | 'h1' | 'h2' | 'h3' }) {
  return <Tag className={join('ds-heading', `ds-heading--${size}`, className)} {...props} />;
}
export function Text({ tone = 'secondary', size = 'md', mono, className, ...props }: HTMLAttributes<HTMLParagraphElement> & { tone?: 'secondary' | 'muted'; size?: 'sm' | 'md' | 'lead'; mono?: boolean }) {
  return <p className={join('ds-text', tone === 'muted' && 'ds-text--muted', size === 'sm' && 'ds-text--small', size === 'lead' && 'ds-text--lead', mono && 'ds-text--mono', className)} {...props} />;
}

export function Container(props: HTMLAttributes<HTMLDivElement>) { return <div {...props} className={join('ds-container', props.className)} />; }
export function Section({ subtle, ...props }: HTMLAttributes<HTMLElement> & { subtle?: boolean }) { return <section {...props} className={join('ds-section', subtle && 'ds-section--subtle', props.className)} />; }
export function Stack({ gap = 4, ...props }: HTMLAttributes<HTMLDivElement> & { gap?: 2 | 3 | 4 | 5 | 6 | 8 }) { return <div {...props} className={join('ds-stack', `ds-stack--${gap}`, props.className)} />; }
export function Inline({ gap = 3, ...props }: HTMLAttributes<HTMLDivElement> & { gap?: 2 | 3 | 4 }) { return <div {...props} className={join('ds-inline', `ds-inline--${gap}`, props.className)} />; }
export function Grid({ columns = 3, ...props }: HTMLAttributes<HTMLDivElement> & { columns?: 2 | 3 | 4 }) { return <div {...props} className={join('ds-grid', `ds-grid--${columns}`, props.className)} />; }

export function Alert({ tone = 'info', icon, children }: { tone?: 'info' | 'danger' | 'success'; icon?: ReactNode; children: ReactNode }) {
  return <div className={join('ds-alert', `ds-alert--${tone}`)}>{icon}<div>{children}</div></div>;
}

export function SegmentedControl({ value, options, onChange, label }: { value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void; label: string }) {
  return <div className="ds-segmented" role="group" aria-label={label}>{options.map(option => <button key={option.value} type="button" className="ds-segmented__item" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}

export function Slider({ value, min, max, step = 1, onValueChange, label, valueText }: { value: number; min: number; max: number; step?: number; onValueChange: (value: number) => void; label: string; valueText?: string }) {
  return (
    <RadixSlider.Root
      className="ds-slider"
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={next => onValueChange(next[0] ?? min)}
      aria-label={label}
      aria-valuetext={valueText}
    >
      <RadixSlider.Track className="ds-slider__track">
        <RadixSlider.Range className="ds-slider__range" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="ds-slider__thumb" />
    </RadixSlider.Root>
  );
}

export function Accordion({ items, defaultValue, type = 'single' }: { items: Array<{ value: string; trigger: ReactNode; content: ReactNode }>; defaultValue?: string; type?: 'single' }) {
  return (
    <RadixAccordion.Root className="ds-accordion" type={type} collapsible defaultValue={defaultValue}>
      {items.map(item => (
        <RadixAccordion.Item className="ds-accordion__item" value={item.value} key={item.value}>
          <RadixAccordion.Header className="ds-accordion__header">
            <RadixAccordion.Trigger className="ds-accordion__trigger">
              <span>{item.trigger}</span>
              <span className="ds-accordion__mark" aria-hidden="true" />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="ds-accordion__content">
            <div className="ds-accordion__content-inner">{item.content}</div>
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}

export function Tabs({ value, defaultValue, onValueChange, items, children, label }: { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; items: Array<{ value: string; label: string }>; children: ReactNode; label: string }) {
  return <RadixTabs.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} className="ds-tabs"><RadixTabs.List className="ds-tabs__list" aria-label={label}>{items.map(item => <RadixTabs.Trigger key={item.value} value={item.value} className="ds-tabs__trigger">{item.label}</RadixTabs.Trigger>)}</RadixTabs.List>{children}</RadixTabs.Root>;
}

export function TabPanel({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  return <RadixTabs.Content value={value} className={join('ds-tabs__panel', className)}>{children}</RadixTabs.Content>;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <Card className="ds-empty"><Stack gap={4}>{icon ? <div className="ds-empty__icon">{icon}</div> : null}<Heading as="h2" size="h3">{title}</Heading><Text>{description}</Text>{action}</Stack></Card>;
}
export const ErrorState = EmptyState;

export function Modal({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="ds-modal__overlay" /><Dialog.Content className="ds-modal__content"><Dialog.Title asChild><Heading as="h2" size="h3">{title}</Heading></Dialog.Title>{description ? <Dialog.Description asChild><Text>{description}</Text></Dialog.Description> : null}<Dialog.Close asChild><IconButton label="Закрыть" className="ds-modal__close"><X size={18} /></IconButton></Dialog.Close>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
