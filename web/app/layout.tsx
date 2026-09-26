import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/src/app/AppProviders';
import { GlobalHeader } from '@/src/components/GlobalHeader';
import { GlobalFooter } from '@/src/components/GlobalFooter';
import { MotionEffects } from '@/src/components/MotionEffects';
import { PrismaAssistant } from '@/src/components/PrismaAssistant';
import './globals.css';
import '@/src/styles/system.css';
import '@/src/styles/landing.css';
import '@/src/styles/builder.css';
import '@/src/styles/content.css';
import '@/src/styles/assistant.css';
import '@/src/styles/motion.css';

const siteUrl = new URL(process.env.URL ?? 'http://localhost:3000');

export const dynamic = 'force-static';

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'PRISMA Lab — clareza científica do rastreamento à publicação', template: '%s · PRISMA Lab' },
  description: 'Aplicação independente para criar, validar e exportar diagramas baseados no PRISMA 2020, com processamento local e seis idiomas.',
  applicationName: 'PRISMA Lab',
  keywords: ['PRISMA 2020', 'systematic review', 'flow diagram', 'evidence synthesis'],
  authors: [{ name: 'Gustavo Simas', url: 'https://gustavosimas.com/' }],
  creator: 'Gustavo Simas',
  alternates: {
    canonical: '/',
    languages: { 'pt-BR': '/', en: '/', it: '/', fr: '/', de: '/', 'zh-CN': '/' },
  },
  openGraph: {
    type: 'website',
    title: 'PRISMA Lab',
    description: 'Clareza científica, do rastreamento à publicação.',
    siteName: 'PRISMA Lab',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'PRISMA Lab — Clareza científica, do rastreamento à publicação.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRISMA Lab',
    description: 'Clareza científica, do rastreamento à publicação.',
    images: ['/og.png'],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eeece4' },
    { media: '(prefers-color-scheme: dark)', color: '#07110f' },
  ],
  colorScheme: 'light dark',
};

// Runs before first paint: applies the saved reduced-motion preference early and
// skips the cross-document view transition for users who asked for less motion.
const motionPreferenceScript = `try{var a=JSON.parse(localStorage.getItem('prisma-accessibility')||'null');if(a&&a.reduceMotion)document.documentElement.dataset.motion='reduced'}catch(e){}
addEventListener('pagereveal',function(e){if(e.viewTransition&&document.documentElement.dataset.motion==='reduced')e.viewTransition.skipTransition()});`;

const structuredData = {
  '@context': 'https://schema.org',
  '@type': ['SoftwareApplication', 'WebApplication', 'LearningResource'],
  name: 'PRISMA Lab',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  isAccessibleForFree: true,
  inLanguage: ['pt-BR', 'en', 'it', 'fr', 'de', 'zh-CN'],
  description: 'Ferramenta independente de assistência ao relato baseada no PRISMA 2020.',
  author: { '@type': 'Person', name: 'Gustavo Simas', url: 'https://gustavosimas.com/' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: motionPreferenceScript }} />
        <AppProviders>
          <GlobalHeader />
          {children}
          <GlobalFooter />
          <PrismaAssistant />
          <MotionEffects />
        </AppProviders>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}
