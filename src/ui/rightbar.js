export default function drawRightBar(term, { x, width, height, state }) {
  for (let y = 4; y < height - 2; y++) {
    term.moveTo(x, y);
    term.bgBlack(" ".repeat(width));
  }

  term.moveTo(x + 1, 4).green.bold("💰 Балансы");
  let line = 6;
  for (const [asset, amount] of Object.entries(state.balances)) {
    term.moveTo(x + 1, line++).green(`${asset}: ${amount}`);
  }

  line += 1;
  term.moveTo(x + 1, line++).green.bold("📈 Позиции");
  if (state.positions.length === 0) {
    term.moveTo(x + 1, line++).green("Нет открытых позиций");
  } else {
    state.positions.forEach((pos) => {
      term.moveTo(x + 1, line++);
      term.green(`${pos.symbol} | ${pos.side} | ${pos.pnl}%`);
    });
  }

  for (let y = 4; y < height - 2; y++) {
    term.moveTo(x - 1, y).white("|");
  }
}
