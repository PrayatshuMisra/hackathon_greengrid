import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

if (!window.matchMedia) {
  window.matchMedia = function (query: string): MediaQueryList {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),     
      removeListener: jest.fn(), 
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    } as any;
  };
}

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: (type: string) => {
    if (type === "2d") {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({
          data: new Uint8ClampedArray(0),
          width: 0,
          height: 0,
        }),
        putImageData: () => {},
        createImageData: () => ({
          data: new Uint8ClampedArray(0),
          width: 0,
          height: 0,
        }),
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        clip: () => {},
        canvas: document.createElement("canvas"),
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  },
});