import type { Metadata } from 'next'
import './globals.css'
import ThemeInitializer from '@/components/ThemeInitializer'

export const metadata: Metadata = {
  title: 'ICEA Chat',
  description: 'Sistema de chat em tempo real — UFOP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Apply theme before paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t = localStorage.getItem('theme');
            if(t === 'dark') document.documentElement.classList.add('dark');
          })();
        `}} />
      </head>
      <body>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  )
}