export class Thread {

  static MIN_PRIORITY = 0;

  static MAX_PRIORITY = 100;

  name: string
  priority: number 

  constructor(
    name: string,
  ) {
    this.name = name || "noname";
    this.priority = (Thread.MAX_PRIORITY + Thread.MIN_PRIORITY) >> 1;
  }

  setName(name: string) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  setPriority = function (priority) {
    this.priority = priority;
  }

  getPriority = function () {
    return this.priority;
  }

}

