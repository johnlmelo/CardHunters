/* Redemoinho do portal de saída da fase (canvas circular; a cena o achata e gira). */

export function portalSwirlCanvas(size = 96) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d'), c = size / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(230,255,251,1)');
  g.addColorStop(0.25, 'rgba(127,224,214,1)');
  g.addColorStop(0.6, 'rgba(34,161,151,.95)');
  g.addColorStop(0.85, 'rgba(90,47,153,.9)');
  g.addColorStop(1, 'rgba(90,47,153,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // braços do redemoinho
  const arms = 3;
  for (let a = 0; a < arms; a++) {
    ctx.beginPath();
    for (let r = 3; r < c * 0.92; r += 1) {
      const ang = a * Math.PI * 2 / arms + r * 0.11;
      const x = c + Math.cos(ang) * r, y = c + Math.sin(ang) * r;
      if (r === 3) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  return cv;
}
