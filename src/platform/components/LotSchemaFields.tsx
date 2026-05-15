'use client';

import React from 'react';
import { ApiLotEditableField } from '@/lib/api';

export type SchemaFieldValue = string | boolean | string[] | undefined;
export type SchemaFieldValues = Record<string, SchemaFieldValue>;

export function normalizeSchemaFieldValue(raw: unknown, type: string, optionCount: number): string | boolean | string[] {
  if (type === 'checkbox' && optionCount <= 1) {
    return Boolean(raw);
  }
  if (type === 'checkbox') {
    return Array.isArray(raw)
      ? raw.map(item => String(item))
      : typeof raw === 'string' && raw
        ? [raw]
        : [];
  }
  if (Array.isArray(raw)) {
    return raw[0] != null ? String(raw[0]) : '';
  }
  if (raw == null) return '';
  return String(raw);
}

export function getInitialCreateFieldValue(field: ApiLotEditableField): string | boolean | string[] {
  const options = Array.isArray(field.options) ? field.options : [];

  if (field.type === 'checkbox' && options.length > 1) {
    return [];
  }
  if (field.type === 'checkbox') {
    return field.name === 'active';
  }
  if ((field.type === 'select' || field.type === 'radio') && field.required && options.length > 0) {
    return options[0].value;
  }
  return '';
}

function isTextareaField(type: string) {
  return type === 'textarea';
}

function isSelectField(type: string) {
  return type === 'select';
}

function isRadioField(type: string) {
  return type === 'radio';
}

function isCheckboxField(type: string) {
  return type === 'checkbox';
}

type LotSchemaFieldsProps = {
  fields: ApiLotEditableField[];
  values: SchemaFieldValues;
  onChange: (name: string, value: SchemaFieldValue) => void;
  disabled?: boolean;
};

export function LotSchemaFields({ fields, values, onChange, disabled = false }: LotSchemaFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(field => {
        const currentValue = values[field.name];
        const options = Array.isArray(field.options) ? field.options : [];
        const wide = isTextareaField(field.type) || (isCheckboxField(field.type) && options.length > 1);

        return (
          <div
            key={field.name}
            className={wide ? 'space-y-2 sm:col-span-2' : 'space-y-2'}
          >
            <label className="block text-sm font-medium text-[var(--pf-text)]">
              {field.label || field.name}
              {field.required ? <span className="ml-1 text-[var(--pf-danger)]">*</span> : null}
            </label>

            {isTextareaField(field.type) ? (
              <textarea
                className="platform-input min-h-[140px] w-full"
                placeholder={field.placeholder || ''}
                value={typeof currentValue === 'string' ? currentValue : ''}
                onChange={event => onChange(field.name, event.target.value)}
                disabled={disabled}
              />
            ) : isSelectField(field.type) ? (
              <select
                className="platform-select w-full"
                value={typeof currentValue === 'string' ? currentValue : ''}
                onChange={event => onChange(field.name, event.target.value)}
                disabled={disabled}
              >
                {!field.required ? <option value="">{field.placeholder || 'Не выбрано'}</option> : null}
                {options.map(option => (
                  <option key={`${field.name}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : isRadioField(field.type) ? (
              <div className="space-y-2 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
                {options.map(option => (
                  <label key={`${field.name}-${option.value}`} className="flex items-center gap-3 text-sm text-[var(--pf-text)]">
                    <input
                      type="radio"
                      name={field.name}
                      value={option.value}
                      checked={currentValue === option.value}
                      onChange={event => onChange(field.name, event.target.value)}
                      disabled={disabled}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ) : isCheckboxField(field.type) && options.length > 1 ? (
              <div className="space-y-2 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
                {options.map(option => {
                  const selected = Array.isArray(currentValue) ? currentValue : [];
                  return (
                    <label key={`${field.name}-${option.value}`} className="flex items-center gap-3 text-sm text-[var(--pf-text)]">
                      <input
                        type="checkbox"
                        checked={selected.includes(option.value)}
                        onChange={event => {
                          const current = Array.isArray(currentValue) ? [...currentValue] : [];
                          const next = event.target.checked
                            ? Array.from(new Set([...current, option.value]))
                            : current.filter(item => item !== option.value);
                          onChange(field.name, next);
                        }}
                        disabled={disabled}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            ) : isCheckboxField(field.type) ? (
              <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] px-4 text-sm text-[var(--pf-text)]">
                <input
                  type="checkbox"
                  checked={Boolean(currentValue)}
                  onChange={event => onChange(field.name, event.target.checked)}
                  disabled={disabled}
                />
                <span>{options[0]?.label || field.label || field.name}</span>
              </label>
            ) : (
              <input
                className="platform-input w-full"
                type={field.type === 'number' ? 'number' : 'text'}
                placeholder={field.placeholder || ''}
                value={typeof currentValue === 'string' ? currentValue : ''}
                onChange={event => onChange(field.name, event.target.value)}
                disabled={disabled}
              />
            )}

            {field.placeholder && !isTextareaField(field.type) && !isSelectField(field.type) && !isCheckboxField(field.type) && !isRadioField(field.type) ? (
              <div className="text-xs text-[var(--pf-text-dim)]">{field.placeholder}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
