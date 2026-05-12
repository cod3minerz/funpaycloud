"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import { settingsApi, ProfileData, NotificationSettings } from "@/lib/api";
import { logout } from "@/lib/auth";

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [notifMsg, setNotifMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [login, setLogin] = useState("");
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    Promise.all([settingsApi.getProfile(), settingsApi.getNotifications()])
      .then(([prof, notif]) => {
        setProfile(prof);
        setLogin(prof.login ?? "");
        setTimezone(prof.timezone ?? "Europe/Moscow");
        setNotifications(notif);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await settingsApi.updateProfile({ login, timezone });
      setProfileMsg({ text: "Профиль обновлён", ok: true });
    } catch (err) {
      setProfileMsg({ text: err instanceof Error ? err.message : "Ошибка", ok: false });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPwd || !newPwd) return;
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      await settingsApi.updatePassword({ old_password: oldPwd, new_password: newPwd });
      setPwdMsg({ text: "Пароль изменён", ok: true });
      setOldPwd("");
      setNewPwd("");
    } catch (err) {
      setPwdMsg({ text: err instanceof Error ? err.message : "Ошибка", ok: false });
    } finally {
      setSavingPwd(false);
    }
  }

  async function saveNotifications() {
    if (!notifications) return;
    setSavingNotif(true);
    setNotifMsg(null);
    try {
      await settingsApi.updateNotifications(notifications);
      setNotifMsg({ text: "Настройки уведомлений сохранены", ok: true });
    } catch (err) {
      setNotifMsg({ text: err instanceof Error ? err.message : "Ошибка", ok: false });
    } finally {
      setSavingNotif(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки</h1>

      {/* Profile */}
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-base">Профиль</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input value={profile?.email ?? ""} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Логин</label>
              <input value={login} onChange={(e) => setLogin(e.target.value)} className={inputCls} placeholder="Логин" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Часовой пояс</label>
              <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls} placeholder="Europe/Moscow" />
            </div>
            {profileMsg && <p className={`text-sm ${profileMsg.ok ? "text-success-600" : "text-error-500"}`}>{profileMsg.text}</p>}
            <Button variant="primary" type="submit" disabled={savingProfile}>
              {savingProfile ? "Сохранение..." : "Сохранить профиль"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-base">Смена пароля</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Текущий пароль</label>
              <input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Новый пароль</label>
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={inputCls} />
            </div>
            {pwdMsg && <p className={`text-sm ${pwdMsg.ok ? "text-success-600" : "text-error-500"}`}>{pwdMsg.text}</p>}
            <Button variant="primary" type="submit" disabled={savingPwd || !oldPwd || !newPwd}>
              {savingPwd ? "Сохранение..." : "Изменить пароль"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      {notifications && (
        <Card>
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-base">Telegram-уведомления</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-3">
              {(
                [
                  { key: "enabled", label: "Уведомления включены" },
                  { key: "new_order", label: "Новый заказ" },
                  { key: "new_message", label: "Новое сообщение" },
                  { key: "login", label: "Вход в аккаунт" },
                  { key: "weekly_report", label: "Недельный отчёт" },
                  { key: "subscription", label: "Подписка" },
                ] as { key: keyof NotificationSettings; label: string }[]
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <button
                    onClick={() => setNotifications((prev) => prev ? { ...prev, [key]: !prev[key] } : prev)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      notifications[key] ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notifications[key] ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
            {notifMsg && <p className={`mt-4 text-sm ${notifMsg.ok ? "text-success-600" : "text-error-500"}`}>{notifMsg.text}</p>}
            <Button variant="primary" className="mt-4" onClick={saveNotifications} disabled={savingNotif}>
              {savingNotif ? "Сохранение..." : "Сохранить уведомления"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sign out */}
      <Card>
        <CardContent className="p-5">
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-sm font-medium text-error-500 hover:text-error-600"
          >
            <Icon name="close" className="h-4 w-4" />
            Выйти из аккаунта
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
