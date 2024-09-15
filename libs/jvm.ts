

import { CLASSES, LOG, SCHEDULER, THREADS } from "./global";


// import { EventEmitter } from "events"


import { Thread } from "./thread";

export class JVM  {
  entryPoint: {
    className: string | null,
    methodName: string,
  }

  constructor() {
    // super();
    THREADS.add(new Thread("main"));
    this.entryPoint = {
      className: null,
      methodName: "main"
    };

  }

  setEntryPointClassName(className) {
    this.entryPoint.className = className;
  }

  setEntryPointMethodName(methodName) {
    this.entryPoint.methodName = methodName;
  }

  setLogLevel(level: number) {
    (LOG as any).setLogLevel(level);
  }

  loadClassBytes(data) {
    CLASSES.loadClassBytes(data)
  }

  run(args: any[]) {
    var self = this;

    CLASSES.clinit();

    var entryPoint = CLASSES.getEntryPoint(this.entryPoint.className!, this.entryPoint.methodName);
    if (!entryPoint) {
      throw new Error("Entry point method is not found.");
    }

    entryPoint.run(args, function (code) {
      var exit = function () {
        SCHEDULER.tick(0, function () {
          if (THREADS.count() === 1) {
            THREADS.remove(0);
            // self.emit("exit", code);
          } else {
            exit();
          }
        });
      };
      exit();
    });
  }


}


/*
 
JVM.prototype.loadClassFiles = function (dirName) {
var self = this;
CLASSES.addPath(dirName);
var files = fs.readdirSync(dirName);
files.forEach(function (file) {
  var p = util.format("%s/%s", dirName, file);
  var stat = fs.statSync(p);
  if (stat.isFile()) {
    if (path.extname(file) === ".class") {
      self.loadClassFile(p);
    }
  } else if (stat.isDirectory()) {
    self.loadClassFiles(p);
  }
});
}
*/




