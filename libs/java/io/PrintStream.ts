export class PrintStream {
    constructor() {
        if (!(this instanceof PrintStream)) {
            return new PrintStream();
        }
    }

    static getClassName(): string {
        return "java/io/PrintStream";
    }

    print(...args: any[]): void {
        console.log(...args);
    }

    println(...args: any[]): void {
        console.log(...args, "\n");
    }

    format(fmt: string, ...args: any[]): void {
        console.log(fmt, ...args);
    }
}

