export default function drawLeftBar(term, { x, width, height }) {
  for (let y = 4; y < height - 2; y++) {
    term.moveTo(x, y);
    term.bgBlack(" ".repeat(width));
  }

  term.moveTo(x + 1, 4).green.bold("📊 Индикаторы");
  term.moveTo(x + 1, 6).green("RSI: 45.2");
  term.moveTo(x + 1, 7).green("MA(50): 36250");
  term.moveTo(x + 1, 8).green("MA(200): 35980");

  for (let y = 4; y < height - 2; y++) {
    term.moveTo(x + width, y).white("|");
  }
}
