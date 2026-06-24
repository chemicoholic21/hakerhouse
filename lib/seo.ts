import type { Metadata } from 'next';

const BASE_URL = 'https://hackerhou.se';

interface BuildPageMetadataProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string[];
}

export function buildPageMetadata({
  title,
  description = 'A platform for hackers to build and grow.',
  path = '',
  image = '/opengraph-image', // Default OG image path
  keywords = ['hacker', 'house', 'build', 'community', 'devs'],
}: BuildPageMetadataProps = {}): Metadata {
  const url = `${BASE_URL}${path}`;
  const fullTitle = title ? `${title} | Kerhouse` : 'Kerhouse - Build and Grow';

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: 'Kerhouse',
      images: [
        {
          url: image.startsWith('http') ? image : `${BASE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.startsWith('http') ? image : `${BASE_URL}${image}`],
    },
  };
}
