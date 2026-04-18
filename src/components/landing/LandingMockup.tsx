export default function LandingMockup() {
  return (
    <div className="wrap">
      <div className="mock-frame">
        <div className="mock-top">
          <div className="dots">
            <i />
            <i />
            <i />
          </div>
          <div className="url mono">app.funpaycloud.io / dashboard</div>
          <div className="mono mock-version">v2.4.1</div>
        </div>

        <div className="mock-body">
          <aside className="mock-side">
            <div className="side-title">Операции</div>
            <div className="side-item active">
              <span className="sq" />Дашборд
            </div>
            <div className="side-item">
              <span className="sq" />Заказы<span className="badge">94</span>
            </div>
            <div className="side-item">
              <span className="sq" />Чаты<span className="badge">31</span>
            </div>
            <div className="side-item">
              <span className="sq" />Лоты
            </div>
            <div className="side-item">
              <span className="sq" />Склад
            </div>
            <div className="side-title side-title-gap">Аналитика</div>
            <div className="side-item">
              <span className="sq" />Отчёты
            </div>
            <div className="side-item">
              <span className="sq" />Автоматизация
            </div>
            <div className="side-item">
              <span className="sq" />Статус системы
            </div>
          </aside>

          <div className="mock-main">
            <div className="mock-head">
              <h3>Дашборд · Продавец 24/7</h3>
              <span className="period mono">последние 24ч ▾</span>
            </div>

            <div className="kpis">
              <div className="kpi">
                <div className="lbl">Оборот 24ч</div>
                <div className="val">128 540 ₽</div>
                <div className="chg">▲ 18.4%</div>
              </div>
              <div className="kpi">
                <div className="lbl">Новые заказы</div>
                <div className="val">94</div>
                <div className="chg">▲ 12 от среднего</div>
              </div>
              <div className="kpi">
                <div className="lbl">Активные чаты</div>
                <div className="val">31</div>
                <div className="chg neutral">· AI ведёт 22</div>
              </div>
              <div className="kpi">
                <div className="lbl">Аптайм</div>
                <div className="val">99.98%</div>
                <div className="chg">● online</div>
              </div>
            </div>

            <div className="mock-cols">
              <div className="panel">
                <div className="panel-h">
                  Последние заказы <span className="link">смотреть все →</span>
                </div>
                <table className="orders">
                  <thead>
                    <tr>
                      <th>Заказ</th>
                      <th>Покупатель</th>
                      <th>Сумма</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="mono">#A-48215</td>
                      <td>dmitry_p</td>
                      <td>1 490 ₽</td>
                      <td>
                        <span className="pill ok">Выдан</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="mono">#A-48214</td>
                      <td>nikita_x</td>
                      <td>3 200 ₽</td>
                      <td>
                        <span className="pill ok">Выдан</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="mono">#A-48213</td>
                      <td>elena_r</td>
                      <td>890 ₽</td>
                      <td>
                        <span className="pill new">AI отвечает</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="mono">#A-48212</td>
                      <td>pro_gamer</td>
                      <td>5 400 ₽</td>
                      <td>
                        <span className="pill wait">Проверка</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="mono">#A-48211</td>
                      <td>kirill_77</td>
                      <td>2 150 ₽</td>
                      <td>
                        <span className="pill ok">Выдан</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mock-right-column">
                <div className="panel">
                  <div className="panel-h">Недавние диалоги</div>
                  <div className="chat-list">
                    <div className="chat-row">
                      <div className="avatar">D</div>
                      <div className="chat-txt">
                        <div className="nm">dmitry_p</div>
                        <div className="ms">Оплата прошла, жду ключ…</div>
                      </div>
                    </div>
                    <div className="chat-row">
                      <div className="avatar">E</div>
                      <div className="chat-txt">
                        <div className="nm">elena_r</div>
                        <div className="ms">AI: ключ отправлен, удачной игры!</div>
                      </div>
                    </div>
                    <div className="chat-row">
                      <div className="avatar">K</div>
                      <div className="chat-txt">
                        <div className="nm">kirill_77</div>
                        <div className="ms">Спасибо, всё работает ✓</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-h">Статус системы</div>
                  <div className="status-grid">
                    <div className="status-row">
                      <span className="name">Автовыдача</span>
                      <span className="val">
                        <span className="d" />работает
                      </span>
                    </div>
                    <div className="status-row">
                      <span className="name">Автоподнятие</span>
                      <span className="val">
                        <span className="d" />работает
                      </span>
                    </div>
                    <div className="status-row">
                      <span className="name">AI-ответы</span>
                      <span className="val">
                        <span className="d" />работает
                      </span>
                    </div>
                    <div className="status-row">
                      <span className="name">Telegram-бот</span>
                      <span className="val">
                        <span className="d" />online
                      </span>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-h">Быстрые действия</div>
                  <div className="quick">
                    <span className="q">Поднять лоты</span>
                    <span className="q">Проверить чаты</span>
                    <span className="q">Обновить склад</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
