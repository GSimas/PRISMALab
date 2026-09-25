import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.URL ?? 'http://localhost:3000';
  const routes = ['', '/learn', '/guidelines', '/builder', '/projects', '/about'];
  return routes.map((route) => ({ url: new URL(route || '/', origin).toString(), lastModified: new Date('2026-08-26'), changeFrequency: route === '' ? 'weekly' : 'monthly', priority: route === '' ? 1 : .75 }));
}
