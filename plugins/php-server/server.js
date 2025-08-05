
/**
 * @fileoverview Скрипт для запуску локального PHP-сервера з використанням бібліотеки node-php-server.
 * Виконує ініціалізацію сервера, визначає шлях до PHP-бінарного файлу залежно від операційної системи,
 * налаштовує змінні середовища та обробляє коректне завершення роботи сервера.
 * 
 * @requires node-php-server - Бібліотека для створення PHP-сервера в середовищі Node.js.
 * @requires process - Вбудований модуль Node.js для роботи з системними процесами.
 */

/**
 * @constant {Object} pkg - Імпортований модуль node-php-server, який надає методи для створення та управління PHP-сервером.
 * @property {Function} createServer - Метод для створення PHP-сервера.
 * @property {Function} close - Метод для завершення роботи сервера.
 */
import pkg from 'node-php-server'
import { kill } from 'process'
const { createServer, close } = pkg

import templateCfg from '../../template.config.js'


/**
 * @constant {boolean} isWindows - Визначає, чи працює скрипт у Windows.
 */
const isWindows = process.platform === 'win32'

/**
 * @constant {boolean} isMacOS - Визначає, чи працює скрипт у macOS.
 */
const isMacOS = process.platform === 'darwin'

/**
 * @constant {boolean} isLinux - Визначає, чи працює скрипт у Linux.
 */
const isLinux = process.platform === 'linux'

/**
 * @constant {string} phpPath - Шлях до бінарного файлу PHP, який залежить від операційної системи.
 * @throws {Error} Якщо платформа не підтримується (немає визначеного шляху до PHP).
 */
let phpPath = ''
if (isWindows) {
   phpPath = 'C:\\php\\php.exe'
} else if (isMacOS) {
   phpPath = '/usr/local/bin/php'
} else if (isLinux) {
   phpPath = '/usr/bin/php'
} else {
   throw new Error('Unsupported platform')
}

/**
 * @constant {string} pathSeparator - Роздільник шляху в змінній PATH, залежить від ОС (';' для Windows, ':' для інших).
 */
const pathSeparator = isWindows ? ';' : ':'

/**
 * Налаштування змінної середовища PATH для забезпечення доступу до PHP.
 * Додає директорію, яка містить PHP-бінарний файл, до системного PATH.
 */
process.env.PATH = `${process.env.PATH}${pathSeparator}${phpPath.split(isWindows ? '\\' : '/').slice(0, -1).join(isWindows ? '\\' : '/')}`

/**
 * Запускає PHP-сервер із заданими параметрами.
 * @param {Object} config - Конфігурація сервера.
 * @param {number} config.port - Порт, на якому буде запущено сервер (за замовчуванням 8000).
 * @param {string} config.hostname - Ім'я хоста для сервера (за замовчуванням '127.0.0.1').
 * @param {string} config.base - Базова директорія для PHP-файлів (за замовчуванням './php-server').
 * @param {boolean} config.keepalive - Увімкнення або вимкнення постійного з'єднання (true/false).
 * @param {boolean} config.open - Чи відкривати браузер після запуску (true/false).
 * @param {string} config.bin - Шлях до бінарного файлу PHP.
 * @param {string} config.router - Шлях до PHP-роутера (за замовчуванням './server.php').
 */
createServer({
   port: templateCfg.serverProxy.port,
   hostname: templateCfg.serverProxy.domain,
   base: './plugins/php-server',
   keepalive: true,
   open: false,
   bin: phpPath,
   router: './server.php',
})

/**
 * Виводить повідомлення про запуск сервера в консоль.
 */
console.log(`PHP-server start: http://${templateCfg.serverProxy.domain}:${templateCfg.serverProxy.port}`)

/**
 * Обробник події SIGINT (наприклад, при натисканні Ctrl+C).
 * Виконує коректне завершення роботи сервера, закриває процес і виводить повідомлення в консоль.
 * @event SIGINT
 */
process.on('SIGINT', () => {
   console.log(`Stop: ${process.pid}`)
   close()
   kill(process.pid)
   process.exit(0)
})