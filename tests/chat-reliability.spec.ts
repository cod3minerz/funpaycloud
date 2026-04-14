import { expect, test, type Page } from '@playwright/test';

async function bootstrapChatPage(page: Page) {
  const context = page.context();
  await context.addCookies([
    {
      name: 'token',
      value: 'test-token',
      url: 'http://localhost:3100',
    },
  ]);

  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');

    type MockChat = {
      id: number;
      node_id: string;
      with_user: string;
      last_message: string;
      unread: boolean;
      updated_at: string;
    };

    type MockMessage = {
      id: number;
      temp_id?: number;
      funpay_message_id?: number;
      chat_id: number;
      author_id?: number;
      author_name: string;
      text: string;
      is_my_msg: boolean;
      status?: 'pending' | 'delivered' | 'failed';
      created_at: string;
    };

    const state: {
      accountID: number;
      chatID: number;
      nodeID: string;
      chats: MockChat[];
      messages: MockMessage[];
      historyRequests: number;
      messagesRequests: number;
      sendRequests: number;
    } = {
      accountID: 8,
      chatID: 5,
      nodeID: '252535735',
      chats: [
        {
          id: 5,
          node_id: '252535735',
          with_user: 'DigitalRush',
          last_message: 'Привет',
          unread: false,
          updated_at: '2026-04-14T10:00:00Z',
        },
      ],
      messages: [
        {
          id: 101,
          chat_id: 5,
          author_id: 777,
          author_name: 'DigitalRush',
          text: 'Привет',
          is_my_msg: false,
          status: 'delivered',
          created_at: '2026-04-14T09:58:00Z',
        },
      ],
      historyRequests: 0,
      messagesRequests: 0,
      sendRequests: 0,
    };

    const envelope = (data: unknown, status = 200) =>
      new Response(JSON.stringify({ success: true, data }), {
        status,
        headers: {
          'Content-Type': 'application/json',
        },
      });

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const rawURL = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(rawURL, window.location.origin);
      const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET')).toUpperCase();
      const path = url.pathname;

      if (!path.startsWith('/api/')) {
        return originalFetch(input, init);
      }

      if (path === '/api/accounts' && method === 'GET') {
        return envelope([
          {
            id: state.accountID,
            username: 'tonminerz',
            keeper_active: true,
            raiser_active: false,
            raiser_time: '12:00',
            raiser_timezone: 'Europe/Moscow',
          },
        ]);
      }

      if (path === `/api/accounts/${state.accountID}/chats/history` && method === 'GET') {
        state.historyRequests += 1;
        return envelope(state.chats);
      }

      if (path.startsWith(`/api/chats/${state.chatID}/messages`) && method === 'GET') {
        state.messagesRequests += 1;
        return envelope(state.messages);
      }

      if (path === `/api/accounts/${state.accountID}/messages` && method === 'POST') {
        state.sendRequests += 1;
        let body: { chat_id: string; text: string } = { chat_id: state.nodeID, text: '' };
        if (typeof init?.body === 'string') {
          body = JSON.parse(init.body) as { chat_id: string; text: string };
        }

        const tempID = -(Date.now() + state.sendRequests);
        const createdAt = new Date().toISOString();

        state.messages.push({
          id: tempID,
          temp_id: tempID,
          chat_id: state.chatID,
          author_id: 19438965,
          author_name: 'Вы',
          text: body.text,
          is_my_msg: true,
          status: 'pending',
          created_at: createdAt,
        });

        state.chats = state.chats.map(chat =>
          chat.node_id === body.chat_id
            ? {
                ...chat,
                last_message: body.text,
                updated_at: createdAt,
                unread: false,
              }
            : chat,
        );

        return envelope({
          temp_id: tempID,
          text: body.text,
          is_my_msg: true,
          status: 'pending',
          created_at: createdAt,
        });
      }

      if (path === '/api/auth/me') {
        return envelope({
          id: 2,
          email: 'qa@test.local',
          is_verified: true,
          plan: 'trial',
        });
      }

      return envelope({});
    };

    const sockets: any[] = [];
    let openCount = 0;
    let visibility: DocumentVisibilityState = 'visible';

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });

    class MockWebSocket extends EventTarget {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      url: string;
      readyState = MockWebSocket.CONNECTING;
      bufferedAmount = 0;
      extensions = '';
      protocol = '';
      binaryType: BinaryType = 'blob';
      onopen: ((this: WebSocket, ev: Event) => any) | null = null;
      onerror: ((this: WebSocket, ev: Event) => any) | null = null;
      onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
      onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;

      constructor(url: string | URL) {
        super();
        this.url = String(url);
        sockets.push(this);
        setTimeout(() => this.__open(), 0);
      }

      send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {}

      close(code = 1000, reason = '') {
        this.__close(code, reason);
      }

      __open() {
        if (this.readyState !== MockWebSocket.CONNECTING) return;
        this.readyState = MockWebSocket.OPEN;
        openCount += 1;
        const ev = new Event('open');
        this.dispatchEvent(ev);
        this.onopen?.call(this as unknown as WebSocket, ev);
      }

      __emit(payload: unknown) {
        if (this.readyState !== MockWebSocket.OPEN) return;
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const ev = new MessageEvent('message', { data });
        this.dispatchEvent(ev);
        this.onmessage?.call(this as unknown as WebSocket, ev);
      }

      __close(code = 1000, reason = '') {
        if (this.readyState === MockWebSocket.CLOSED) return;
        this.readyState = MockWebSocket.CLOSED;
        const ev = new CloseEvent('close', { code, reason, wasClean: code === 1000 });
        this.dispatchEvent(ev);
        this.onclose?.call(this as unknown as WebSocket, ev);
      }
    }

    Object.defineProperty(window, 'WebSocket', {
      configurable: true,
      writable: true,
      value: MockWebSocket,
    });

    (window as any).__chatTest = {
      getState() {
        return JSON.parse(JSON.stringify(state));
      },
      emit(type: string, data: Record<string, unknown>) {
        const socket = sockets[sockets.length - 1];
        socket?.__emit({ type, data });
      },
      closeLatest(code = 1006, reason = 'forced-close') {
        const socket = sockets[sockets.length - 1];
        socket?.__close(code, reason);
      },
      setVisibility(next: DocumentVisibilityState) {
        visibility = next;
        document.dispatchEvent(new Event('visibilitychange'));
      },
      confirmPending(tempID: number, realID: number) {
        state.messages = state.messages.map(msg =>
          msg.temp_id === tempID || msg.id === tempID
            ? {
                ...msg,
                id: realID,
                funpay_message_id: realID,
                status: 'delivered',
              }
            : msg,
        );
      },
      getOpenCount() {
        return openCount;
      },
    };
  });
}

async function readState(page: Page) {
  return page.evaluate(() => (window as any).__chatTest.getState());
}

test('send flow: pending -> delivered, without loadMessages call after send', async ({ page }) => {
  await bootstrapChatPage(page);

  await page.goto('/platform/chats');
  await expect(page.getByRole('heading', { name: 'Чаты' })).toBeVisible();
  await expect.poll(async () => (await readState(page)).historyRequests, { timeout: 20000 }).toBeGreaterThan(0);
  await expect(page.getByText('Подгружаем ваши чаты с FunPay...')).toBeHidden({ timeout: 20000 });

  const firstChat = page.locator('.platform-chat-row').first();
  await expect(firstChat).toBeVisible();
  await firstChat.click();

  await expect.poll(async () => (await readState(page)).messagesRequests).toBeGreaterThan(0);
  const beforeSendMessageLoads = (await readState(page)).messagesRequests;

  const composer = page.getByPlaceholder('Введите сообщение...');
  await composer.fill('Надежность чата');
  await composer.press('Enter');

  const outgoingRow = page.locator('.platform-message-row.outgoing').filter({ hasText: 'Надежность чата' });
  await expect(outgoingRow).toHaveCount(1);
  await expect(outgoingRow.locator('[aria-label="Отправлено"]')).toBeVisible();

  await page.waitForTimeout(400);
  expect((await readState(page)).messagesRequests).toBe(beforeSendMessageLoads);

  const pendingMessage = (await readState(page)).messages.find((msg: any) => msg.text === 'Надежность чата' && msg.status === 'pending');
  expect(pendingMessage).toBeTruthy();

  const tempID = Number(pendingMessage?.temp_id ?? pendingMessage?.id);
  const realID = 99281234;

  await page.evaluate(
    ({ chatID, nodeID, tempID, realFunpayMessageID }) => {
      (window as any).__chatTest.confirmPending(tempID, realFunpayMessageID);
      (window as any).__chatTest.emit('message_confirmed', {
        chat_id: chatID,
        node_id: nodeID,
        temp_id: tempID,
        real_funpay_message_id: realFunpayMessageID,
        status: 'delivered',
      });
    },
    {
      chatID: 5,
      nodeID: '252535735',
      tempID,
      realFunpayMessageID: realID,
    },
  );

  await expect(outgoingRow.locator('[aria-label="Доставлено"]')).toBeVisible();
});

test('ws reconnect + visibility refresh trigger catch-up reload', async ({ page }) => {
  await bootstrapChatPage(page);

  await page.goto('/platform/chats');
  await expect(page.getByRole('heading', { name: 'Чаты' })).toBeVisible();
  await expect.poll(async () => (await readState(page)).historyRequests, { timeout: 20000 }).toBeGreaterThan(0);
  await expect(page.getByText('Подгружаем ваши чаты с FunPay...')).toBeHidden({ timeout: 20000 });

  const firstChat = page.locator('.platform-chat-row').first();
  await expect(firstChat).toBeVisible();
  await firstChat.click();

  await expect.poll(async () => (await readState(page)).messagesRequests).toBeGreaterThan(0);
  const stateBeforeReconnect = await readState(page);

  await page.evaluate(() => {
    (window as any).__chatTest.closeLatest();
  });

  await expect.poll(async () => (await readState(page)).historyRequests, { timeout: 8000 }).toBeGreaterThan(stateBeforeReconnect.historyRequests);
  await expect.poll(async () => (await readState(page)).messagesRequests, { timeout: 8000 }).toBeGreaterThan(stateBeforeReconnect.messagesRequests);

  const stateBeforeVisible = await readState(page);

  await page.evaluate(() => {
    (window as any).__chatTest.setVisibility('hidden');
    (window as any).__chatTest.setVisibility('visible');
  });

  await expect.poll(async () => (await readState(page)).historyRequests).toBeGreaterThan(stateBeforeVisible.historyRequests);
  await expect.poll(async () => (await readState(page)).messagesRequests).toBeGreaterThan(stateBeforeVisible.messagesRequests);
});
