/**
 * src/core/eventBus.js
 * Простейшая реализация Event Bus на базе Node.js EventEmitter
 * Позволяет обмениваться событиями между ядром (main.js) и layout (UI)
 */

import { EventEmitter } from "events";

// Создаём и экспортируем один общий экземпляр EventEmitter
export const eventBus = new EventEmitter();

// Для отладки — можно включить логирование всех событий
// eventBus.on("newListener", (event) => console.log(`[EventBus] new listener: ${event}`));

/**
 * Пример использования:
 *
 * // В ядре:
 * import { eventBus } from "./core/eventBus.js";
 * eventBus.emit("ui:update", { message: "Connected to server" });
 *
 * // В layout:
 * eventBus.on("ui:update", (data) => {
 *   renderLayoutWithData(data);
 * });
 */
