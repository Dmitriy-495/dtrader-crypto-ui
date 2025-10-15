/**
 * src/ui/leftbar.js
 *
 * drawLeftBar(term, x, y, width, height)
 *
 * Левая панель: рамка слева (вертикальная), текст индикаторов внутри.
 * Верхние/нижние горизонтальные границы у лев. и прав. панелей по ТЗ убраны.
 */

export function drawLeftBar(term, x, y, width, height) {
  // Рисуем вертикальные рамки: левая и правая граница панели
  for (let r = 0; r < height; r++) {
    term.moveTo(x, y + r).white("│");
    term.moveTo(x + width - 1, y + r).white("│");
  }

  // Текст индикаторов, с отступом 2 символа
  term.moveTo(x + 2, y + 1).colorRgb(255, 165, 0)("RSI: 45");
  term.moveTo(x + 2, y + 2).colorRgb(255, 165, 0)("MA(50): 38200");
}
