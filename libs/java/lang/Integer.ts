/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/


export class Integer {

  static getClassName(): string {
    return "java/lang/Integer";
  }

  static parseInt(...args: Parameters<typeof parseInt>): number {
    return parseInt(...args);
  }

  static valueOf(...args: any[]): string {
    if (args.length === 0) return "0";
    return args[0].toString();
  }
}

export default Integer;
