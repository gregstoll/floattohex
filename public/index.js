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

class HexFloatBreakdown extends HTMLElement {
    /**
     * @type FloatingPointParams
     */
    #params;
    /**
     * @param {string} paramsName
     */
    constructor() {
        super();
        this.#params = NAME_TO_FLOATING_POINT_PARAM.get(this.getAttribute("floatingPointType"));
        // TODO - listen for "show details", etc.
        this.attachShadow({ mode: 'open' });
    }
    static get observedAttributes() {
        return ["hexValue", "floatingValue", "coercedFromFloatingValue", "multiplier"];
    }
    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.update();
    }
    connectedCallback() {
        if (this.shadowRoot.childNodes.length) return;
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="index.css">
            <table id="hexFloatTable" class="hexFloat">
                <tbody>
                    <tr><td id="hexTd" colSpan="${this.#params.hexDigits * 4}">{hexValueToUse}{flippedDescription}</td></tr>
                    <tr>{hexDigitsTds}</tr>
                    <tr>{binaryDigitsTds}</tr>
                    <tr>{binaryBreakdownTds}</tr>
                    <tr><td colSpan="3">sign</td><td colSpan="${1 + this.#params.exponentBits - 3}">exponent</td><td colSpan="${this.#params.hexDigits * 4 - (1 + this.#params.exponentBits)}">mantissa</td></tr>
                    {breakdownRows}
                    <tr><td colSpan="${this.#params.hexDigits * 4}">{floatingValueDisplay}</td></tr>
                    {coercedFromTr}
                </tbody>
            </table>`;
        this.update();
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

        this.shadowRoot.getElementById("hexTd").innerText = this.hexValue;
    }

    get hexValue() {
        return this.getAttribute("hexValue");
    }
    get floatingValue() {
        return this.getAttribute("floatingValue");
    }
    get coercedFromFloatingPointValue() {
        return this.getAttribute("coercedFromFloatingPointValue");
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