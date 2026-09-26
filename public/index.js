"use strict";

export const BreakdownPhase = Object.freeze({
    RAW_BITS : 0,
    INTERMEDIATE : 1,
    FLOAT_VALUES : 2,
});

export const ConvertMode = Object.freeze({
    HEX_TO_FLOATING : 0,
    FLOATING_TO_HEX : 1,
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
                    <!-- &nbsp;
                      <label><input id="swapBytes" type="checkbox">Swap to use big-endian</label>
                    &nbsp; -->
                    <label><input id="uppercaseLetters" type="checkbox">Uppercase letters in hex</label>
                </div>
                `;
        // update() first so this doesn't trigger events, I guess?
        this.update();
        this.shadowRoot.getElementById("showDetails").addEventListener("change", () => {
            let value = this.shadowRoot.getElementById("showDetails").checked;
            this.showDetails = value;
            this.dispatchEvent(new CustomEvent("settingChange", {
                detail: {showDetails: value}
            }));
        });
        /*this.shadowRoot.getElementById("swapBytes").addEventListener("change", () => {
            let value = this.shadowRoot.getElementById("swapBytes").checked;
            this.swapBytes = value;
            this.dispatchEvent(new CustomEvent("settingChange", {
                detail: {swapBytes: value}
            }));
        });*/
        this.shadowRoot.getElementById("uppercaseLetters").addEventListener("change", () => {
            let value = this.shadowRoot.getElementById("uppercaseLetters").checked;
            this.uppercaseLetters = value;
            this.dispatchEvent(new CustomEvent("settingChange", {
                detail: {uppercaseLetters: value}
            }));
        });
        if (window.location.search) {
            let hash = window.location.search.substring(1);
            let parts = hash.split('&');
            for (let i = 0; i < parts.length; ++i) {
                // hacky
                if (parts[i] === 'showExplanation=0') {
                    this.showDetails = false;
                }
                else if (parts[i] === 'uppercaseLetters=1') {
                    this.uppercaseLetters = true;
                }
            }
        }
    }
    static get observedAttributes() {
        return ["showdetails", "swapbytes", "uppercaseletters"];
    }
    attributeChangedCallback(_name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.update();
        }
    }

    update() {
        if (!this.shadowRoot.childNodes.length) return;
        this.shadowRoot.getElementById("showDetails").checked = this.showDetails;
        //this.shadowRoot.getElementById("swapBytes").checked = this.swapBytes;
        this.shadowRoot.getElementById("uppercaseLetters").checked = this.uppercaseLetters;
    }

    get showDetails() {
        return !!this.getAttribute("showdetails");
    }
    set showDetails(value) {
        if (value) {
            this.setAttribute("showdetails", "true");
        } else {
            this.removeAttribute("showdetails");
        }
    }
    get swapBytes() {
        return !!this.getAttribute("swapbytes");
    }
    set swapBytes(value) {
        if (value) {
            this.setAttribute("swapbytes", "true");
        } else {
            this.removeAttribute("swapbytes");
        }
    }
    get uppercaseLetters() {
        return !!this.getAttribute("uppercaseletters");
    }
    set uppercaseLetters(value) {
        if (value) {
            this.setAttribute("uppercaseletters", "true");
        } else {
            this.removeAttribute("uppercaseletters");
        }
    }
}
customElements.define("app-settings", AppSettings);

class HexFloatBreakdown extends HTMLElement {
    /**
     * @type {FloatingPointParams}
     */
    #params;
    constructor() {
        super();
        this.#params = NAME_TO_FLOATING_POINT_PARAM.get(this.getAttribute("floatingPointType"));
        this.attachShadow({ mode: 'open' });
    }
    static get observedAttributes() {
        return ["hexvalue", "floatingvalue", "coercedfromfloatingvalue", "multiplier", "showalldetails", "flipendianness", "uppercaseletters"];
    }
    attributeChangedCallback(_name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.update();
        }
    }
    connectedCallback() {
        if (this.shadowRoot.childNodes.length) return;
        let hexDigitsTds = [];
        for (let i = 0; i < this.#params.hexDigits; i++) {
            hexDigitsTds.push(`<td colspan="4" class="hexDigitCollapsed ${this.classNameFromBitIndex(4*i)}"></td>`);
        }

        let binaryDigitsTds = [];
        for (let i = 0; i < this.#params.hexDigits * 4; ++i) {
            binaryDigitsTds.push(`<td class="binaryDigit ${this.classNameFromBitIndex(i)}"></td>`);
        }

        let binaryBreakdownTds = [];
        binaryBreakdownTds.push(`<td class="binaryBreakdown sign ${this.classNameFromBitIndex(0)}"></td>`);
        binaryBreakdownTds.push(`<td class="binaryBreakdown exponent" colSpan=${this.#params.exponentBits}></td>`);
        binaryBreakdownTds.push(`<td class="binaryBreakdown fraction" colSpan=${this.#params.fractionBits}></td>`);

        let breakdownRows = [];
        for (let phase of [BreakdownPhase.RAW_BITS, BreakdownPhase.INTERMEDIATE, BreakdownPhase.FLOAT_VALUES]) {
            breakdownRows.push(`<tr id="breakdownRow${phase.toString()}">
                <td colSpan="3"></td>
                <td colSpan="${1 + this.#params.exponentBits - 3}"></td>
                <td colSpan="${this.#params.hexDigits * 4 - (1 + this.#params.exponentBits)}"></td></tr>`);
        }

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="index.css">
            <table id="hexFloatTable" class="hexFloat">
                <tbody>
                    <tr><td id="hexTd" colSpan="${this.#params.hexDigits * 4}">{hexValueToUse}{flippedDescription}</td></tr>
                    <tr id="hexDigitsTr">${hexDigitsTds.join('')}</tr>
                    <tr id="binaryDigitsTr">${binaryDigitsTds.join('')}</tr>
                    <tr id="binaryBreakdownTr">${binaryBreakdownTds.join('')}</tr>
                    <tr><td colSpan="3">sign</td><td colSpan="${1 + this.#params.exponentBits - 3}">exponent</td><td colSpan="${this.#params.hexDigits * 4 - (1 + this.#params.exponentBits)}">mantissa</td></tr>
                    ${breakdownRows.join('\n')}
                    <tr><td id="floatingValueDisplay" colSpan="${this.#params.hexDigits * 4}"></td></tr>
                    <tr id="coercedFromTr"><td colSpan="${this.#params.hexDigits * 4}"></td></tr>
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
    /**
     * 
     * @param {string[]} bits 
     * @returns {boolean}
     */
    getIsDenormalizedZeros(bits) {
        return this.getExponentBits(bits).reduce((pre, cur) => (pre && (cur === "0")), true);
    }
    /**
     * 
     * @param {string[]} bits 
     * @returns {boolean}
     */
    getIsDenormalizedOnes(bits) {
        return this.getExponentBits(bits).reduce((pre, cur) => pre && (cur === "1"), true);
    }

    /**
     * 
     * @param {string[]} bits 
     * @param {BreakdownPhase} phase 
     * @returns 
     */
    getSignExpression(bits, phase) {
        let bit = bits[0];
        let one = bit === "1" ? "-1" : "+1";
        if (phase !== BreakdownPhase.RAW_BITS) {
            one += " *";
        }
        return one;
    }
    /**
     * 
     * @param {string[]} bits 
     * @param {BreakdownPhase} phase 
     * @returns {string}
     */
    getExponentExpression(bits, phase) {
        let expressionBits = this.getExponentBits(bits).join('');
        let exponent = parseInt(expressionBits, 2);
        const denormalizedZeros = this.getIsDenormalizedZeros(bits);
        const denormalizedOnes = this.getIsDenormalizedOnes(bits);
        switch (phase) {
            case BreakdownPhase.RAW_BITS: {
                if (denormalizedZeros) {
                    return exponent + ' <b>subnormal</b>';
                }
                else if (denormalizedOnes) {
                    return exponent + ' <b>special</b>';
                }
                return exponent + "";
            }
            case BreakdownPhase.INTERMEDIATE: {
                if (denormalizedZeros) {
                    return "2^" + (1 - this.#params.exponentBias) + " *";
                }
                else if (denormalizedOnes) {
                    return "";
                }
                return "2^(" + exponent + " - " + this.#params.exponentBias + ") *";
            }
            case BreakdownPhase.FLOAT_VALUES: {
                if (denormalizedOnes) {
                    return "";
                }
                let power = exponent - this.#params.exponentBias;
                if (denormalizedZeros) {
                    power = 1 - this.#params.exponentBias;
                }
                //return Math.round10(Math.pow(2, power), -1 * this.#params.decimalPrecision) + " *";
                return Math.pow(2, power).toPrecision(this.#params.decimalPrecision) + " *";
            }
        }
    }
    /**
     * 
     * @param {string[]} bits 
     * @param {BreakdownPhase} phase 
     * @returns {string}
     */
    getMantissaExpression(bits, phase) {
        let expressionBits = this.getMantissaBits(bits).join('');
        if (this.getIsDenormalizedOnes(bits)) {
            let mantissaAllZeros = this.getMantissaBits(bits).reduce((pre, cur) => pre && (cur === "0"), true);
            if (mantissaAllZeros) {
                return "Infinity (since all zeros)";
            }
            else {
                return "NaN (since non-zero)";
            }
        }
        let leadingDigit = this.getIsDenormalizedZeros(bits) ? 0 : 1;
        if (phase === BreakdownPhase.RAW_BITS) {
            return leadingDigit + "." + expressionBits + " (binary)";
        }
        // can't parse float in base 2 :-(
        let value = parseInt(expressionBits, 2) / Math.pow(2, this.#params.fractionBits);
        return leadingDigit + value;
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

    update() {
        if (!this.shadowRoot.childNodes.length) return;
        if (this.hexValue === '' || this.hexValue === 'ERROR' || (this.hexValue === null)
            || this.floatingValue === '' || this.floatingValue === 'ERROR' || (this.floatingValue === null)
            || this.hexValue.length !== 2 + this.#params.hexDigits || !this.showAllDetails) {
            this.shadowRoot.getElementById("hexFloatTable").style.display = "none";
            return;
        }
        this.shadowRoot.getElementById("hexFloatTable").style.display = "";

        let flippedDescription = this.flipEndianness ? ' (swapped endianness)' : '';
        this.shadowRoot.getElementById("hexTd").innerText = this.hexValue + flippedDescription;

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

        for (let phase of [BreakdownPhase.RAW_BITS, BreakdownPhase.INTERMEDIATE, BreakdownPhase.FLOAT_VALUES]) {
            let tds = this.shadowRoot.getElementById("breakdownRow" + phase.toString()).children;
            tds[0].innerHTML = this.getSignExpression(bits, phase);
            tds[1].innerHTML = this.getExponentExpression(bits, phase);
            tds[2].innerHTML = this.getMantissaExpression(bits, phase);
        }
        let floatingValueDisplay = this.floatingValue;
        if (this.multiplier !== 1) {
            let floatValue = parseFloat(this.floatingValue);
            if (!isNaN(floatValue)) {
                floatingValueDisplay = this.floatingValue + ' * ' + this.#params.multiplier + ' = ' + (floatValue * this.multiplier);
            }
        }
        this.shadowRoot.getElementById("floatingValueDisplay").innerHTML = floatingValueDisplay;

        let coercedFromTr = this.shadowRoot.getElementById("coercedFromTr");
        if (this.coercedFromFloatingPointValue) {
            coercedFromTr.style.display = "";
            coercedFromTr.children[0].innerHTML = 
                `(coerced from ${this.coercedFromFloatingValue})`;
        } else {
            coercedFromTr.style.display = "none";
        }
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
    set hexValue(val) {
        this.setAttribute("hexvalue", val);
    }
    get floatingValue() {
        return this.getAttribute("floatingvalue");
    }
    set floatingValue(val) {
        this.setAttribute("floatingvalue", val);
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

class HexConverter extends HTMLElement {
    /**
     * @type {FloatingPointParams}
     */
    #params;
    /**
     * @type {string|undefined}
     */
    #marginTop;
    #clearAnimationTimeout;
    constructor() {
        super();
        this.#params = NAME_TO_FLOATING_POINT_PARAM.get(this.getAttribute("floatingPointType"));
        this.#marginTop = this.getAttribute("margintop");
        //this.hexValue = "";
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        if (this.shadowRoot.childNodes.length) return;
        let marginTopText = this.#marginTop ? ` style="margin-top: ${this.#marginTop}px"` : "";
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="index.css">
            <form${marginTopText} class="hexConverter" id="hexConverterForm">
                <h1>${this.#params.floatLongDescription}</h1>
                <p>
                    <label>Hex value: <input id="hexValueInput" type="text"></label>
                    <input id="convertToFloatButton" type="button" value="${'Convert to ' + this.#params.floatType.toLowerCase()}">
                </p>

                <hex-float-breakdown floatingPointType="${this.getAttribute("floatingPointType")}">
                </hex-float-breakdown>

                <p>
                    <label>${this.#params.floatType} value: <input id="floatValueInput" type="text"></label>
                    <input id="convertToHexButton" type="button" value="Convert to hex">
                </p>
            </form>
            `;
        // Not totally sure we need these next two, maybe we could get away
        // with just setting these in the convert buttons
        this.shadowRoot.getElementById("hexValueInput").onchange = e => {
            this.hexValue = e.target.value;
        }
        this.shadowRoot.getElementById("floatValueInput").onchange = e => {
            this.floatingValue = e.target.value;
        }
        this.shadowRoot.getElementById("convertToHexButton").onclick = () => {
            //this.floatingValue = this.shadowRoot.getElementById("floatValueInput").value;
            this.convertToHex();
        }
        this.shadowRoot.getElementById("convertToFloatButton").onclick = () => {
            //this.hexValue = this.shadowRoot.getElementById("hexValueInput").value;
            this.convertToFloat();
        }
     
        this.update();
    }
    static get observedAttributes() {
        return ["hexvalue", "floatingvalue", "calculatedhexvalue", "calculatedfloatingvalue", "coercedfromfloatingvalue",
            "showalldetails", "flipendianness", "uppercaseletters"];
    }
    attributeChangedCallback(_name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.update();
        }
    }
    getNumericMultiplier() {
        return 1;
    }
    convertToHex() {
        let floatValue = parseFloat(this.floatingValue);
        floatValue *= this.getNumericMultiplier();
        this.doConvert('action=' + this.#params.floatType.toLowerCase() + 'tohex&' + this.#params.floatType.toLowerCase() + '=' + floatValue.toString().replace('+', '%2B') + '&swap=' + (this.#params.flipEndianness ? '1' : '0'), ConvertMode.FLOATING_TO_HEX);
    }
    convertToFloat() {
        this.doConvert('action=hexto' + this.#params.floatType.toLowerCase() + '&hex=' + this.hexValue.replaceAll(' ', '') + '&swap=' + (this.flipEndianness ? '1' : '0'), ConvertMode.HEX_TO_FLOATING);
    }
    /**
     * 
     * @param {string} query 
     * @param {ConvertMode} mode 
     */
    doConvert(query, mode) {
        let start_time = performance.now();
        let responseText = window.hexfloatcgi(query);
        let end_time = performance.now();
        console.log(`bindgen call took ${(end_time - start_time).toFixed(2)}ms`);
        this.setConvertResult(responseText, mode);
    } 
    /**
     * 
     * @param {string} responseText 
     * @param {ConvertMode} mode 
     */
    setConvertResult(responseText, mode) {
        let documentElement = this.parseXml(responseText).documentElement;
        if (documentElement === null) {
            console.error("couldn't parse responseXml!");
            return;
        }
        let hexElem = documentElement.getElementsByTagName("hex")[0];
        let hexValue = hexElem?.childNodes[0]?.nodeValue || "";
        let floatingElem = documentElement.getElementsByTagName(this.#params.floatType.toLowerCase())[0];
        while (hexValue.length < this.#params.hexDigits + 2) {
            hexValue = hexValue.substring(0, 2) + "0" + hexValue.substring(2);
        }
        let floatingValue = floatingElem.childNodes[0].nodeValue || "";
        let coercedFromFloatingElem = documentElement.getElementsByTagName("coercedFloat").item(0);
        let coercedFromFloatingRawValue = coercedFromFloatingElem?.childNodes[0]?.nodeValue || "";
        let coercedFromFloatingValue = "";
        if (mode === ConvertMode.FLOATING_TO_HEX) {
            let parsedFloatValue = parseFloat(floatingValue);
            if (!isNaN(parsedFloatValue)) {
                let parsedCoercedFloatingValue = parseFloat(coercedFromFloatingRawValue);
                if (!isNaN(parsedCoercedFloatingValue)) {
                    floatingValue = (parsedCoercedFloatingValue / this.getNumericMultiplier()).toString();
                    coercedFromFloatingValue = (parsedFloatValue / this.getNumericMultiplier()).toString();
                } else {
                    floatingValue = (parsedFloatValue / this.getNumericMultiplier()).toString();
                }
            }
        }
        let isChange = this.calculatedHexValue !== hexValue || this.calculatedFloatingValue !== floatingValue;
        this.hexValue = hexValue;
        this.floatingValue = floatingValue;
        this.calculatedHexValue = hexValue;
        this.calculatedFloatingValue = floatingValue;
        this.coercedFromFloatingValue = coercedFromFloatingValue;
        if (isChange) {
            if (this.#clearAnimationTimeout) {
                clearTimeout(this.#clearAnimationTimeout);
                this.#clearAnimationTimeout = undefined;
            }
            this.shadowRoot.getElementById("hexConverterForm").classList.add("hexConverterFlash");
            // Get the animation duration from CSS so we can clear the class name after that.
            let style = window.getComputedStyle(this.shadowRoot.getElementById("hexConverterForm"));
            let durationStr = style.getPropertyValue("animation-duration");
            this.#clearAnimationTimeout = setTimeout(() => {
                this.shadowRoot.getElementById("hexConverterForm").classList.remove("hexConverterFlash");
                this.#clearAnimationTimeout = undefined;
            }, this.parseTime(durationStr));
        }
    }

    /**
     * 
     * @param {string} s 
     * @returns {number} The number of milliseconds the string represents
     */
    parseTime(s) {
        if (s.endsWith("ms")) { return parseInt(s.substring(0, s.length - 2), 10);}
        if (s.endsWith("s")) { return 1000 * parseFloat(s.substring(0, s.length - 1));}
        console.warn(`Couldn't parse time string "${s}"`);
        return 500;
    }

    /**
     * 
     * @param {string} s 
     * @returns {XMLDocument}
     */
    parseXml(s) {
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(s, "text/xml");
        return xmlDoc;
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
    set hexValue(val) {
        this.setAttribute("hexvalue", val);
    }
    get floatingValue() {
        return this.getAttribute("floatingvalue");
    }
    set floatingValue(val) {
        this.setAttribute("floatingvalue", val);
    }
    get calculatedHexValue() {
        return this.getAttribute("calculatedhexvalue");
    }
    set calculatedHexValue(val) {
        this.setAttribute("calculatedhexvalue", val);
    }
    get calculatedFloatingValue() {
        return this.getAttribute("calculatedfloatingvalue");
    }
    set calculatedFloatingValue(val) {
        this.setAttribute("calculatedfloatingvalue", val);
    }
    get coercedFromFloatingValue() {
        return this.getAttribute("coercedfromfloatingvalue");
    }
    set coercedFromFloatingValue(val) {
        this.setAttribute("coercedfromfloatingvalue", val);
    }


    /**
     * 
     * @param {string} hexValue 
     * @returns {string}
     */
    displayHex(hexValue) {
        if (!hexValue) { return '';}
        if (this.uppercaseLetters) {
            // Don't mess with the "0x" at the beginning
            return hexValue.substring(0,2) + hexValue.substring(2).toUpperCase();
        } else {
            return hexValue.substring(0,2) + hexValue.substring(2).toLowerCase();
        }
    }

    update() {
        if (!this.shadowRoot.childNodes.length) return;

        let breakdown = this.shadowRoot.querySelector("hex-float-breakdown");
        breakdown.showAllDetails = this.showAllDetails;
        breakdown.flipEndianness = this.flipEndianness;
        breakdown.uppercaseLetters = this.uppercaseLetters;

        if (this.calculatedHexValue) {
            breakdown.hexValue = this.displayHex(this.calculatedHexValue);
            breakdown.floatingValue = this.calculatedFloatingValue;
            breakdown.calculatedFloatingValue = this.calculatedFloatingValue;
        }

        this.shadowRoot.getElementById("hexValueInput").value = this.displayHex(this.hexValue);
        this.shadowRoot.getElementById("floatValueInput").value = this.floatingValue;
    }
}
customElements.define("hex-converter", HexConverter);


const appTemplate = document.createElement('template');
appTemplate.innerHTML = `
    <link rel="stylesheet" href="${import.meta.resolve('./index.css')}">
    <div>
        <app-settings showdetails="true"></app-settings>
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
            //let data = e.detail;
            this.update();
        });
        this.update();
    }
    update() {
        if (!this.shadowRoot.childNodes.length) return;
        let appSettings = this.shadowRoot.querySelector("app-settings");
        // Note that the stuff in slots isn't actually in the Shadow DOM,
        // I guess?
        for (let converter of this.querySelectorAll("hex-converter")) {
            converter.showAllDetails = appSettings.showDetails;
            converter.flipEndianness = appSettings.swapBytes;
            converter.uppercaseLetters = appSettings.uppercaseLetters;
        }
    }
}
customElements.define("float-to-hex-app", FloatToHexApp);