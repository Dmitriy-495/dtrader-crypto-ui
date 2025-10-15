/**
 * src/ui/rightbar.js
 *
 * drawRightBar(term, x, y, width, height, data)
 *
 * Правая панель: вертикальные рамки, текст балансов/позиций внутри.
 */

export function drawRightBar(
  term,
  x,
  y,
  width,
  height,
  data = { balances: {}, positions: [] }
) {
  // Вертикальные рамки справа-блока
  for (let r = 0; r < height; r++) {
    term.moveTo(x, y + r).white("│");
    term.moveTo(x + width - 1, y + r).white("│");
  }

  // Текст внутри — отступ 2
  const balances = data.balances || {};
  term.moveTo(x + 2, y + 1).colorRgb(255, 165, 0)(
    `Баланс: ${balances.USDT ?? 0} USDT`
  );
  term.moveTo(x + 2, y + 2).colorRgb(255, 165, 0)(
    `Открытых позиций: ${(data.positions || []).length}`
  );
}
