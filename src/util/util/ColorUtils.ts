export class RgbValue {
    r: number;
    g: number;
    b: number;
    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    public asHex(withSigil: boolean = true) {
        return `${withSigil ? "#" : ""}${this.r.toString(16).toUpperCase()}${this.g.toString(16).toUpperCase()}${this.b.toString(16).toUpperCase()}`;
    }

    public asAnsiEscapeSequence() {
        return `\x1b[38;2;${this.r};${this.g};${this.b}m`;
    }
}

export class ColorUtils {
    public static cnv8To24(val: number): RgbValue {
        return new RgbValue((val >> 5) * 32, ((val & 28) >> 2) * 32, (val & 3) * 64);
    }
}
