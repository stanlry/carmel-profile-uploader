import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  if (canvas.width <= width && canvas.height <= height) {
    return canvas;
  }

  const newCanvas = document.createElement('canvas');
  newCanvas.width = width;
  newCanvas.height = height;
  const ctx = newCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, width, height);
  }
  return newCanvas;
}

export function dateToCompactString(date: Date) : string {
  return date.getFullYear().toString() 
  + date.getMonth().toString().padStart(2, '0') + 
  date.getDate().toString().padStart(2, '0') + 
  date.getHours().toString().padStart(2, '0') + 
  date.getMinutes().toString().padStart(2, '0') + 
  date.getSeconds().toString().padStart(2, '0');
}