export default function drawFooter(term, { y, width, onCommand }) {
  term.moveTo(1, y - 1);
  term.white("─".repeat(width));
  term.moveTo(1, y);
  term.bgBlack.green("Введите команду: ");

  term.inputField({ cancelable: true }, (error, input) => {
    if (input) onCommand(input);
  });
}
