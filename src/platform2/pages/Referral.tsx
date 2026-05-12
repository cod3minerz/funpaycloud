"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import Icon from "@/platform2/icons";
import { settingsApi } from "@/lib/api";

export default function ReferralPage() {
  const [code, setCode] = useState("");
  const [earned, setEarned] = useState(0);
  const [referrals, setReferrals] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    settingsApi.getReferral()
      .then((d) => {
        setCode(d.referral_code);
        setEarned(d.total_earned);
        setReferrals(Array.isArray(d.referrals) ? d.referrals : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copyCode() {
    const url = `https://funpay.cloud/?ref=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Реферальная система</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Реферальный код</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white font-mono">{code || "—"}</p>
                  </div>
                  <button
                    onClick={copyCode}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 hover:bg-brand-500/20 transition-colors"
                  >
                    <Icon name={copied ? "check-line" : "copy"} className="h-5 w-5 text-brand-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Заработано</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {earned.toLocaleString("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-500/10">
                    <Icon name="dollar-line" className="h-6 w-6 text-success-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral link */}
          {code && (
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ваша реферальная ссылка</p>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3">
                  <p className="flex-1 text-sm font-mono text-gray-600 dark:text-gray-300 truncate">
                    https://funpay.cloud/?ref={code}
                  </p>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600"
                  >
                    <Icon name={copied ? "check-line" : "copy"} className="h-4 w-4" />
                    {copied ? "Скопировано" : "Копировать"}
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referrals table */}
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-base">Рефералы ({referrals.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {referrals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Icon name="user-plus" className="h-12 w-12 text-gray-200" />
                  <p className="mt-3 text-sm text-gray-400">Рефералов пока нет</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {referrals.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3.5">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {String(r.email ?? r.username ?? `Реферал #${i + 1}`)}
                      </p>
                      <span className="text-sm font-semibold text-success-600">
                        {r.bonus ? `+${r.bonus}₽` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
