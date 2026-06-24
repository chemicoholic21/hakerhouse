import { MetadataRoute } from 'next';
import { developers } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hackerhou.se';

  // Dynamic routes for developers
  const developerRoutes = developers.map((dev) => ({
    url: `${baseUrl}/${dev.username}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...developerRoutes,
  ];
}
