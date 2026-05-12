"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import { promoApi, PromoRedemptionItem } from "@/lib/api";

export default function PromoCodesPage() {
  const [items, setItems] = useState<PromoRedemptionItem[]>([]);
  const [aiUsed, setAiUsed] = useState(0);
  const [aiLimit, setAiLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    promoApi.my()
      .then((d) => {
        setItems(Array.isArray(d.items) ? d.items : []);
        setAiUsed(d.ai?.used ?? 0);
        setAiLimit(d.ai?.limit ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setRedeeming(true);
    setMessage(null);
    try {
      const res = await promoApi.redeem(code.trim());
      setMessage({ text: `Промокод активирован! Тип: ${res.result.reward_type}`, ok: true });
      setCode("");
      // Refresh list
      promoApi.my().then((d) => {
        setItems(Array.isArray(d.items) ? d.items : []);
        setAiUsed(d.ai?.used ?? 0);
        setAiLimit(d.ai?.limit ?? 0);
      }).catch(() => {});
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Ошибка активации", ok: false });
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Промокоды</h1>

      {/* Redeem form */}
      <Card>
        <CardContent className="p-6">
          <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">Активировать промокод</p>
          <form onSubmit={handleRedeem} className="flex gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Введите промокод"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <Button variant="primary" type="submit" disabled={redeeming || !code.trim()}>
              {redeeming ? "..." : "Активировать"}
            </Button>
          </form>
          {message && (
            <p className={`mt-3 text-sm ${message.ok ? "text-success-600" : "text-error-500"}`}>
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI Messages usage */}
      {aiLimit > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">AI сообщения</p>
              <span className="text-sm text-gray-500">{aiUsed} / {aiLimit}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${Math.min(100, (aiUsed / aiLimit) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-base">История активаций</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Icon name="shooting-star" className="h-12 w-12 text-gray-200" />
              <p className="mt-3 text-sm text-gray-400">Промокодов ещё не было</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-semibold font-mono text-gray-800 dark:text-white">{item.code}</p>
                    <p className="text-xs text-gray-400">{new Date(item.redeemed_at).toLocaleDateString("ru-RU")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-brand-500">
                      {item.reward_type === "plan" ? `${item.reward_plan} × ${item.duration_days}д` : `+${item.reward_ai_messages} AI`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
