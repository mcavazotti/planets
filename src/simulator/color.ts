export class Color {
    private _r!: number;
    private _g!: number;
    private _b!: number;
    private _a!: number;
    private _hex!: string;

    get r(): number { return this._r }
    set r(c: number) { this._r = c; this.rgbaToHex(); }
    get g(): number { return this._g }
    set g(c: number) { this._g = c; this.rgbaToHex(); }
    get b(): number { return this._b }
    set b(c: number) { this._b = c; this.rgbaToHex(); }
    get a(): number { return this._a }
    set a(c: number) { this._a = c; this.rgbaToHex(); }
    get hex(): string { return this._hex }
    set hex(c: string) { this._hex = c; this.hexToRGBA(); }

    constructor(hex: string);
    constructor(r: number, g: number, b: number);
    constructor(r: number | string, g?: number, b?: number,a?: number) {
        if (typeof r == "string") {
            this._hex = r;
            this.hexToRGBA();
        }
        else {
            this._r = r;
            this._g = g!;
            this._b = b!;
            if(typeof a !== "undefined") {
                this._a = a;
            }else {
                this._a = 255;
            }
            this.rgbaToHex();
        }
    }

    // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    private hexToRGBA() {
        var result = /^#?(([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?|([a-f\d])([a-f\d])([a-f\d]))$/i.exec(this._hex);
        if (!result) throw Error("Failed to parse Hex string: "+ this._hex);

        this._r = parseInt(result[2], 16);
        this._g = parseInt(result[3], 16);
        this._b = parseInt(result[4], 16);
        if(result[5]) {
            this._a = parseInt(result[5], 16);
        } else {
            this._a = 255;
        }
    }

    private rgbaToHex() {
        this._hex = `#${this.componentToHex(this._r)}${this.componentToHex(this._g)}${this.componentToHex(this._b)}${this.componentToHex(this._a)}`;
    }

    private componentToHex(c: number) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
}