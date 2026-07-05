"use client";

import { useState, useEffect } from "react";
import { accountsApi, LotRaiseLogEntry } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Badge } from "@/platform2/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/platform2/components/ui/table";

interface Props {
  accountId: number | string;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function RaiseLogTable({ accountId }: Props) {
  const [logs, setLogs] = useState<LotRaiseLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    accountsApi
      .getRaiseLog(accountId)
      .then((data) => {
        setLogs(data.logs ?? []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.message ?? "Ошибка загрузки");
        setLoading(false);
      });
  }, [accountId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>История подъёма лотов</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-[var(--pf-text-dim)]">Загрузка...</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && logs.length === 0 && (
          <p className="text-sm text-[var(--pf-text-dim)]">
            Пока нет записей — они появятся после первого подъёма.
          </p>
        )}
        {!loading && logs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Время</TableCell>
                <TableCell isHeader>Найдено</TableCell>
                <TableCell isHeader>Поднято</TableCell>
                <TableCell isHeader>Ошибки</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatTime(log.raised_at)}</TableCell>
                  <TableCell>{log.found}</TableCell>
                  <TableCell>
                    {log.raised > 0 ? (
                      <Badge variant="success">{log.raised}</Badge>
                    ) : (
                      <span className="text-[var(--pf-text-dim)]">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.errors_count > 0 ? (
                      <Badge variant="error">{log.errors_count}</Badge>
                    ) : (
                      <span className="text-[var(--pf-text-dim)]">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
