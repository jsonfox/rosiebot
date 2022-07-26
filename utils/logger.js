const chalk = require('chalk');
const moment = require('moment');

// Define chalk styles for log prefixes
const prefix = {
  log: chalk.green('LOG'),
  warn: chalk.black.bgYellow('WARN'),
  error: chalk.black.bgRed('ERR'),
  cmd: chalk.inverse('CMD'),
  ready: chalk.black.bgGreen('RDY')
}

exports.log = (msg, type = 'log') => {
   // Throw error if an invalid log type is used
  const err = new TypeError('Invalid log type used');
  if (typeof type !== 'string' || !prefix[type]) throw err
  // Console log as Timestamp Prefix Message
  type = type.toLowerCase();
  return console.log(moment().format('MM/DD/YY HH:mm:ss'), prefix[type], msg);
}

// Create aliases for log types
exports.warn = (...args) => this.log(...args, 'warn');
exports.error = (...args) => this.log(...args, 'error');
exports.cmd = (...args) => this.log(...args, 'cmd');
exports.ready = (...args) => this.log(...args, 'ready');
