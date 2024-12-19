declare module 'quagga' {
  interface QuaggaResult {
    codeResult: {
      code: string;
      format: string;
    };
    line: [number, number][];
    angle: number;
    pattern: number[];
    box: [number, number][];
    boxes: [number, number][][];
  }

  interface QuaggaProcessedResult {
    boxes?: [number, number][][];
    box?: [number, number][];
    line?: [number, number][];
    codeResult?: {
      code: string;
      format: string;
    };
  }

  interface QuaggaCanvas {
    ctx: {
      overlay: CanvasRenderingContext2D;
    };
    dom: {
      overlay: HTMLCanvasElement;
    };
  }

  interface QuaggaConfig {
    inputStream: {
      name?: string;
      type?: string;
      target?: HTMLElement;
      constraints?: {
        facingMode?: string;
        width?: { min?: number; ideal?: number; max?: number };
        height?: { min?: number; ideal?: number; max?: number };
      };
      area?: {
        top?: string;
        right?: string;
        left?: string;
        bottom?: string;
      };
    };
    locator?: {
      patchSize?: string;
      halfSample?: boolean;
    };
    numOfWorkers?: number;
    frequency?: number;
    decoder?: {
      readers?: string[];
    };
    locate?: boolean;
  }

  export const canvas: QuaggaCanvas;

  export function init(config: QuaggaConfig, callback: (err: Error | null) => void): void;
  export function start(): void;
  export function stop(): void;
  export function onDetected(callback: (result: QuaggaResult) => void): void;
  export function onProcessed(callback: (result: QuaggaProcessedResult) => void): void;
  export function offDetected(callback: (result: QuaggaResult) => void): void;
  export function offProcessed(callback: (result: QuaggaProcessedResult) => void): void;
} 