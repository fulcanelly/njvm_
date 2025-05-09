/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/

export class System {
    constructor() {
        if (!(this instanceof System)) {
            return new System();
        }
    }

    static getClassName(): string {
        return "java/lang/System";
    }

    static exit(): void {
        throw new Error("NEEd EXIT!!<MKMD")
        // process.exit();
    }

    static out = {
        print(...args: any[]): void {
            console.log(...args);
        },
        println(...args: any[]): void {
            console.log(...args);
            console.log("\n");
        },
        format(fmt: string, ...args: any[]): void {
            console.log({ fmt, args })
        }
    };

    static currentTimeMillis(): number {
        return Date.now();
    }
}

export default System;


