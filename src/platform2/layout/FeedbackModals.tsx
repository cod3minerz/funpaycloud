"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/platform2/components/ui/modal";
import Alert from "@/platform2/components/ui/alert/Alert";
import { feedbackApi } from "@/lib/api";

type ModalProps = { isOpen: boolean; onClose: () => void };

function useFeedbackForm(type: "bug" | "idea", onClose: () => void) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [telegram, setTelegram] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!onClose) return;
    if (!success) {
      setTitle("");
      setDescription("");
      setTelegram("");
      setError(null);
      setLoading(false);
      setSuccess(false);
    }
  }, [onClose]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setTelegram("");
    setError(null);
    setLoading(false);
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await feedbackApi.submit({ type, title: title.trim(), description: description.trim(), telegram: telegram.trim() || undefined });
      setSuccess(true);
      setTimeout(() => {
        reset();
        onClose();
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при отправке");
    } finally {
      setLoading(false);
    }
  };

  return { title, setTitle, description, setDescription, telegram, setTelegram, loading, error, success, handleClose, handleSubmit };
}

export function BugReportModal({ isOpen, onClose }: ModalProps) {
  const { title, setTitle, description, setDescription, telegram, setTelegram, loading, error, success, handleClose, handleSubmit } =
    useFeedbackForm("bug", onClose);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg w-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Сообщить об ошибке</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Опишите проблему, и мы постараемся её исправить как можно скорее.
        </p>

        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/10">
              <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Отправлено, спасибо!</p>
            <p className="mt-1 text-xs text-gray-500">Мы рассмотрим ваш отчёт в ближайшее время.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="error" title="Ошибка" message={error} />}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Заголовок <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Кратко опишите проблему"
                maxLength={255}
                required
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Описание <span className="text-error-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Подробно опишите проблему: что произошло, при каких условиях, как воспроизвести..."
                rows={4}
                required
                className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-700 resize-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Telegram для обратной связи
                <span className="ml-1 text-xs font-normal text-gray-400">(необязательно)</span>
              </label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
                maxLength={100}
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-700"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:bg-brand-300"
              >
                {loading ? "Отправка..." : "Отправить"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

export function IdeaModal({ isOpen, onClose }: ModalProps) {
  const { title, setTitle, description, setDescription, telegram, setTelegram, loading, error, success, handleClose, handleSubmit } =
    useFeedbackForm("idea", onClose);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg w-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Предложить идею</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Поделитесь вашей идеей — мы читаем каждое предложение.
        </p>

        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/10">
              <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Идея принята, спасибо!</p>
            <p className="mt-1 text-xs text-gray-500">Ваше предложение будет рассмотрено командой.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="error" title="Ошибка" message={error} />}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Заголовок <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Кратко опишите идею"
                maxLength={255}
                required
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Описание <span className="text-error-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите подробнее: зачем это нужно, как это могло бы работать..."
                rows={4}
                required
                className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-700 resize-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Как с вами связаться
                <span className="ml-1 text-xs font-normal text-gray-400">(необязательно)</span>
              </label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username или другой контакт"
                maxLength={100}
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-700"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:bg-brand-300"
              >
                {loading ? "Отправка..." : "Отправить"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
