/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/

import { THREADS } from './global';

const MODE = {
  NORMAL: 0,
  SYNC: 1,
  YIELD: 2
};




export class Scheduler {
  _ticks: number = 0
  _mode: (typeof MODE)[keyof typeof MODE] = MODE.NORMAL;

  tick(pid: number, fn: Function) {
    switch (this._mode) {
      case MODE.SYNC:
        fn();
        break;
      case MODE.YIELD:
        this._mode = MODE.NORMAL;
        this._ticks = 0;
        // (setImmediate || process.nextTick)(fn);
        setTimeout(fn)
        break;
      case MODE.NORMAL:
        if (++this._ticks > THREADS.getThread(pid)!.getPriority()) {
          this._ticks = 0;
          // (setImmediate || process.nextTick)(fn);
          setTimeout(fn)
        } else {
          fn();
        }
        break;
    }
  }

  yield() {
    this._mode = MODE.YIELD;
  }

  sync(fn: Function) {
    this._mode = MODE.SYNC;
    fn();
    this._mode = MODE.NORMAL;
  }

}
