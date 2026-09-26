import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PRISMA Lab',
    short_name: 'PRISMA Lab',
    description: 'Criação, validação e exportação local de diagramas baseados no PRISMA 2020.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07110f',
    theme_color: '#07110f',
    lang: 'pt-BR',
    categories: ['education', 'productivity', 'medical'],
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
