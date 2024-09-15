import { Thread } from "./thread";


export class Threads {
  constructor(
    readonly empty: number[] = [],
    readonly threads: (null | Thread)[] = [],
  ) { }

  add(thread: Thread): number {
    if (this.empty.length > 0) {
      const pid = this.empty.pop()!
      this.threads[pid] = thread;
      return pid;
    } else {
      return this.threads.push(thread) - 1;
    }
  }


  remove(pid: number) {
    this.empty.push(pid);
    this.threads[pid] = null;
  }


  count() {
    return this.threads.length - this.empty.length;
  }


  getThread(pid: number) {
    return this.threads[pid];
  }

}
