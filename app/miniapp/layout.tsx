import Script from 'next/script';
import '@telegram-apps/telegram-ui/dist/styles.css';
import '@/miniapp/miniapp.css';

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      {children}
    </>
  );
}
