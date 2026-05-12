"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/platform2/components/ui/table";
import Icon from "@/platform2/icons";
import { financesApi, FinancesData } from "@/lib/api";

export default function FinancesPage() {
  const [financesData, setFinancesData] = useState<FinancesData | null>(null);

  useEffect(() => {
    financesApi.get({ limit: 100 }).then(setFinancesData).catch(() => {});
  }, []);

  const stats = {
    totalRevenue: financesData?.total_revenue ?? 0,
    orders: financesData?.total_orders ?? 0,
    withdrawals: 0,
    operations: financesData?.transactions?.length ?? 0,
  };

  const transactions = financesData?.transactions ?? [];

  return (
    <div className="space-y-6">

      {/* ЗАГОЛОВОК */}
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          Финансы
        </h1>
      </div>

      {/* 4 КАРТОЧКИ */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body">Общая выручка</p>
                <h3 className="mt-2 text-2xl font-bold text-dark dark:text-white">
                  {stats.totalRevenue} ₽
                </h3>
                <p className="mt-1 text-xs text-body">По всем аккаунтам</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
                <Icon name="dollar-line" className="h-6 w-6 text-brand-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body">Заказов</p>
                <h3 className="mt-2 text-2xl font-bold text-dark dark:text-white">
                  {stats.orders}
                </h3>
                <p className="mt-1 text-xs text-body">Всего оплаченных заказов</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-500/10">
                <Icon name="box" className="h-6 w-6 text-warning-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body">Выводы</p>
                <h3 className="mt-2 text-2xl font-bold text-dark dark:text-white">
                  {stats.withdrawals} ₽
                </h3>
                <p className="mt-1 text-xs text-body">По активным фильтрам</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-500/10">
                <Icon name="arrow-up" className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body">Операций</p>
                <h3 className="mt-2 text-2xl font-bold text-dark dark:text-white">
                  {stats.operations}
                </h3>
                <p className="mt-1 text-xs text-body">С учётом фильтров</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-500/10">
                <Icon name="list" className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ГРАФИК */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle>Поступления по месяцам</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 flex items-center justify-center text-body">
            График (пока нет данных)
          </div>
        </CardContent>
      </Card>

      {/* ТАБЛИЦА ТРАНЗАКЦИЙ */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button className="border-b-2 border-brand-500 pb-2 text-sm font-medium text-brand-500">
                Операционные транзакции
              </button>
              <button className="pb-2 text-sm font-medium text-body hover:text-gray-700">
                Все аккаунты
              </button>
              <button className="pb-2 text-sm font-medium text-body hover:text-gray-700">
                Все операции
              </button>
            </div>
            <Button variant="outline">
              <Icon name="download" className="mr-2 h-4 w-4" />
              Экспорт CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Icon name="docs" className="h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-dark dark:text-white">
                Операций по текущим фильтрам не найдено.
              </h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ДАТА</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ТИП</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ОПИСАНИЕ</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">АККАУНТ</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">СУММА</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="px-5 py-4">{new Date(tx.date).toLocaleDateString()}</TableCell>
                      <TableCell className="px-5 py-4">{tx.type}</TableCell>
                      <TableCell className="px-5 py-4">{tx.description}</TableCell>
                      <TableCell className="px-5 py-4">{tx.account_username}</TableCell>
                      <TableCell className="px-5 py-4">{tx.amount}₽</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
