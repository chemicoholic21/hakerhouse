import React from 'react';
import { JsonLd } from '../JsonLd';

export function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kerhouse',
    url: 'https://hackerhou.se',
    logo: 'https://hackerhou.se/logo.png',
  };

  return <JsonLd data={data} />;
}
