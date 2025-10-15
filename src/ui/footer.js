/**
 * src/ui/footer.js
 *
 * drawFooter(term, x, y, width, height, promptBuffer)
 * footer рисует:
 *  - среднюю строку с промптом "> "
 *  - нижнюю рамку (└──┴──┘) — но верхняя рамка уже рисуется в layout
 */

export function drawFooter(term, x, y, width, height, promptBuffer = "") {
  // средняя строка: промт
  const inputY = y + 1;
  const prompt = "> ";
  const innerWidth = Math.max(1, width - 6); // запас слева/справа
  const display = promptBuffer.length > innerWidth ? promptBuffer.slice(-innerWidth) : promptBuffer;

  term.moveTo(x + 2, inputY);
  term.white(prompt + display);

  // нижняя рамка (layout рисовал верхние углы; нижнюю основу дорисуем здесь для консистентности)
  term.moveTo(x, y + 2);
  term.white("└" + "─".repeat(Math.max(2, width - 2)) + "┘");
}
