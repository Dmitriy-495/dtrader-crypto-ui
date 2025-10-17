// src/ui/layout.js
// ------------------------------------------------------------
// Отвечает за построение консольного интерфейса с помощью terminal-kit
// ------------------------------------------------------------

import terminalKit from "terminal-kit";
const term = terminalKit.terminal;

const RIGHTBAR_WIDTH_PERCENT = parseInt(
  process.env.RIGHTBAR_WIDTH_PERCENT || "40",
  10
);

// ------------------------------------------------------------
// Функция рендеринга layout
// ------------------------------------------------------------
function render() {
  term.clear();

  const width = term.width;
  const height = term.height;

  const headerHeight = 3;
  const footerHeight = 3;
  const leftbarWidth = 34;

  const rightbarWidth = Math.floor(
    ((width - leftbarWidth) * RIGHTBAR_WIDTH_PERCENT) / 100
  );
  const contentWidth = width - leftbarWidth - rightbarWidth;

  const headerBottom = headerHeight;
  const footerTop = height - footerHeight + 1;
  const leftbarTop = headerBottom + 1;
  const leftbarBottom = height - footerHeight;

  // ----------------------------
  // HEADER
  // ----------------------------
  term.moveTo(1, 1);
  term.white("┌" + "─".repeat(width - 2) + "┐");
  term.moveTo(1, 2);
  term.white("│");
  term.moveTo(width, 2);
  term.white("│");
  term.moveTo(4, 2);
  term.bold.white(" DTrader Crypto UI ");
  term.moveTo(1, 3);
  term.white("└" + "─".repeat(width - 2) + "┘");

  // ----------------------------
  // FOOTER (командная строка)
  // ----------------------------
  term.moveTo(1, footerTop);
  term.white("┌" + "─".repeat(width - 2) + "┐");
  term.moveTo(1, footerTop + 1);
  term.white("│");
  term.moveTo(width, footerTop + 1);
  term.white("│");
  // Оранжевый треугольник-промпт
  term.moveTo(4, footerTop + 1);
  term.colorRgb(255, 165, 0)("▶");
  term.moveTo(1, footerTop + 2);
  term.white("└" + "─".repeat(width - 2) + "┘");

  // ----------------------------
  // LEFTBAR
  // ----------------------------
  for (let y = leftbarTop; y <= leftbarBottom; y++) {
    term.moveTo(1, y).white("│");
    term.moveTo(leftbarWidth, y).white("│");
  }

  // Углы соединения leftbar с header/footer
  term.moveTo(1, headerBottom).white("├");
  term.moveTo(leftbarWidth, headerBottom).white("┬");
  term.moveTo(1, footerTop).white("├");
  term.moveTo(leftbarWidth, footerTop).white("┴");

  // ----------------------------
  // RIGHTBAR
  // ----------------------------
  const rightbarStartX = leftbarWidth + contentWidth + 1;
  for (let y = leftbarTop; y <= leftbarBottom; y++) {
    term.moveTo(rightbarStartX, y).white("│");
    term.moveTo(width, y).white("│");
  }

  // Углы соединения rightbar с header/footer
  term.moveTo(rightbarStartX, headerBottom).white("┬");
  term.moveTo(width, headerBottom).white("┤");
  term.moveTo(rightbarStartX, footerTop).white("┴");
  term.moveTo(width, footerTop).white("┤");

  // ----------------------------
  // CONTENT (без границ)
  // ----------------------------
  term.moveTo(leftbarWidth + 2, headerBottom + 2);
  term.white("📊 Контентная зона...");
}

// ------------------------------------------------------------
// Экспортируемые функции
// ------------------------------------------------------------
export function drawLayout() {
  render();
}

let resizeTimer = null;
export function enableAutoResize() {
  process.stdout.on("resize", () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => render(), 100);
  });
}
