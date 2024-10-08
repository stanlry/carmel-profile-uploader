
export function roundEdges(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  const { width, height } = canvas;
  if (context) {
    context.fillStyle = "#fff";
    context.globalCompositeOperation = "destination-in";
    context.beginPath();
    context.scale(1, height / width);
    context.arc(width / 2, width / 2, width / 2, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }
  return canvas;
}
