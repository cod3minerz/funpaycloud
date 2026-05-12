"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/platform2/components/ui/card";
import Icon from "@/platform2/icons";
import { settingsApi } from "@/lib/api";

type Referral = {
  email: string;
  date: string;
  status: "active" | "inactive";
  earned: number | null;
};

const steps = [
  {
    num: "1",
    title: "Поделитесь ссылкой",
    desc: "Отправьте вашу реферальную ссылку друзьям или опубликуйте в соцсетях.",
  },
  {
    num: "2",
    title: "Друг регистрируется",
    desc: "Новый пользователь переходит по ссылке и регистрируется на платформе.",
  },
  {
    num: "3",
    title: "Получаете 20%",
    desc: "Вы получаете 20% с каждой оплаченной подписки вашего реферала.",
  },
];

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const [refLink, setRefLink] = useState("https://funpay.cloud/r/...");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    settingsApi.getReferral().then((data) => {
      setRefLink(`https://funpay.cloud/r/${data.referral_code}`);
      setTotalEarned(data.total_earned);
      setReferrals(
        data.referrals.map((r) => ({
          email: (r.email as string) || (r.username as string) || "—",
          date: (r.created_at as string) || new Date().toISOString(),
          status: (r.status as "active" | "inactive") || "inactive",
          earned: r.earned != null ? Number(r.earned) : null,
        }))
      );
    }).catch(() => {});
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Реферальная программа</h1>

      {/* Ref link */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="share" className="h-4 w-4 text-brand-500" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ваша реферальная ссылка</p>
          </div>
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {refLink}
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyLink}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Icon name={copied ? "check-line" : "copy"} className="h-4 w-4" />
              {copied ? "Скопировано!" : "Копировать ссылку"}
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <Icon name="share" className="h-4 w-4" />
              Поделиться
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="border-l-2 border-brand-500 pl-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Приглашено</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10">
                  <Icon name="group" className="h-4 w-4 text-brand-500" />
                </div>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                {referrals.length}
              </h3>
              <p className="mt-0.5 text-xs text-gray-400">пользователей</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="border-l-2 border-success-500 pl-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Заработано</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-500/10">
                  <Icon name="dollar-line" className="h-4 w-4 text-success-600" />
                </div>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{totalEarned} ₽</h3>
              <p className="mt-0.5 text-xs text-gray-400">за всё время</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="border-l-2 border-warning-500 pl-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Ваша комиссия</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-500/10">
                  <Icon name="bolt" className="h-4 w-4 text-warning-500" />
                </div>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">20%</h3>
              <p className="mt-0.5 text-xs text-gray-400">с каждой подписки</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals table */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-white">Рефералы</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["Пользователь", "Дата", "Статус", "Заработок"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 dark:border-gray-800">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-500">
                          {r.email[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{r.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(r.date).toLocaleDateString("ru-RU", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.status === "active"
                          ? "bg-success-500/10 text-success-600"
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${r.status === "active" ? "bg-success-500" : "bg-gray-300"}`} />
                        {r.status === "active" ? "Активен" : "Неактивен"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-400">{r.earned !== null ? `${r.earned} ₽` : "—"}</span>
                    </td>
                  </tr>
                ))}
                {referrals.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-sm text-gray-400">
                      Рефералов пока нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <div>
        <h2 className="mb-4 font-semibold text-gray-800 dark:text-white">Как это работает</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.num}>
              <CardContent className="p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">
                  {step.num}
                </div>
                <p className="font-semibold text-gray-800 dark:text-white">{step.title}</p>
                <p className="mt-1 text-sm text-gray-500">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
