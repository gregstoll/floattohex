"use strict";

const BreakdownPhase = Object.freeze({
    RAW_BITS : 0,
    INTERMEDIATE : 1,
    FLOAT_VALUES : 2,
});
// sort of a type
/**
* @typedef {Object} FloatingPointParams
* @property {string} floatType
* @property {string} floatLongDescription
* @property {number} hexDigits
* @property {number} exponentBits
* @property {number} fractionBits
* @property {number} exponentBias
* @property {number} decimalPrecision
*/

/**
 * @type {Map<string, FloatingPointParams>}
 */
let NAME_TO_FLOATING_POINT_PARAM = new Map();
NAME_TO_FLOATING_POINT_PARAM.set("float", 
    {
        floatType: "Float",
        floatLongDescription: "<a href=\"https://en.wikipedia.org/wiki/Single-precision_floating-point_format\" target=\"_blank\">Single-precision</a> floating point",
        hexDigits: 8,
        exponentBits: 8,
        fractionBits: 23,
        exponentBias: 127,
        decimalPrecision: 9
    }
);
NAME_TO_FLOATING_POINT_PARAM.set("double",
    {
        floatType: "Double",
        floatLongDescription: "<a href=\"https://en.wikipedia.org/wiki/Double-precision_floating-point_format\" target=\"_blank\">Double-precision</a> floating point",
        hexDigits: 16,
        exponentBits: 11,
        fractionBits: 52,
        exponentBias: 1023,
        decimalPrecision: 17
    }
);
NAME_TO_FLOATING_POINT_PARAM.set("float16",
    {
        floatType: "Float16",
        floatLongDescription: "<a href=\"https://en.wikipedia.org/wiki/Half-precision_floating-point_format\" target=\"_blank\">Half-precision</a> floating point",
        hexDigits: 4,
        exponentBits: 5,
        fractionBits: 10,
        exponentBias: 15,
        decimalPrecision: 5
    }
);
NAME_TO_FLOATING_POINT_PARAM.set("bfloat16",
    {
        floatType: "bfloat16",
        floatLongDescription: "<a href=\"https://en.wikipedia.org/wiki/Bfloat16_floating-point_format\" target=\"_blank\">Google bfloat16</a> floating point",
        hexDigits: 4,
        exponentBits: 8,
        fractionBits: 7,
        exponentBias: 127,
        decimalPrecision: 3
    }
);

class AppSettings extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        if (this.shadowRoot.childNodes.length) return;
        this.shadowRoot.innerHTML = `
                <div>
                    <label><input id="showDetails" type="checkbox">Show details</label>
                    &nbsp;
                    <label><input id="swapBytes" type="checkbox">Swap to use big-endian</label>
                    &nbsp;
                    <label><input id="uppercaseLetters" type="checkbox">Uppercase letters in hex</label>
                </div>
                `;
        // update() first so this doesn't trigger events, I guess?
        this.update();
        // TODO - do these trigger if these are set programmatically?
        // TODO - oh, should these be using property values?
        this.shadowRoot.getElementById("showDetails").addEventListener("change", () => {
            let value = this.shadowRoot.getElementById("showDetails").checked;
            this.showDetails = value;
            this.dispatchEvent(new CustomEvent("settingChange", {
                detail: {showDetails: value}
            }));
        });
        this.shadowRoot.getElementById("swapBytes").addEventListener("change", () => {
            let value = this.shadowRoot.getElementById("swapBytes").checked;
            this.swapBytes = value;
            this.dispatchEvent(new CustomEvent("settingChange", {
                detail: {swapBytes: value}
            }));
        });
        this.shadowRoot.getElementById("uppercaseLetters").addEventListener("change", () => {
            let value = this.shadowRoot.getElementById("uppercaseLetters").checked;
            this.uppercaseLetters = value;
            this.dispatchEvent(new CustomEvent("settingChange", {
                detail: {uppercaseLetters: value}
            }));
        });
    }

    update() {
        this.shadowRoot.getElementById("showDetails").checked = this.showDetails;
        this.shadowRoot.getElementById("swapBytes").checked = this.swapBytes;
        this.shadowRoot.getElementById("uppercaseLetters").checked = this.uppercaseLetters;
    }

    get showDetails() {
        return !!this.getAttribute("showDetails");
    }
    set showDetails(value) {
        if (value) {
            this.setAttribute("showDetails", "true");
        } else {
            this.removeAttribute("showDetails");
        }
    }
    get swapBytes() {
        return !!this.getAttribute("swapBytes");
    }
    set swapBytes(value) {
        if (value) {
            this.setAttribute("swapBytes", "true");
        } else {
            this.removeAttribute("swapBytes");
        }
    }
    get uppercaseLetters() {
        return !!this.getAttribute("uppercaseLetters");
    }
    set uppercaseLetters(value) {
        if (value) {
            this.setAttribute("uppercaseLetters", "true");
        } else {
            this.removeAttribute("uppercaseLetters");
        }
    }
}
customElements.define("app-settings", AppSettings);

class HexFloatBreakdown extends HTMLElement {
    /**
     * @type FloatingPointParams
     */
    #params;
    constructor() {
        super();
        this.#params = NAME_TO_FLOATING_POINT_PARAM.get(this.getAttribute("floatingPointType"));
        // TODO - listen for "show details", etc.
        this.attachShadow({ mode: 'open' });
    }
    static get observedAttributes() {
        return ["hexvalue", "floatingvalue", "coercedfromfloatingvalue", "multiplier", "showalldetails", "flipendianness", "uppercaseletters"];
    }
    attributeChangedCallback(_name, _oldValue, _newValue) {
        // TODO only if oldValue !== newValue?
        this.update();
    }
    connectedCallback() {
        if (this.shadowRoot.childNodes.length) return;
        let hexDigitsTds = [];
        for (let i = 0; i < this.#params.hexDigits; i++) {
            hexDigitsTds.push(`<td colspan="4" class="hexDigitCollapsed ${this.classNameFromBitIndex(4*i)}"></td>`);
        }

        let bits = this.getBits();
        let binaryDigitsTds = [];
        for (let i = 0; i < bits.length; ++i) {
            binaryDigitsTds.push(`<td class="binaryDigit ${this.classNameFromBitIndex(i)}"></td>`);
        }

        let binaryBreakdownTds = [];
        binaryBreakdownTds.push(`<td class="binaryBreakdown sign ${this.classNameFromBitIndex(0)}"></td>`);
        binaryBreakdownTds.push(`<td class="binaryBreakdown exponent" colSpan=${this.#params.exponentBits}></td>`);
        binaryBreakdownTds.push(`<td class="binaryBreakdown fraction" colSpan=${this.#params.fractionBits}></td>`);

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="index.css">
            <table id="hexFloatTable" class="hexFloat">
                <tbody>
                    <tr><td id="hexTd" colSpan="${this.#params.hexDigits * 4}">{hexValueToUse}{flippedDescription}</td></tr>
                    <tr id="hexDigitsTr">${hexDigitsTds.join('')}</tr>
                    <tr id="binaryDigitsTr">${binaryDigitsTds.join('')}</tr>
                    <tr id="binaryBreakdownTr">${binaryBreakdownTds.join('')}</tr>
                    <tr><td colSpan="3">sign</td><td colSpan="${1 + this.#params.exponentBits - 3}">exponent</td><td colSpan="${this.#params.hexDigits * 4 - (1 + this.#params.exponentBits)}">mantissa</td></tr>
                    {breakdownRows}
                    <tr><td colSpan="${this.#params.hexDigits * 4}">{floatingValueDisplay}</td></tr>
                    {coercedFromTr}
                </tbody>
            </table>`;
        this.update();
    }
    getHexValueToUse() {
        let hexValueToUse = this.hexValue;
        if (this.flipEndianness) {
            hexValueToUse = this.flipHexString(hexValueToUse, this.#params.hexDigits);
        }
        return hexValueToUse;
    }
    /**
     * 
     * @param {string} hexValue 
     * @param {number} hexDigits 
     * @returns {string}
     */
    flipHexString(hexValue, hexDigits) {
        let h = hexValue.substring(0, 2);
        for (let i = 0; i < hexDigits; ++i) {
            let start = 2 + (hexDigits - 1 - i) * 2;
            h += hexValue.substring(start, start + 2);
        }
        return h;
    }
    /**
     * 
     * @param {number} index 
     * @returns {string}
     */
    classNameFromBitIndex(index) {
        return "bitGroup " + ((Math.floor(index / 4) % 2 === 0) ? "even" : "odd");
    }
    /**
     * 
     * @returns {string[]}
     */
    getBits() {
        /**
         * @type {string[]}
         */
        let bits = [];
        let hexValueToUse = this.getHexValueToUse();
        for (let i = 0; i < this.#params.hexDigits; ++i) {
            let binaryString = parseInt(hexValueToUse[2+i], 16).toString(2);
            while (binaryString.length < 4) {
                binaryString = "0" + binaryString;
            }
            for (let j = 0; j < 4; ++j) {
                bits.push(binaryString[j]);
            }
        }
        return bits;
    }
    /**
     * 
     * @param {string[]} bits 
     * @returns {string[]}
     */
    getExponentBits(bits) {
        return bits.slice(1, 1 + this.#params.exponentBits);
    }
    /**
     * 
     * @param {string[]} bits 
     * @returns {string[]}
     */
    getMantissaBits(bits) {
        return bits.slice(1 + this.#params.exponentBits);
    }
    /**
     * 
     * @param {string[]} bits 
     * @param {number} startingIndex 
     * @returns {string}
     */
    wrapBitsInClassName(bits, startingIndex) {
        let spans = [];
        let curSpanText = bits[0];
        let curClassName = this.classNameFromBitIndex(startingIndex);
        for (let i = 1; i < bits.length; ++i) {
            let newClassName = this.classNameFromBitIndex(startingIndex + i);
            if (curClassName === newClassName) {
                // accumulate
                curSpanText += bits[i];
            }
            else {
                // new span
                spans.push(`<span class="${curClassName}">${curSpanText}</span>`);
                curClassName = newClassName;
                curSpanText = bits[i];
            }
        }
        spans.push(`<span class="${curClassName}">${curSpanText}</span>`);
        return spans.join('');
    }

    update() {
        if (!this.shadowRoot.childNodes.length) return;
        if (this.hexValue === '' || this.hexValue === 'ERROR'
            || this.floatingValue === '' || this.floatingValue === 'ERROR'
            || this.hexValue.length !== 2 + this.#params.hexDigits) {
                // TODO !showExplanation
            this.shadowRoot.getElementById("hexFloatTable").style.display = "none";
            return;
        }
        this.shadowRoot.getElementById("hexFloatTable").style.display = "";

        let hexValueToUse = this.getHexValueToUse();
        let hexDigitsTds = this.shadowRoot.getElementById("hexDigitsTr").children;
        for (let i = 0; i < this.#params.hexDigits; i++) {
            hexDigitsTds[i].innerText = hexValueToUse[2 + i];
        }
        let binaryDigitsTds = this.shadowRoot.getElementById("binaryDigitsTr").children;
        let bits = this.getBits();
        for (let i = 0; i < bits.length; i++) {
            binaryDigitsTds[i].innerText = bits[i];
        }
        let binaryBreakdownTds = this.shadowRoot.getElementById("binaryBreakdownTr").children;
        binaryBreakdownTds[0].innerText = bits[0];
        binaryBreakdownTds[1].innerHTML = this.wrapBitsInClassName(this.getExponentBits(bits), 1);
        binaryBreakdownTds[2].innerHTML = this.wrapBitsInClassName(this.getMantissaBits(bits), 1 + this.#params.exponentBits);

        // TODO?
        this.shadowRoot.getElementById("hexTd").innerText = this.hexValue; // + (this.showAllDetails ? " YES" : " NO") + " " + (this.flipEndianness ? "YES" : "NO") + " " + (this.uppercaseLetters ? "YES" : "NO");
    }

    get showAllDetails() {
        return !!this.getAttribute("showalldetails");
    }
    set showAllDetails(val) {
        if (val) {
            this.setAttribute("showalldetails", "true");
        } else {
            this.removeAttribute("showalldetails");
        }
    }
    get flipEndianness() {
        return !!this.getAttribute("flipendianness");
    }
    set flipEndianness(val) {
        if (val) {
            this.setAttribute("flipendianness", "true");
        } else {
            this.removeAttribute("flipendianness");
        }
    }
    get uppercaseLetters() {
        return !!this.getAttribute("uppercaseletters");
    }
    set uppercaseLetters(val) {
        if (val) {
            this.setAttribute("uppercaseletters", "true");
        } else {
            this.removeAttribute("uppercaseletters");
        }
    }

    get hexValue() {
        return this.getAttribute("hexvalue");
    }
    get floatingValue() {
        return this.getAttribute("floatingvalue");
    }
    get coercedFromFloatingPointValue() {
        return this.getAttribute("coercedfromfloatingpointvalue");
    }
    get multiplier() {
        let num = parseFloat(this.getAttribute("multiplier"));
        if (!isNaN(num)) {
            return num;
        }
        return 1;
    }
}
customElements.define("hex-float-breakdown", HexFloatBreakdown);

const appTemplate = document.createElement('template');
appTemplate.innerHTML = `
    <link rel="stylesheet" href="${import.meta.resolve('./index.css')}">
    <div>
        <app-settings showDetails="true"></app-settings>
        <slot></slot>
    </div>`;

class FloatToHexApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        if (this.shadowRoot.childNodes.length) return;
        this.shadowRoot.append(appTemplate.content.cloneNode(true));
        this.shadowRoot.querySelector("app-settings").addEventListener("settingChange", e => {
            let data = e.detail;
            this.update();
        });
        this.update();
    }
    update() {
        if (!this.shadowRoot.childNodes.length) return;
        let appSettings = this.shadowRoot.querySelector("app-settings");
        // TODO this will be another tag name, and only set
        // stuff that changed or something
        // Note that the stuff in slots isn't actually in the Shadow DOM,
        // I guess?
        for (let breakdown of this.querySelectorAll("hex-float-breakdown")) {
            breakdown.showAllDetails = appSettings.showDetails;
            breakdown.flipEndianness = appSettings.swapBytes;
            breakdown.uppercaseLetters = appSettings.uppercaseLetters;
        }
    }
 
}
customElements.define("float-to-hex-app", FloatToHexApp);