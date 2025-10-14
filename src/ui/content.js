export default function drawContent(term, { x, width, height, state }) {
  const startY = 4; // после header
  const availableHeight = height - 6;
  const logsToShow = state.logs.slice(-availableHeight);

  // очистка области
  for (let y = startY; y < height - 2; y++) {
    term.moveTo(x, y);
    term.bgBlack(" ".repeat(width));
  }

  // вывод строк
  let lineY = startY;
  logsToShow.forEach((line) => {
    let color = term.green;
    if (line.includes("[ERROR]")) color = term.red;
    else if (line.includes("[WARNING]")) color = term.yellow;

    const wrapped = wrapText(line, width - 4);
    for (const w of wrapped) {
      if (lineY >= height - 2) break;
      term.moveTo(x + 1, lineY++);
      term.bgBlack();
      color(w);
    }
  });

  // рамки контента
  for (let y = startY; y < height - 2; y++) {
    term.moveTo(x, y).white("|");
    term.moveTo(x + width - 1, y).white("|");
  }
}

function wrapText(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + w).length > maxWidth) {
      lines.push(current.trim());
      current = w + " ";
    } else current += w + " ";
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}
