/**
 * src/ui/content.js
 *
 * drawContent(term, x, y, width, height, history, scrollOffset)
 * appendContentLine(line, history, max)
 *
 * Responsibilities:
 * - рисует вертикальные рамки слева/справа контента;
 * - обрабатывает перенос длинных строк (wrap);
 * - выводит видимую часть истории с учётом scrollOffset (0 = внизу);
 */

export function drawContent(
  term,
  x,
  y,
  width,
  height,
  history,
  scrollOffset = 0
) {
  // минимальные размеры
  if (width < 6 || height < 3) return;

  // рисуем вертикальные рамки по всей высоте блока
  for (let r = 0; r < height; r++) {
    term.moveTo(x, y + r).white("│"); // левая граница блока
    term.moveTo(x + width - 1, y + r).white("│"); // правая граница блока
  }

  // внутренняя текстовая ширина и вертикальные границы
  const innerWidth = width - 4; // 2 символа рамок + 2 пробела
  const topTextRow = y + 1;
  const visibleRows = Math.max(0, height - 2);

  // строим визуальные строки (wrap)
  const visualLines = [];
  for (let i = 0; i < history.length; i++) {
    const item = String(history[i] ?? "");
    const parts = wrapText(item, innerWidth);
    for (const p of parts) visualLines.push(p);
  }

  // вычисляем окно отображения: от bottom - scrollOffset - visibleRows до ...
  const totalVisual = visualLines.length;
  const startIndex = Math.max(0, totalVisual - scrollOffset - visibleRows);
  const endIndex = Math.min(totalVisual, startIndex + visibleRows);

  let vi = startIndex;
  for (let row = 0; row < visibleRows; row++) {
    const lineY = topTextRow + row;
    // очистим область текста
    term.moveTo(x + 2, lineY);
    term(" ".repeat(innerWidth));

    if (vi < endIndex) {
      const text = visualLines[vi++];
      term.moveTo(x + 2, lineY);
      if (text.includes("[ERROR]")) term.red(text);
      else if (text.includes("[WARNING]")) term.yellow(text);
      else if (text.includes("[CMD]")) term.cyan(text);
      else term.green(text);
    }
  }
}

/**
 * Добавление строки в history и контроль max длины
 */
export function appendContentLine(line, history, max = 1000) {
  if (!Array.isArray(history)) throw new TypeError("history must be array");
  history.push(String(line));
  if (history.length > max) {
    history.splice(0, history.length - max);
  }
}

/**
 * Вспомогательная функция — wrap текста по ширине (с сохранением слов, но разбивкой длинных слов)
 */
function wrapText(text, maxWidth) {
  if (maxWidth <= 0) return [""];
  const words = text.split(" ");
  const res = [];
  let cur = "";
  for (const w of words) {
    if (cur.length === 0) {
      if (w.length <= maxWidth) cur = w;
      else {
        // разбить длинное слово
        for (let i = 0; i < w.length; i += maxWidth) {
          res.push(w.slice(i, i + maxWidth));
        }
        cur = "";
      }
    } else {
      if ((cur + " " + w).length <= maxWidth) {
        cur = cur + " " + w;
      } else {
        res.push(cur);
        if (w.length <= maxWidth) cur = w;
        else {
          for (let i = 0; i < w.length; i += maxWidth) {
            res.push(w.slice(i, i + maxWidth));
          }
          cur = "";
        }
      }
    }
  }
  if (cur.length) res.push(cur);
  if (res.length === 0) res.push("");
  return res;
}
