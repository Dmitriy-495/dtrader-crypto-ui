/**
 * src/layout.js
 *
 * Центральный рендер: один источник истины для каркаса (углы, соединители, внешние рамки).
 * Набор задач:
 *  - вычислять сетку строго один раз перед отрисовкой;
 *  - рисовать верхнюю / нижнюю рамки с углами ┌ ┬ ┐ и └ ┴ ┘;
 *  - рисовать вертикальные разделители между панелями;
 *  - вызывать header/left/content/right/footer (они рисуют только внутренний контент, без углов);
 *  - корректно обрабатывать resize и Ctrl+C.
 *
 * Комментарии:
 *  - header теперь не рисует углы/горизонтальные рамки, только центральный текст и индикаторы.
 *  - footer рисует только внутреннюю строку с промптом; углы/границы рисуются здесь.
 */

import pkg from "terminal-kit";
const { terminal: term } = pkg;

import dotenv from "dotenv";
dotenv.config();

import { drawHeader } from "./ui/header.js";
import { drawLeftBar } from "./ui/leftbar.js";
import { drawRightBar } from "./ui/rightbar.js";
import { drawContent, appendContentLine } from "./ui/content.js";
import { drawFooter } from "./ui/footer.js";

/* ------------- конфигурация ------------- */
const LEFTBAR_PCT = Math.max(
  10,
  Math.min(45, parseInt(process.env.LEFTBAR_WIDTH || "25"))
);
const RIGHTBAR_PCT = Math.max(
  10,
  Math.min(45, parseInt(process.env.RIGHTBAR_WIDTH || "25"))
);
const PING_INTERVAL = Math.max(1, parseInt(process.env.PING_INTERVAL || "5"));
const MAX_HISTORY = Math.max(100, parseInt(process.env.MAX_HISTORY || "1000"));
const BOT_NAME = process.env.BOT_NAME || "dtrader-crypto-ui";
const BOT_VERSION = process.env.BOT_VERSION || "v2.5";

/* ------------- состояние ------------- */
const state = {
  pingMs: 0,
  serverConnected: false,
  exchangeConnected: false,
  pulse: false,
  history: [],
  scrollOffset: 0,
  promptBuffer: "",
};

/* ------------- инициализация терминала ------------- */
term.clear();
term.bgBlack();
term.hideCursor();
term.grabInput({ mouse: "button" });

term.on("key", (name) => {
  // Ctrl+C
  if (name === "CTRL_C") {
    safeExit();
  }

  // Навигация по истории / прокрутка
  if (name === "UP") {
    scrollUp(1);
    renderAll();
    return;
  }
  if (name === "DOWN") {
    scrollDown(1);
    renderAll();
    return;
  }
  if (name === "PAGE_UP") {
    pageUp();
    renderAll();
    return;
  }
  if (name === "PAGE_DOWN") {
    pageDown();
    renderAll();
    return;
  }

  // Ввод (символы / Enter / Backspace)
  if (name === "ENTER") {
    handleEnter();
    return;
  }
  if (name === "BACKSPACE") {
    state.promptBuffer = state.promptBuffer.slice(0, -1);
    renderAll();
    return;
  }
  if (typeof name === "string" && name.length === 1) {
    state.promptBuffer += name;
    renderAll();
    return;
  }
});

/* ------------- layout computations ------------- */
function computeLayout() {
  const W = term.width;
  const H = term.height;

  const headerH = 3;
  const footerH = 3;
  const usableH = Math.max(6, H - headerH - footerH); // минимум по высоте

  const leftW = Math.max(12, Math.floor((W * LEFTBAR_PCT) / 100));
  const rightW = Math.max(12, Math.floor((W * RIGHTBAR_PCT) / 100));
  const contentW = Math.max(10, W - leftW - rightW - 2); // -2 для внутренних разделителей

  return {
    W,
    H,
    headerH,
    footerH,
    usableH,
    leftW,
    rightW,
    contentW,
    headerY: 1,
    leftX: 1,
    leftY: 1 + headerH,
    contentX: 1 + leftW + 1, // +1 разделитель
    contentY: 1 + headerH,
    rightX: 1 + leftW + 1 + contentW + 1,
    rightY: 1 + headerH,
    footerY: 1 + headerH + usableH,
  };
}

/* ------------- отрисовка рамок (единственный источник углов) ------------- */
function drawFrame(layout) {
  const { W, headerY, leftW, contentW, rightW, footerY } = layout;

  // Верхняя граница: ┌────┬───────┬────┐
  term.moveTo(1, headerY);
  const topLeft = "┌";
  const topMid = "┬";
  const topRight = "┐";
  const leftTopLen = Math.max(2, leftW - 2);
  const rightTopLen = Math.max(2, rightW - 2);
  term.white(
    topLeft +
      "─".repeat(leftTopLen) +
      topMid +
      "─".repeat(contentW) +
      topMid +
      "─".repeat(rightTopLen) +
      topRight
  );

  // Вертикальные разделители: от строки header+1 до footer-1
  const sepTop = headerY + 1;
  const sepBottom = footerY - 1;
  const sep1X = 1 + leftW;
  const sep2X = 1 + leftW + 1 + contentW;
  for (let yy = sepTop; yy <= sepBottom; yy++) {
    term.moveTo(sep1X, yy).white("│");
    term.moveTo(sep2X, yy).white("│");
  }

  // Нижняя граница: └────┴───────┴────┘
  term.moveTo(1, footerY);
  const bottomLeft = "└";
  const bottomMid = "┴";
  const bottomRight = "┘";
  term.white(
    bottomLeft +
      "─".repeat(leftTopLen) +
      bottomMid +
      "─".repeat(contentW) +
      bottomMid +
      "─".repeat(rightTopLen) +
      bottomRight
  );
}

/* ------------- рендер всех секций ------------- */
function renderAll() {
  const L = computeLayout();
  term.clear();
  term.bgBlack();

  // единый каркас (углы/разделители)
  drawFrame(L);

  // Header: НЕ рисует углы — только контент в середине строки headerY+1
  drawHeader(
    term,
    1,
    L.headerY,
    L.W,
    BOT_NAME,
    BOT_VERSION,
    state.serverConnected,
    state.exchangeConnected,
    state.pulse,
    state.pingMs
  );

  // LeftBar: рисует внутреннее содержимое и вертикальные границы в пределах своей области
  drawLeftBar(term, L.leftX, L.leftY, L.leftW, L.usableH);

  // Content: x = leftX + leftW + 1 (с учётом разделителя), ширина = contentW
  drawContent(
    term,
    1 + L.leftW + 1,
    L.contentY,
    L.contentW,
    L.usableH,
    state.history,
    state.scrollOffset
  );

  // RightBar: правая панель
  drawRightBar(
    term,
    1 + L.leftW + 1 + L.contentW + 1,
    L.rightY,
    L.rightW,
    L.usableH,
    { balances: { USDT: 1234.56 }, positions: [] }
  );

  // Footer: footerY — верхняя линия рамки уже нарисована; footer рисует только внутреннюю строку и нижнюю рамку (нижняя рамка уже была нарисована)
  drawFooter(term, 1, L.footerY, L.W, L.footerH, state.promptBuffer);

  // Ставим курсор в поле ввода (практически, в правую часть промпта)
  const inputX = 3 + Math.min(state.promptBuffer.length, Math.max(0, L.W - 6));
  term.moveTo(inputX, L.footerY + 1);
}

/* ------------- прокрутка ------------- */
function scrollUp(n = 1) {
  const L = computeLayout();
  const visibleRows = Math.max(1, L.usableH - 2);
  const totalVisual = estimateVisualLines(state.history, L.contentW - 4);
  const maxScroll = Math.max(0, totalVisual - visibleRows);
  state.scrollOffset = Math.min(maxScroll, state.scrollOffset + n);
}
function scrollDown(n = 1) {
  state.scrollOffset = Math.max(0, state.scrollOffset - n);
}
function pageUp() {
  const L = computeLayout();
  scrollUp(Math.max(1, Math.floor(L.usableH / 2)));
}
function pageDown() {
  const L = computeLayout();
  scrollDown(Math.max(1, Math.floor(L.usableH / 2)));
}

/* ------------- ввод / команды ------------- */
function handleEnter() {
  const cmd = state.promptBuffer.trim();
  if (cmd.length > 0) {
    appendContentLine(`[CMD] ${cmd}`, state.history, MAX_HISTORY);
    if (cmd.toLowerCase() === "exit") {
      renderAll();
      setTimeout(safeExitNoRender, 100);
      return;
    }
    if (cmd.toLowerCase() === "test")
      appendContentLine(
        "[INFO] Команда test выполнена",
        state.history,
        MAX_HISTORY
      );
  }
  state.promptBuffer = "";
  state.scrollOffset = 0;
  renderAll();
}

/* ------------- поддерж. функции ------------- */
function appendDemoLine() {
  const samples = [
    "[INFO] Получение данных котировок BTC/USDT",
    "[INFO] Сделка выполнена успешно",
    "[WARNING] Медленный отклик от сервера",
    "[ERROR] Ошибка при получении данных",
    "[INFO] Баланс обновлён",
  ];
  const now = new Date().toLocaleTimeString();
  const msg = samples[Math.floor(Math.random() * samples.length)];
  appendContentLine(`${now} — ${msg}`, state.history, MAX_HISTORY);
}

// грубая оценка числа визуальных строк (wrap) — используется для подсчёта scroll limits
function estimateVisualLines(history, innerWidth) {
  let c = 0;
  for (const item of history) {
    const parts = wrapEstimate(String(item), Math.max(1, innerWidth));
    c += parts.length;
  }
  return c;
}
function wrapEstimate(text, maxWidth) {
  if (maxWidth <= 0) return [text];
  const words = text.split(" ");
  const res = [];
  let cur = "";
  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if ((cur + " " + w).length <= maxWidth) {
      cur = cur + " " + w;
    } else {
      res.push(cur);
      cur = w;
    }
    if (w.length > maxWidth) {
      // break long word
      const splits = [];
      for (let i = 0; i < w.length; i += maxWidth)
        splits.push(w.slice(i, i + maxWidth));
      if (cur) {
        res.push(cur);
        cur = "";
      }
      res.push(...splits);
    }
  }
  if (cur) res.push(cur);
  if (res.length === 0) res.push("");
  return res;
}

/* ------------- safe exit helpers ------------- */
function safeExitNoRender() {
  term.grabInput(false);
  term.hideCursor(false);
  term.clear();
  process.exit(0);
}
function safeExit() {
  appendContentLine("[INFO] Завершение (Ctrl+C)", state.history, MAX_HISTORY);
  renderAll();
  setTimeout(safeExitNoRender, 80);
}

/* ------------- циклы симуляции ------------- */
setInterval(() => {
  // обновляем состояние соединений и ping
  state.serverConnected = Math.random() > 0.15;
  state.exchangeConnected = Math.random() > 0.25;
  state.pulse = !state.pulse;
  state.pingMs = Math.floor(10 + Math.random() * 300);
  renderAll();
}, 600); // пульс и перерисовка

setInterval(() => {
  appendDemoLine();
  renderAll();
}, PING_INTERVAL * 1000);

/* ------------- запустить первый рендер ------------- */
renderAll();

/* ------------- экспорт ------------- */
export default { renderAll, state };
