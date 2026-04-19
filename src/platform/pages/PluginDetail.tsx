'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, RefreshCw, Save, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiConfigField,
  ApiPluginLog,
  ApiPluginSchema,
  ApiStatField,
  accountsApi,
  ApiAccount,
  pluginsApi,
} from '@/lib/api';
import { PageHeader, PageShell, PageTitle, SectionCard } from '@/platform/components/primitives';

// ── Icon resolver ─────────────────────────────────────────────────────────────

function PluginStatIcon({ name, size = 22 }: { name: string; size?: number }) {
  // Render a simple SVG fallback — avoids dynamic lucide import type issues
  void name;
  return <Zap size={size} />;
}

// ── RulesBuilder ──────────────────────────────────────────────────────────────

type Rule = { keyword: string; reply: string };

function RulesBuilder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [rules, setRules] = useState<Rule[]>(() => {
    try { return JSON.parse(value || '[]'); } catch { return []; }
  });

  const sync = (next: Rule[]) => {
    setRules(next);
    onChange(JSON.stringify(next));
  };

  const update = (i: number, field: keyof Rule, val: string) => {
    const next = rules.map((r, idx) => (idx === i ? { ...r, [field]: val } : r));
    sync(next);
  };

  const add = () => sync([...rules, { keyword: '', reply: '' }]);
  const remove = (i: number) => sync(rules.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-2">
      {rules.map((r, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            className="platform-input flex-1 min-w-0"
            placeholder="Если содержит..."
            value={r.keyword}
            onChange={e => update(i, 'keyword', e.target.value)}
          />
          <input
            className="platform-input flex-1 min-w-0"
            placeholder="Ответить..."
            value={r.reply}
            onChange={e => update(i, 'reply', e.target.value)}
          />
          <button type="button" className="platform-btn-secondary px-2" onClick={() => remove(i)} aria-label="Удалить правило">✕</button>
        </div>
      ))}
      <button type="button" className="platform-btn-secondary self-start" onClick={add}>+ Добавить правило</button>
    </div>
  );
}

// ── TagsInput ─────────────────────────────────────────────────────────────────

function TagsInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tags, setTags] = useState<string[]>(() => {
    try { return JSON.parse(value || '[]'); } catch { return value ? value.split(',').map(s => s.trim()).filter(Boolean) : []; }
  });
  const [input, setInput] = useState('');

  const sync = (next: string[]) => { setTags(next); onChange(JSON.stringify(next)); };

  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) sync([...tags, v]);
    setInput('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--pf-surface-3)] border border-[var(--pf-border)]">
            {tag}
            <button type="button" onClick={() => sync(tags.filter(t => t !== tag))} className="text-[var(--pf-text-muted)] hover:text-[var(--pf-text)]">✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="platform-input flex-1"
          placeholder="Добавить тег..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" className="platform-btn-secondary" onClick={add}>Добавить</button>
      </div>
    </div>
  );
}

// ── ConfigField renderer ──────────────────────────────────────────────────────

function ConfigFieldInput({
  field,
  value,
  onChange,
}: {
  field: ApiConfigField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === 'bool') {
    const checked = value === 'true' || value === '1' || value === 'yes';
    return (
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(checked ? 'false' : 'true')}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors ${
            checked ? 'bg-[var(--pf-accent)] border-[var(--pf-accent)]' : 'bg-[var(--pf-surface-3)] border-[var(--pf-border)]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </button>
        <span className="text-sm text-[var(--pf-text)]">{checked ? 'Включено' : 'Выключено'}</span>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        className="platform-input w-full resize-y min-h-[80px]"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.default}
        rows={3}
      />
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <select className="platform-select w-full" value={value} onChange={e => onChange(e.target.value)}>
        {field.options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'time_range') {
    const [from, to] = (value || '-').split('-');
    return (
      <div className="flex items-center gap-2">
        <input type="time" className="platform-input" value={from || ''} onChange={e => onChange(`${e.target.value}-${to || ''}`)} />
        <span className="text-[var(--pf-text-muted)]">—</span>
        <input type="time" className="platform-input" value={to || ''} onChange={e => onChange(`${from || ''}-${e.target.value}`)} />
      </div>
    );
  }

  if (field.type === 'tags') {
    return <TagsInput value={value} onChange={onChange} />;
  }

  if (field.type === 'rules_builder') {
    return <RulesBuilder value={value} onChange={onChange} />;
  }

  return (
    <input
      type="text"
      className="platform-input w-full"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.default}
    />
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'settings' | 'activity' | 'stats';

// ── Main component ────────────────────────────────────────────────────────────

export default function PluginDetail() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [accountID, setAccountID] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('settings');
  const [schema, setSchema] = useState<ApiPluginSchema | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<ApiPluginLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [statDays, setStatDays] = useState(7);
  const [statsLoading, setStatsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadedAccountRef = useRef<number | null>(null);

  // Load accounts on mount
  useEffect(() => {
    accountsApi.list().then(rows => {
      const safe = Array.isArray(rows) ? rows : [];
      setAccounts(safe);
      if (safe.length > 0) setAccountID(safe[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Load schema + config when account changes
  useEffect(() => {
    if (!accountID || !slug) return;
    if (loadedAccountRef.current === accountID) return;
    loadedAccountRef.current = accountID;
    setLoading(true);
    Promise.all([
      pluginsApi.schema(slug, accountID),
      pluginsApi.getConfig(slug, accountID),
    ])
      .then(([s, c]) => {
        setSchema(s);
        const defaults: Record<string, string> = {};
        s.config_schema.forEach(f => { defaults[f.key] = f.default ?? ''; });
        setConfig({ ...defaults, ...c });
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [accountID, slug]);

  const loadLogs = useCallback(() => {
    if (!accountID) return;
    setLogsLoading(true);
    pluginsApi.logs(slug, accountID, 50)
      .then(setLogs)
      .catch(err => toast.error(err instanceof Error ? err.message : 'Ошибка загрузки логов'))
      .finally(() => setLogsLoading(false));
  }, [accountID, slug]);

  const loadStats = useCallback(() => {
    if (!accountID) return;
    setStatsLoading(true);
    pluginsApi.stats(slug, accountID, statDays)
      .then(setStats)
      .catch(err => toast.error(err instanceof Error ? err.message : 'Ошибка загрузки статистики'))
      .finally(() => setStatsLoading(false));
  }, [accountID, slug, statDays]);

  useEffect(() => { if (tab === 'activity') loadLogs(); }, [tab, loadLogs]);
  useEffect(() => { if (tab === 'stats') loadStats(); }, [tab, loadStats, statDays]);

  async function saveConfig() {
    if (!accountID) return;
    setSaving(true);
    try {
      await pluginsApi.saveConfig(slug, accountID, config);
      toast.success('Настройки сохранены');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'settings', label: 'Настройки' },
    { id: 'activity', label: 'Активность' },
    { id: 'stats', label: 'Статистика' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <button
            type="button"
            onClick={() => router.push('/platform/plugins')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--pf-text-muted)] hover:text-[var(--pf-text)] mb-2"
          >
            <ArrowLeft size={14} /> Плагины
          </button>
          <PageTitle title={slug.replace(/_/g, ' ')} subtitle={`Управление плагином · ${slug}`} />
        </PageHeader>

        {/* Account selector */}
        <SectionCard>
          <select
            className="platform-select"
            value={accountID ?? ''}
            onChange={e => { loadedAccountRef.current = null; setAccountID(Number(e.target.value)); }}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.username || `ID ${a.id}`}</option>
            ))}
          </select>
        </SectionCard>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--pf-border)] mb-4">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? 'border-[var(--pf-accent)] text-[var(--pf-accent)]'
                  : 'border-transparent text-[var(--pf-text-muted)] hover:text-[var(--pf-text)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
          </div>
        ) : (
          <>
            {/* ── Settings Tab ── */}
            {tab === 'settings' && schema && (
              <SectionCard>
                <div className="flex flex-col gap-5">
                  {schema.config_schema.map(field => (
                    <div key={field.key} className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[var(--pf-text)]">
                        {field.label}
                        {field.required && <span className="text-[var(--pf-bad)] ml-1">*</span>}
                      </label>
                      <ConfigFieldInput
                        field={field}
                        value={config[field.key] ?? field.default ?? ''}
                        onChange={v => setConfig(prev => ({ ...prev, [field.key]: v }))}
                      />
                    </div>
                  ))}
                  {schema.config_schema.length === 0 && (
                    <p className="text-sm text-[var(--pf-text-muted)]">Нет настраиваемых параметров.</p>
                  )}
                  <div className="flex justify-end pt-2 border-t border-[var(--pf-border)]">
                    <button type="button" className="platform-btn-primary flex items-center gap-2" onClick={saveConfig} disabled={saving}>
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Сохранить настройки
                    </button>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* ── Activity Tab ── */}
            {tab === 'activity' && (
              <SectionCard>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[var(--pf-text)]">Последние события</span>
                  <button type="button" className="platform-btn-secondary flex items-center gap-1.5" onClick={loadLogs} disabled={logsLoading}>
                    <RefreshCw size={13} className={logsLoading ? 'animate-spin' : ''} />
                    Обновить
                  </button>
                </div>
                {logsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[var(--pf-accent)]" /></div>
                ) : logs.length === 0 ? (
                  <p className="text-sm text-[var(--pf-text-muted)] py-6 text-center">Логов пока нет.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 font-mono text-[13px]">
                    {logs.map(log => (
                      <div
                        key={log.id}
                        className={`flex gap-3 py-1.5 px-2 rounded-lg ${
                          log.level === 'error' ? 'bg-[rgba(178,58,58,0.06)] text-[var(--pf-bad)]' : 'text-[var(--pf-text-muted)]'
                        }`}
                      >
                        <span className="shrink-0 text-[11px] opacity-60 mt-0.5">
                          {new Date(log.created_at).toLocaleTimeString('ru-RU')}
                        </span>
                        <span className={`shrink-0 font-semibold ${log.level === 'error' ? 'text-[var(--pf-bad)]' : 'text-[var(--pf-accent)]'}`}>
                          {log.level === 'error' ? '✕' : '✓'}
                        </span>
                        <span className="text-[var(--pf-text)]">{log.event}</span>
                        {Object.keys(log.payload).length > 0 && (
                          <span className="opacity-60 truncate">{JSON.stringify(log.payload)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── Stats Tab ── */}
            {tab === 'stats' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  {[1, 7, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setStatDays(d)}
                      className={`platform-btn-secondary text-sm px-3 ${statDays === d ? 'bg-[var(--pf-accent)] text-white border-[var(--pf-accent)]' : ''}`}
                    >
                      {d} {d === 1 ? 'день' : d === 7 ? 'дней' : 'дней'}
                    </button>
                  ))}
                </div>
                {statsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[var(--pf-accent)]" /></div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(schema?.stats_schema ?? []).map((stat: ApiStatField) => (
                      <SectionCard key={stat.key}>
                        <div className="flex flex-col items-center gap-2 py-2 text-center">
                          <span className="text-[var(--pf-accent)]">
                            <PluginStatIcon name={stat.icon} />
                          </span>
                          <span className="text-3xl font-black text-[var(--pf-text)]">
                            {stats[stat.key] ?? 0}
                          </span>
                          <span className="text-xs text-[var(--pf-text-muted)]">{stat.label}</span>
                        </div>
                      </SectionCard>
                    ))}
                    {(schema?.stats_schema ?? []).length === 0 && (
                      <p className="col-span-3 text-sm text-[var(--pf-text-muted)] text-center py-8">Нет счётчиков статистики.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </PageShell>
    </motion.div>
  );
}
