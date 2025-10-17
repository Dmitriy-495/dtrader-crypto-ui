import 'dotenv/config';
import terminalKit from 'terminal-kit';
import { drawLayout, enableAutoResize } from './ui/layout.js';

const term = terminalKit.terminal;

async function main() {
  console.clear();

  // Первичная отрисовка интерфейса
  drawLayout();

  // Реакция на изменение размеров
  enableAutoResize();

  // Очистка при выходе
  process.on('SIGINT', () => {
    term.clear();
    term.hideCursor(false);
    term.styleReset();
    process.exit(0);
  });

  // Бесконечный цикл ожидания данных
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main().catch(err => {
  console.error('Ошибка при запуске DTrader Crypto UI:', err);
});
