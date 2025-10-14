import termkit from "terminal-kit";
import dotenv from "dotenv";
import WebSocket from "ws";
import drawHeader from "./ui/header.js";
import drawLeftBar from "./ui/leftbar.js";
import drawRightBar from "./ui/rightbar.js";
import drawContent from "./ui/content.js";
import drawFooter from "./ui/footer.js";

dotenv.config();
const term = termkit.terminal;

const BOT_NAME = process.env.BOT_NAME || "dtrader-crypto-ui";
const BOT_VERSION = process.env.BOT_VERSION || "2.0.0";
const LEFTBAR_WIDTH_PERCENT = Number(process.env.LEFTBAR_WIDTH_PERCENT) || 30;
const RIGHTBAR_WIDTH_PERCENT = Number(process.env.RIGHTBAR_WIDTH_PERCENT) || 30;
const USE_SSL = process.env.USE_SSL === "true";
const WS_URL = `${USE_SSL ? "wss" : "ws"}://${process.env.SERVER_HOST}:${
  process.env.SERVER_PORT
}`;
const REFRESH_INTERVAL = Number(process.env.REFRESH_INTERVAL) || 1000;

const state = {
  connection: "OFFLINE",
  exchange: "DISCONNECTED",
  ping: null,
  balances: { USDT: 0, BTC: 0 },
  positions: [],
  logs: ["[INIT] Интерфейс инициализирован."],
};

// безопасный выход
function safeExit() {
  term.moveTo(1, term.height);
  term.white("\nВыход из приложения...\n");
  term.processExit(0);
}
term.on("key", (name) => {
  if (name === "CTRL_C") safeExit();
});

let socket;
function connectWebSocket() {
  socket = new WebSocket(WS_URL);
  state.logs.push(`[INFO] Подключение к серверу: ${WS_URL}`);

  socket.on("open", () => {
    state.connection = "CONNECTED";
    state.logs.push("[OK] Соединение установлено.");
    render();
  });

  socket.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      handleMessage(data);
    } catch {
      state.logs.push("[WARNING] Невозможно разобрать сообщение.");
    }
  });

  socket.on("close", () => {
    state.connection = "DISCONNECTED";
    state.logs.push(
      "[WARNING] Соединение закрыто. Переподключение через 5 секунд..."
    );
    render();
    setTimeout(connectWebSocket, 5000);
  });

  socket.on("error", (err) => {
    state.logs.push(`[ERROR] Ошибка WebSocket: ${err.message}`);
  });
}

function handleMessage(data) {
  switch (data.type) {
    case "ping":
      socket.send(JSON.stringify({ type: "pong" }));
      state.ping = data.latency || 0;
      break;
    case "exchange_status":
      state.exchange = data.status === "ok" ? "OK" : "FAIL";
      state.ping = data.ping || 0;
      break;
    case "account":
      state.balances = data.balances || state.balances;
      state.positions = data.positions || state.positions;
      break;
    case "log":
      state.logs.push(data.message);
      break;
    default:
      state.logs.push(`[INFO] Неизвестный тип: ${data.type}`);
  }
  render();
}

function render() {
  term.bgBlack.clear();
  const { width, height } = term;
  const leftBarWidth = Math.floor((width * LEFTBAR_WIDTH_PERCENT) / 100);
  const rightBarWidth = Math.floor((width * RIGHTBAR_WIDTH_PERCENT) / 100);
  const contentWidth = width - leftBarWidth - rightBarWidth;

  drawHeader(term, { BOT_NAME, BOT_VERSION, width, state });
  drawLeftBar(term, { x: 1, width: leftBarWidth, height, state });
  drawRightBar(term, {
    x: leftBarWidth + contentWidth + 1,
    width: rightBarWidth,
    height,
    state,
  });
  drawContent(term, {
    x: leftBarWidth + 1,
    width: contentWidth,
    height,
    state,
  });
  drawFooter(term, { y: height, width, onCommand });
}

function onCommand(cmd) {
  if (!cmd) return;
  if (cmd.trim().toLowerCase() === "exit") safeExit();
  else state.logs.push(`[CMD] ${cmd}`);
  render();
}

connectWebSocket();
setInterval(render, REFRESH_INTERVAL);
render();
