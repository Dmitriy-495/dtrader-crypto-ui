export default function drawHeader(
  term,
  { BOT_NAME, BOT_VERSION, width, state }
) {
  const now = new Date().toLocaleString();
  const title = `${BOT_NAME} v${BOT_VERSION}`;
  const statusRight = `SERVER: ${state.connection} | EXCHANGE: ${
    state.exchange
  } | PING: ${state.ping || "---"}ms`;

  // первая строка — рамка
  term.moveTo(1, 1).white("─".repeat(width));

  // вторая строка — заголовок
  term.moveTo(2, 2).green.bold(title);
  term.moveTo(Math.floor(width / 2 - now.length / 2), 2).green(now);
  term.moveTo(width - statusRight.length - 2, 2).green(statusRight);

  // нижняя рамка
  term.moveTo(1, 3).white("─".repeat(width));
}
