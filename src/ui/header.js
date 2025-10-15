/**
 * src/ui/header.js
 *
 * Рисует только внутреннее содержимое заголовка (строка headerY+1).
 * Углы / горизонтальные рамки рисует layout.js.
 *
 * drawHeader(term, x, y, width, botName, botVersion, serverConnected, exchangeConnected, pulse, pingMs)
 *
 */

export function drawHeader(term, x, y, width, botName, botVersion, serverConnected, exchangeConnected, pulse, pingMs) {
  term.bgBlack();

  // Левая подпись
  const leftText = `${botName} ${botVersion}`;
  term.moveTo(x + 2, y + 1);
  term.white(leftText);

  // Центр — текущая дата/время
  const centerText = new Date().toLocaleString();
  const cx = Math.max( Math.floor((width - centerText.length) / 2), x + leftText.length + 3 );
  term.moveTo(cx, y + 1);
  term.white(centerText);

  // Правая часть — индикаторы и ping. Выводим цветные символы отдельными вызовами.
  // Сначала составляем ПЛЕЙН-строку для вычисления позиции (без ANSI)
  const srvSym = pulse ? "●" : "○";
  const exSym = pulse ? "●" : "○";
  const pingStr = `${pingMs}ms`;
  const rightPlain = `Server ${srvSym}  Exchange ${exSym}  Ping ${pingStr}`;
  const rightLen = rightPlain.length;

  // Вычисляем старт правого блока так, чтобы не пересекать центр/лево
  const rightStart = Math.max(x + 2 + leftText.length + 2, x + width - rightLen - 2);
  term.moveTo(rightStart, y + 1);

  // Печатаем "Server "
  term.white("Server ");

  // печатаем цветной символ сервера
  if (serverConnected) term.green(srvSym);
  else term.red(srvSym);

  term.white("  Exchange ");
  if (exchangeConnected) term.green(exSym);
  else term.red(exSym);

  term.white("  Ping ");
  term.colorRgb(255,165,0)(String(pingStr)); // оранжевый ping

  // Правый вертикальный рамочный символ рисуется в layout, не здесь.
}
