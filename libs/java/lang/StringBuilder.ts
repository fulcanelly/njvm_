import { Object } from "./Object"; // Adjust the import path and name according to the actual "Object" implementation.

export class StringBuilder extends Object {
    private _buf: string;

    constructor(p?: number | string) {
        super();
        if (typeof p === "number") {
            this._buf = ' '.repeat(p);
        } else {
            this._buf = p || "";
        }
    }

    static getClassName(): string {
        return "java/lang/StringBuilder";
    }

    "<init>"(...args: any[]): StringBuilder {
        for (const arg of args) {
            this._buf += arg.toString();
        }
        return this;
    }

    append(...args: any[]): StringBuilder {
        for (const arg of args) {
            this._buf += arg.toString();
        }
        return this;
    }

    toString(): string {
        return this._buf;
    }
}

