import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public/house-illustration.svg');
const outPath = path.join(root, 'components/house-illustration.tsx');

const lines = fs.readFileSync(svgPath, 'utf8').split('\n');
const inner = lines
  .slice(3, 4049)
  .join('\n')
  .replaceAll('stroke="#808080"', 'stroke="var(--house-illustration-stroke)"')
  .replaceAll('fill="#fefefe"', 'fill="var(--house-illustration-fill)"')
  .replaceAll('fill="fefefe"', 'fill="var(--house-illustration-fill)"')
  .replaceAll('fill="#010101"', 'fill="var(--house-illustration-detail)"');

const body = `import type { SVGProps } from "react"

export function HouseIllustration({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 944 620"
      width={944}
      height={620}
      className={className}
      {...props}
      dangerouslySetInnerHTML={{ __html: INNER }}
    />
  )
}

const INNER = ${JSON.stringify(inner)}
`;

fs.writeFileSync(outPath, body);
