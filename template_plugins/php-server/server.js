import pkg from 'node-php-server'
import { kill } from 'process'
import { spawnSync } from 'child_process'
import templateCfg from '../../template.config.js'
import { logger } from '../html-composer/utils/logger.js'

const { createServer, close } = pkg

const localPhpMap = {
   win32: 'bin/win/php.exe',
   darwin: 'bin/mac/php',
   linux: 'bin/lin/php',
}

let phpPath = 'php'
const checkPhp = spawnSync(phpPath, ['-v'], { stdio: 'ignore' })

if (checkPhp.error) {
   phpPath = localPhpMap[process.platform]
   if (!phpPath) throw new Error(`Unsupported platform: ${process.platform}`)
}

const port = templateCfg.PHPserver?.port || 8000
const host = templateCfg.PHPserver?.domain || '127.0.0.1'

createServer({
   port,
   hostname: host,
   base: './plugins/php-server',
   keepalive: true,
   open: false,
   bin: phpPath,
   router: './server.php',
})

logger(`PHP-server`, `PHP-server start: http://${host}:${port}`, 'success')
logger(`PHP-server`, `↳ using PHP binary: ${phpPath}`, 'info')

process.on('SIGINT', () => {
   logger(`PHP-server`, `Stop: ${process.pid}`, 'alarm')
   close()
   kill(process.pid)
   process.exit(0)
})
