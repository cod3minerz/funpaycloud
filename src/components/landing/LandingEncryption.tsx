'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

type Phase = 'idle' | 'moving' | 'clicking' | 'encrypting' | 'secured' | 'decrypting';

interface DataRow {
  label: string;
  plain: string;
  display: string;
  encrypted: boolean;
}

const SOURCE_ROWS = [
  { label: 'Ключ активации', plain: 'STEAM-XK9P2-M7NQR-4WB8V' },
  { label: 'Покупатель', plain: 'buyer_2847@funpay.ru' },
  { label: 'Транзакция', plain: 'TXN-88471-A9F2-CC03' },
];

const HEX = '0123456789ABCDEF';
const randChar = () => HEX[Math.floor(Math.random() * 16)];

function scramble(text: string): string {
  return text.split('').map(c => ('-.@_'.includes(c) ? c : randChar())).join('');
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

function initRows(): DataRow[] {
  return SOURCE_ROWS.map(r => ({ ...r, display: r.plain, encrypted: false }));
}

export default function LandingEncryption() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [keyX, setKeyX] = useState(0);
  const [locked, setLocked] = useState(false);
  const [rows, setRows] = useState<DataRow[]>(initRows);
  const [progWidth, setProgWidth] = useState(0);
  const cancelled = useRef(false);

  const runCycle = useCallback(async () => {
    if (cancelled.current) return;

    setPhase('idle');
    setKeyX(0);
    setLocked(false);
    setRows(initRows());
    setProgWidth(0);
    await sleep(1800);
    if (cancelled.current) return;

    // key moves right
    setPhase('moving');
    for (let i = 0; i <= 100; i++) {
      if (cancelled.current) return;
      setKeyX(i);
      setProgWidth(i * 0.55);
      await sleep(12);
    }

    // lock click
    setPhase('clicking');
    setLocked(true);
    setProgWidth(58);
    await sleep(350);
    if (cancelled.current) return;

    // encrypt rows
    setPhase('encrypting');
    for (let ri = 0; ri < SOURCE_ROWS.length; ri++) {
      if (cancelled.current) return;
      for (let s = 0; s < 18; s++) {
        if (cancelled.current) return;
        setRows(prev =>
          prev.map((row, idx) => (idx === ri ? { ...row, display: scramble(row.plain) } : row))
        );
        setProgWidth(58 + ((ri * 18 + s) / (SOURCE_ROWS.length * 18)) * 42);
        await sleep(28);
      }
      setRows(prev =>
        prev.map((row, idx) => (idx === ri ? { ...row, display: scramble(row.plain), encrypted: true } : row))
      );
    }
    setProgWidth(100);
    await sleep(200);
    if (cancelled.current) return;

    // secured — keep scrambling
    setPhase('secured');
    const secSteps = 30;
    for (let s = 0; s < secSteps; s++) {
      if (cancelled.current) return;
      setRows(prev => prev.map(row => ({ ...row, display: scramble(row.plain) })));
      await sleep(80);
    }

    // decrypt — key retracts, text restores
    setPhase('decrypting');
    setLocked(false);
    for (let i = 100; i >= 0; i--) {
      if (cancelled.current) return;
      setKeyX(i);
      setProgWidth(i * 0.55);
      const progress = i / 100;
      setRows(
        SOURCE_ROWS.map((r, ri) => {
          const threshold = (SOURCE_ROWS.length - 1 - ri) / SOURCE_ROWS.length;
          const encrypted = progress > threshold;
          return {
            ...r,
            display: encrypted ? scramble(r.plain) : r.plain,
            encrypted,
          };
        })
      );
      await sleep(10);
    }
    setRows(initRows());
    setProgWidth(0);
    await sleep(600);
    if (cancelled.current) return;
    runCycle();
  }, []);

  useEffect(() => {
    cancelled.current = false;
    runCycle();
    return () => { cancelled.current = true; };
  }, [runCycle]);

  const secured = phase === 'secured';
  const encrypting = phase === 'encrypting' || phase === 'clicking';

  const statusLabel =
    phase === 'idle' ? 'Ожидание...' :
    phase === 'moving' ? 'Применяю ключ...' :
    phase === 'clicking' ? 'Активирую шифрование...' :
    phase === 'encrypting' ? 'Шифрование данных...' :
    phase === 'secured' ? 'Данные защищены' :
    'Расшифровка...';

  return (
    <section className="landing-encrypt-sec">
      <div className="wrap">
        <div className="landing-encrypt-grid">

          <div className="landing-encrypt-content">
            <div className="landing-encrypt-eyebrow">Безопасность</div>
            <h2 className="landing-encrypt-title">Ваши данные под надёжной защитой</h2>
            <p className="landing-encrypt-desc">
              Вы добавляете ключи активации — мы шифруем их симметричным алгоритмом и сохраняем в базе данных в зашифрованном виде. Ключ расшифровки надёжно хранится на нашем защищённом сервере, отдельно от данных.
            </p>
            <ul className="landing-encrypt-list">
              {[
                'Симметричное шифрование AES-256',
                'Зашифрованное хранение в базе данных',
                'Ключ расшифровки изолирован от данных',
                'Отдельное хранилище для каждого аккаунта',
              ].map(item => (
                <li key={item}>
                  <span className="landing-encrypt-tick">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-encrypt-visual">
            <div className={`landing-encrypt-card${secured ? ' is-secured' : ''}${encrypting ? ' is-encrypting' : ''}`}>

              <div className="landing-encrypt-card-header">
                <div className="landing-encrypt-dots">
                  <span /><span /><span />
                </div>
                <span className="landing-encrypt-card-label">Защищённое хранилище</span>
                <div className={`landing-encrypt-status-badge${secured ? ' ok' : ''}`}>
                  {secured ? '✓ AES-256' : 'Незашифровано'}
                </div>
              </div>

              <div className="landing-encrypt-rows">
                {rows.map((row, i) => (
                  <div key={i} className={`landing-encrypt-row${row.encrypted ? ' enc' : ''}`}>
                    <span className="landing-encrypt-row-label">{row.label}</span>
                    <code className="landing-encrypt-row-value">{row.display}</code>
                  </div>
                ))}
              </div>

              <div className="landing-encrypt-track-wrap">
                <div className="landing-encrypt-track-line" />

                <div
                  className="landing-encrypt-key"
                  style={{ left: `calc(12px + ${keyX / 100} * (100% - 88px))` }}
                >
                  <svg width="30" height="15" viewBox="0 0 30 15" fill="none">
                    <circle cx="7" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="7" cy="7.5" r="2.2" fill="currentColor" />
                    <line x1="13" y1="7.5" x2="29" y2="7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="21" y1="7.5" x2="21" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="24.5" y1="7.5" x2="24.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="28" y1="7.5" x2="28" y2="10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>

                <div className={`landing-encrypt-lock${locked ? ' locked' : ''}`}>
                  {locked ? (
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
                      <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 11V7a5 5 0 0110 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="landing-encrypt-progress-wrap">
                <span className="landing-encrypt-progress-label">{statusLabel}</span>
                <div className="landing-encrypt-progress-track">
                  <div
                    className={`landing-encrypt-progress-fill${secured ? ' full' : ''}`}
                    style={{ width: `${progWidth}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
