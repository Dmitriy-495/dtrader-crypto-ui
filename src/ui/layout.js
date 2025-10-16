/**
 * src/ui/layout.js
 * Надёжный, централизованный layout — рисует все рамки и пересечения.
 *
 * Особенности:
 * - рамки и разделители рисуются ТОЛЬКО здесь;
 * - вычисления координат единообразны и защищены от маленьких размеров;
 * - реакции на resize — с debounce;
 * - вызовы UI-компонентов ВРЕМЕННО закомментированы (см. места для подключения);
 * - корректный graceful exit (grabInput(false), hideCursor(false), clear).
 *
 * Не включает fullscreen/альтернативный буфер — чтобы поведение было предсказуемо.
 */

import pkg from "terminal-kit";
import dotenv from "dotenv";

dotenv.config();
const { terminal: term } = pkg;

// Конфигурация из .env
const LEFTBAR_PERCENT = Math.max(5, Math.min(60, parseInt(process.env.LEFTBAR_WIDTH || "25", 10)));
const RIGHTBAR_PERCENT = Math.max(5, Math.min(60, parseInt(process.env.RIGHTBAR_WIDTH || "25", 10)));

const HEADER_HEIGHT = 3; // 3 строки header
const FOOTER_HEIGHT = 3; // 3 строки footer

// Подготовка терминала
term.clear();
term.grabInput(true); // нужен, чтобы получать resize/key
term.hideCursor();
term.bgBlack();

// Хранение последнего сообщения/состояния от ядра
let lastMessage = "";

// Утилита — безопасная печать строки (защита от слишком маленького окна)
function safeRepeat(ch, n) {
  return n > 0 ? ch.repeat(n) : "";
}

// Отрисовка верхней/средней/нижней линий со разделителями (единственная точка правды)
function drawTopLine(width, leftLen, midLen, rightLen) {
  // ┌left─┬mid─┬right┐
  let line = "┌" + safeRepeat("─", leftLen) + "┬" + safeRepeat("─", midLen) + "┬" + safeRepeat("─", rightLen) + "┐";
  return line;
}
function drawMiddleSep(width, leftLen, midLen, rightLen) {
  // ├left─┼mid─┼right┤
  let line = "├" + safeRepeat("─", leftLen) + "┼" + safeRepeat("─", midLen) + "┼" + safeRepeat("─", rightLen) + "┤";
  return line;
}
function drawBottomLine(width, leftLen, midLen, rightLen) {
  // └left─┴mid─┴right┘
  let line = "└" + safeRepeat("─", leftLen) + "┴" + safeRepeat("─", midLen) + "┴" + safeRepeat("─", rightLen) + "┘";
  return line;
}

// Центральная отрисовка макета
function renderLayout() {
  // Получаем актуальные размеры
  const width = term.width;
  const height = term.height;

  // Защита: минимальный допустимый размер
  const MIN_WIDTH = 40;
  const MIN_HEIGHT = HEADER_HEIGHT + FOOTER_HEIGHT + 4;
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    term.clear();
    term.moveTo(1, 1);
    term.red(`Окно слишком мало: нужно минимум ${MIN_WIDTH}x${MIN_HEIGHT}. Текущий ${width}x${height}`);
    return;
  }

  // Вычисления ширин областей (в символах)
  const leftWidth = Math.max(8, Math.floor((width * LEFTBAR_PERCENT) / 100));       // внутренная ширина left area
  const rightWidth = Math.max(8, Math.floor((width * RIGHTBAR_PERCENT) / 100));     // внутр. ширина right area
  // midWidth = остаток между разделителями; учитываем: 3 вертикальных "колонки" разделителей (по 1 символу) и внешние рамки
  const midWidth = Math.max(10, width - (leftWidth + rightWidth) - 6); // -6: внешние и разделители запас

  // Вычисляем позиции X разделителей:
  // layout structure:
  // column positions (1-based):
  // 1 .. (leftWidth+1) .. sep1 .. (midWidth+?) .. sep2 .. (rightWidth+?) .. width
  // We'll place separators at:
  const leftSepX = 1 + 1 + leftWidth;                // x колонки правой границы left area (after left area)
  const midSepX = leftSepX + 1 + midWidth + 1;       // separator before right area

  // Работаем с экранами
  term.clear();
  term.bgBlack();
  term.white();

  // 1) Верхняя строка: ┌...┬...┬...┐
  const topLine = drawTopLine(width, leftWidth + 1, midWidth + 2, rightWidth + 1); // +паддинги для визуала
  term.moveTo(1, 1);
  term(topLine);

  // 2) Header внутренные строки (включая 2-ю строку для контента header)
  for (let y = 2; y < HEADER_HEIGHT; y++) {
    term.moveTo(1, y);
    // вертикали в местах: 1 (left edge), leftSepX, midSepX, width (right edge)
    // создаём строку: │ (left area fill) │ (mid area fill) │ (right fill) │
    const leftFill = safeRepeat(" ", leftWidth + 1);
    const midFill = safeRepeat(" ", midWidth + 2);
    const rightFill = safeRepeat(" ", rightWidth + 1);
    const row = "│" + leftFill + "│" + midFill + "│" + rightFill + "│";
    term(row);
  }

  // 3) Разделитель под header: ├...┼...┼...┤
  const midLine = drawMiddleSep(width, leftWidth + 1, midWidth + 2, rightWidth + 1);
  term.moveTo(1, HEADER_HEIGHT);
  term(midLine);

  // 4) Body area (от HEADER_HEIGHT+1 до height-FOOTER_HEIGHT-1)
  const bodyTop = HEADER_HEIGHT + 1;
  const bodyBottom = height - FOOTER_HEIGHT - 1;
  for (let y = bodyTop; y <= bodyBottom; y++) {
    term.moveTo(1, y);
    const leftFill = safeRepeat(" ", leftWidth + 1);
    const midFill = safeRepeat(" ", midWidth + 2);
    const rightFill = safeRepeat(" ", rightWidth + 1);
    term("│" + leftFill + "│" + midFill + "│" + rightFill + "│");
  }

  // 5) Разделитель над footer (тот же, что и middle)
  term.moveTo(1, bodyBottom + 1);
  term(midLine);

  // 6) Footer body lines (FOOTER_HEIGHT-1 lines above bottom)
  const footerBodyTop = bodyBottom + 2;
  const footerBodyBottom = height - 1;
  for (let y = footerBodyTop; y <= footerBodyBottom; y++) {
    term.moveTo(1, y);
    const leftFill = safeRepeat(" ", leftWidth + 1);
    const midFill = safeRepeat(" ", midWidth + 2);
    const rightFill = safeRepeat(" ", rightWidth + 1);
    term("│" + leftFill + "│" + midFill + "│" + rightFill + "│");
  }

  // 7) Нижняя строка
  const bottomLine = drawBottomLine(width, leftWidth + 1, midWidth + 2, rightWidth + 1);
  term.moveTo(1, height);
  term(bottomLine);

  // === Временно не вызываем UI-компоненты (временно закомментировано) ===
  // drawHeader(term, ...);   // подключать после проверки сетки
  // drawLeftBar(term, ...);
  // drawContent(term, ...);
  // drawRightBar(term, ...);
  // drawFooter(term, ...);

  // === Дополнительные метки для отладки (чётко в пределах зон) ===
  term.moveTo(3, 2);
  term.green("HEADER");

  // leftlabel
  term.moveTo(3, bodyTop + 1);
  term.cyan("LEFTBAR");

  // content label (расставим в середине mid area, но без центровки)
  term.moveTo( (leftSepX + 2), bodyTop + 1 );
  term.white("CONTENT");

  // right label
  term.moveTo(width - rightWidth - 5, bodyTop + 1);
  term.yellow("RIGHTBAR");

  // footer label and last message from core
  term.moveTo(3, height - 1);
  term.green("FOOTER");

  if (lastMessage) {
    term.moveTo(3, height - 2);
    term.white(`> ${String(lastMessage).slice(0, width - 6)}`);
  }
}

// Debounce wrapper for resize
let resizeTimer = null;
function handleResizeDebounced() {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    renderLayout();
    resizeTimer = null;
  }, 80);
}

// Подписка на resize и клавиши
term.on("resize", handleResizeDebounced);

// Обработка клавиш и graceful exit
function gracefulExit() {
  try {
    term.grabInput(false);
  } catch (e) {}
  try {
    term.hideCursor(false); // показываем курсор
  } catch (e) {}
  try {
    term.clear();
  } catch (e) {}
  process.exit(0);
}
term.on("key", (key) => {
  if (key === "CTRL_C" || key === "q" || key === "ESCAPE") {
    gracefulExit();
  }
});

// EventBus-подписка: если есть core, он может отсылать "ui:update"
import { eventBus } from "../core/eventBus.js";
if (eventBus && eventBus.on) {
  eventBus.on("ui:update", (data) => {
    if (data && data.message) lastMessage = data.message;
    renderLayout();
  });
}

// Первый рендер
renderLayout();
