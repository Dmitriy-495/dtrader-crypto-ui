export function drawRightBar(term, x, y, width, height) {
  term.moveTo(x + 1, y + 1);
  term.white("RIGHTBAR");
}
