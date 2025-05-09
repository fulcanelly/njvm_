export class Object {
    private _hashCode: number | null;

    constructor() {
        this._hashCode = null;
    }

    static getClassName(): string {
        return "java/lang/Object";
    }

    "<init>"(): Object {
        return this;
    };

    toString(): string {
        return `${Object.getClassName()}@${this.hashCode().toString(16)}`;
    }

    hashCode(): number {
        if (!this._hashCode) {
            this._hashCode = Math.floor(Math.random() * 0xffffffff);
        }
        return this._hashCode;
    }

    equals(obj: any): boolean {
        return this === obj;
    }

    clone(): { [key: string]: any } {
        const o: { [key: string]: any } = {};
        for (const name in this) {
            if (Object.prototype.hasOwnProperty.call(this, name)) {
                o[name] = this[name];
            }
        }
        return o;
    }
}

