import { Card, CardContent, CardHeader, CardTitle } from '@/components/tailwind-admin/ui/card';
import { Button } from '@/components/tailwind-admin/ui/button';
import { Input } from '@/components/tailwind-admin/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/tailwind-admin/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/tailwind-admin/ui/table';
import { Badge } from '@/components/tailwind-admin/ui/badge';
import { Icon } from '@iconify/react';

// ✅ Захардкоженные данные (потом подключим API)
const stats = {
  total: 1,
  runnerActive: 1,
  keeperOnline: 1,
  raiserRunning: 0,
};

const accounts = [
  {
    id: 1,
    username: 'tomminerz',
    status: 'Онлайн',
    runner: true,
    keeper: true,
    raiser: false,
    proxy: 'Бесплатный прокси #2',
  },
];

export default function AccountsPageV2() {
  return (
    <div className="space-y-6">
      
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Аккаунты</h1>
          <p className="text-muted-foreground">
            Управление FunPay аккаунтами
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Icon icon="solar:stop-circle-line-duotone" className="mr-2 h-4 w-4" />
            Остановить всё
          </Button>
          <Button>
            <Icon icon="solar:user-plus-line-duotone" className="mr-2 h-4 w-4" />
            Добавить аккаунт
          </Button>
        </div>
      </div>

      {/* ✅ 4 карточки статистики - Tailwind Admin стиль */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Аккаунтов
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  {stats.total}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Всего в управлении
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icon icon="solar:users-group-two-rounded-line-duotone" className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Runner активен
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  {stats.runnerActive}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ловит события прямо сейчас
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Icon icon="solar:play-circle-line-duotone" className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Keeper онлайн
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  {stats.keeperOnline}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Сессии поддерживаются
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Icon icon="solar:shield-check-line-duotone" className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Raiser запущен
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  {stats.raiserRunning}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Автоподнятие включено
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-error/10">
                <Icon icon="solar:arrow-up-line-duotone" className="h-6 w-6 text-error" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ✅ Таблица - Tailwind Admin стиль */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Список аккаунтов</CardTitle>
          <div className="flex gap-2">
            <Input 
              placeholder="Поиск по логину аккаунта" 
              className="w-64"
            />
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="online">Онлайн</SelectItem>
                <SelectItem value="offline">Оффлайн</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>АККАУНТ</TableHead>
                <TableHead>СТАТУСЫ</TableHead>
                <TableHead>ПРОКСИ</TableHead>
                <TableHead>ДЕЙСТВИЯ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning text-white font-semibold">
                        {account.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{account.username}</p>
                        <p className="text-sm text-muted-foreground">{account.status}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <div className={`h-2 w-2 rounded-full ${account.runner ? 'bg-success' : 'bg-muted'}`} />
                      <div className={`h-2 w-2 rounded-full ${account.keeper ? 'bg-success' : 'bg-muted'}`} />
                      <div className={`h-2 w-2 rounded-full ${account.raiser ? 'bg-success' : 'bg-muted'}`} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {account.proxy}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Открыть
                      </Button>
                      <Button variant="outline" size="sm">
                        Сменить прокси
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
