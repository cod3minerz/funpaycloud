"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import { TagIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { promoApi, PromoRedemptionItem } from "@/lib/api";

type ActivatedCode = {
  code: string;
  reward: string;
  activatedAt: string;
};

type Status = "idle" | "success" | "error";

function rewardLabel(item: PromoRedemptionItem): string {
  if (item.reward_type === "ai_messages") return `+${item.reward_ai_messages} AI сообщений`;
  if (item.reward_type === "plan" && item.reward_plan) return `Тариф ${item.reward_plan} на ${item.duration_days} дн.`;
  return item.reward_type;
}

export default function PromocodesPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<ActivatedCode[]>([]);
  const [aiUsed, setAiUsed] = useState(0);
  const [aiTotal, setAiTotal] = useState(1);

  useEffect(() => {
    promoApi.my().then((data) => {
      setCodes(
        data.items.map((item) => ({
          code: item.code,
          reward: rewardLabel(item),
          activatedAt: new Date(item.redeemed_at).toLocaleString("ru-RU"),
        }))
      );
      setAiUsed(data.ai.used);
      setAiTotal(data.ai.limit || 1);
    }).catch(() => {});
  }, []);

  const AI_PCT = Math.round((aiUsed / aiTotal) * 100);

  async function handleApply() {
    if (!code.trim()) return;
    setLoading(true);
    try {
      await promoApi.redeem(code.trim());
      setStatus("success");
      setStatusMsg("Промокод успешно применён!");
      // Refresh list
      const data = await promoApi.my();
      setCodes(
        data.items.map((item) => ({
          code: item.code,
          reward: rewardLabel(item),
          activatedAt: new Date(item.redeemed_at).toLocaleString("ru-RU"),
        }))
      );
      setAiUsed(data.ai.used);
      setAiTotal(data.ai.limit || 1);
    } catch (e: unknown) {
      setStatus("error");
      setStatusMsg(e instanceof Error ? e.message : "Промокод недействителен или уже использован.");
    } finally {
      setLoading(false);
    }
  }

  function handleInput(v: string) {
    setCode(v.toUpperCase());
    if (status !== "idle") setStatus("idle");
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Промокоды</h1>

      {/* Apply code */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10">
              <TagIcon className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Применить промокод</p>
              <p className="text-xs text-gray-400">
                Активируйте код на тариф или дополнительные AI-сообщения.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={code}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="Введите промокод"
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-mono tracking-wider text-gray-800 outline-none transition focus:ring-2 dark:bg-gray-900 dark:text-white ${
                  status === "error"
                    ? "border-error-400 focus:border-error-400 focus:ring-error-500/10"
                    : status === "success"
                    ? "border-success-400 focus:border-success-400 focus:ring-success-500/10"
                    : "border-gray-200 focus:border-brand-400 focus:ring-brand-500/10 dark:border-gray-700"
                }`}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleApply}
              disabled={!code.trim() || loading}
              className="whitespace-nowrap"
            >
              {loading ? "…" : "Применить"}
            </Button>
          </div>

          {status !== "idle" && (
            <div
              className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                status === "success"
                  ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                  : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
              }`}
            >
              {status === "success" ? (
                <CheckCircleIcon className="h-4 w-4 shrink-0" />
              ) : (
                <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
              )}
              {statusMsg}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI message limit */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              Лимит AI сообщений
            </p>
            <span className="text-sm font-medium text-gray-500">
              {aiUsed} / {aiTotal}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${AI_PCT}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>Осталось: {aiTotal - aiUsed} сообщений</span>
            <span>{AI_PCT}% использовано</span>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <p className="font-semibold text-gray-800 dark:text-white">Активированные промокоды</p>
          </div>
          {codes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <TagIcon className="h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm text-gray-400">Нет активированных промокодов</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30">
                  {["Код", "Награда", "Дата активации"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr
                    key={c.code}
                    className="border-b border-gray-50 last:border-0 dark:border-gray-800"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-800 dark:text-white">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {c.reward}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {c.activatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
