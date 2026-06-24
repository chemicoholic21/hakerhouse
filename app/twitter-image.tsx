import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Kerhouse - Build and Grow';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 128,
        background: '#0f172a',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
      }}
    >
      Kerhouse
    </div>,
    {
      ...size,
    }
  );
}
