/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/

// var util = require("util");

export const LEVELS = {
  DEBUG: 1 << 0,
  ERROR: 1 << 1,
  INFO: 1 << 2,
  WARM: 1 << 3,


  check: function (levels: number, level: number) {
    return (levels & level) === level;
  }
};

export class Logger {
  levels: number


  setLogLevel(levels: number) {
    this.levels = levels;
  }

  debug(msg: string) {
    if (LEVELS.check(this.levels, LEVELS.DEBUG)) {
      console.debug(msg);
    }
  }

  error(msg: string) {
    if (LEVELS.check(this.levels, LEVELS.ERROR)) {
      console.error(msg);
    }
  }

  info(msg: string) {
    if (LEVELS.check(this.levels, LEVELS.INFO)) {
      console.log("INFO: " + msg);
    }
  }

  warn(msg: string) {
    if (LEVELS.check(this.levels, LEVELS.WARM)) {
      console.warn("WARN: " + msg);
    }
  }
}

