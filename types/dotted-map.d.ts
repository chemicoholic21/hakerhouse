declare module "dotted-map" {
  interface DottedMapOptions {
    height?: number;
    grid?: "vertical" | "diagonal";
    countries?: string[];
  }

  interface PinOptions {
    lat: number;
    lng: number;
    svgOptions?: {
      color?: string;
      radius?: number;
    };
    data?: unknown;
  }

  interface SVGOptions {
    radius?: number;
    color?: string;
    shape?: "circle" | "hexagon";
    backgroundColor?: string;
  }

  interface Point {
    x: number;
    y: number;
    data?: unknown;
    svgOptions?: {
      color?: string;
      radius?: number;
    };
  }

  class DottedMap {
    constructor(options?: DottedMapOptions);
    addPin(options: PinOptions): void;
    getPoints(): Point[];
    getSVG(options?: SVGOptions): string;
  }

  export default DottedMap;
}
