export default function LandingNightStory() {
  return (
    <section className="landing-night">
      <div className="wrap">
        <div className="landing-night-eyebrow">Каждую ночь</div>
        <h2 className="landing-night-title">Пока ты спишь — кто-то зарабатывает</h2>
        <p className="landing-night-sub">На FunPay пиковые часы — с 20:00 до 02:00. Это 6 часов, когда большинство продавцов офлайн.</p>

        <div className="landing-night-panels">

          <div className="landing-night-panel landing-night-panel--bad">
            <div className="landing-night-panel-top">
              <span className="landing-night-tag landing-night-tag--bad">Без FunPay Cloud</span>
              <span className="landing-night-clock">02:37</span>
            </div>
            <div className="landing-night-chat">
              <div className="landing-night-msg landing-night-msg--in" style={{ animationDelay: '0.1s' }}>
                <span>есть ключи?</span>
                <time>02:37</time>
              </div>
              <div className="landing-night-silence">
                <span className="landing-night-dots"><i /><i /><i /></span>
                <small>продавец спит — нет ответа</small>
              </div>
              <div className="landing-night-msg landing-night-msg--in" style={{ animationDelay: '0.4s' }}>
                <span>ладно, у другого куплю</span>
                <time>02:41</time>
              </div>
            </div>
            <div className="landing-night-result landing-night-result--bad">
              −400 ₽ — покупатель ушёл к конкуренту
            </div>
          </div>

          <div className="landing-night-vs">VS</div>

          <div className="landing-night-panel landing-night-panel--good">
            <div className="landing-night-panel-top">
              <span className="landing-night-tag landing-night-tag--good">С FunPay Cloud</span>
              <span className="landing-night-clock">02:37</span>
            </div>
            <div className="landing-night-chat">
              <div className="landing-night-msg landing-night-msg--in" style={{ animationDelay: '0.1s' }}>
                <span>есть ключи?</span>
                <time>02:37</time>
              </div>
              <div className="landing-night-bot-row">
                <span className="landing-night-bot-badge">⚡ FunPay Cloud</span>
                <small>ответ за 2 секунды</small>
              </div>
              <div className="landing-night-msg landing-night-msg--out" style={{ animationDelay: '0.3s' }}>
                <span>Да! Steam ключ — 400 ₽. Оплатить? 🎮</span>
                <time>02:37</time>
              </div>
              <div className="landing-night-msg landing-night-msg--in" style={{ animationDelay: '0.5s' }}>
                <span>беру!</span>
                <time>02:38</time>
              </div>
            </div>
            <div className="landing-night-result landing-night-result--good">
              +400 ₽ — продавец до сих пор спит 😴
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
