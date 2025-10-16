import { eventBus } from "./core/eventBus.js";
import "./ui/layout.js";

console.clear();
console.log("[CORE] Ядро DTrader запущено...");

// Пример асинхронного "цикла работы ядра"
async function mainLoop() {
  let counter = 0;

  while (true) {
    counter++;
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Пример отправки данных интерфейсу
    await eventBus.emitAsync("ui:update", {
      message: `[CORE] Обновление #${counter}`,
    });
  }
}

mainLoop().catch(console.error);
