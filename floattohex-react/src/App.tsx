import React, { Component } from 'react';
import AnimateOnChange from 'react-animate-on-change';

require('./style.css')

const SCRIPT_URI = process.env.NODE_ENV === 'development' ? "https://gregstoll.dyndns.org/~gregstoll/floattohex/floattohex.cgi" : "floattohex.cgi";
const USE_BINDGEN = true;

declare global {
    interface Window {
      hexfloatcgi: (queryString: string) => string;
    }
  }

export interface HexFloatBreakdownProps extends HexConverterProps {
    hexValue: string,
    floatingValue: string,
    coercedFromFloatingValue: string,
    multiplier: string
}

export enum BreakdownPhase {
    RAW_BITS,
    INTERMEDIATE,
    FLOAT_VALUES
}
export class HexFloatBreakdown extends Component<HexFloatBreakdownProps, {}> {
    getIsDenormalizedZeros(bits: string[]) : boolean {
        return this.getExponentBits(bits).reduce((pre: boolean, cur: string) => (pre && (cur === "0")), true);
    }
    getIsDenormalizedOnes(bits: string[]) : boolean {
        return this.getExponentBits(bits).reduce((pre: boolean, cur: string) => pre && (cur === "1"), true);
    }
    getSignExpression(bits: string[], phase: BreakdownPhase) : string {
        let bit = bits[0];
        let one = bit === "1" ? "-1" : "+1";
        if (phase !== BreakdownPhase.RAW_BITS) {
            one += " *";
        }
        return one;
    }
    getExponentExpression(bits: string[], phase: BreakdownPhase) {
        let expressionBits = this.getExponentBits(bits).join('');
        let exponent = parseInt(expressionBits, 2);
        const denormalizedZeros = this.getIsDenormalizedZeros(bits);
        const denormalizedOnes = this.getIsDenormalizedOnes(bits);
        switch (phase) {
            case BreakdownPhase.RAW_BITS: {
                if (denormalizedZeros) {
                    return { __html: exponent + ' <b>subnormal</b>' };
                }
                else if (denormalizedOnes) {
                    return { __html: exponent + ' <b>special</b>' };
                }
                return { __html: exponent + "" };
            }
            case BreakdownPhase.INTERMEDIATE: {
                if (denormalizedZeros) {
                    return { __html: "2^" + (1 - this.props.exponentBias) + " *" };
                }
                else if (denormalizedOnes) {
                    return { __html: "" };
                }
                return { __html: "2^(" + exponent + " - " + this.props.exponentBias + ") *" };
            }
            case BreakdownPhase.FLOAT_VALUES: {
                if (denormalizedOnes) {
                    return { __html: "" };
                }
                let power = exponent - this.props.exponentBias;
                if (denormalizedZeros) {
                    power = 1 - this.props.exponentBias;
                }
                //return Math.round10(Math.pow(2, power), -1 * this.props.decimalPrecision) + " *";
                return { __html: Math.pow(2, power).toPrecision(this.props.decimalPrecision) + " *" };
            }
        }
    }
    getMantissaExpression(bits: string[], phase: BreakdownPhase) {
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
        let value = parseInt(expressionBits, 2) / Math.pow(2, this.props.fractionBits);
        return leadingDigit + value;
    }
    getExponentBits(bits: string[]) {
        return bits.slice(1, 1 + this.props.exponentBits);
    }
    getMantissaBits(bits: string[]) {
        return bits.slice(1 + this.props.exponentBits);
    }
    classNameFromBitIndex(index: number) {
        return "bitGroup " + ((Math.floor(index / 4) % 2 === 0) ? "even" : "odd");
    }
    wrapBitsInClassName(bits: string[], startingIndex: number) {
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
                spans.push(<span className={curClassName} key={i}>{curSpanText}</span>);
                curClassName = newClassName;
                curSpanText = bits[i];
            }
        }
        spans.push(<span className={curClassName} key="last">{curSpanText}</span>);
        return spans;
    }
    flipHexString(hexValue: string, hexDigits: number) {
        let h = hexValue.substring(0, 2);
        for (let i = 0; i < hexDigits; ++i) {
            let start = 2 + (hexDigits - 1 - i) * 2;
            h += hexValue.substring(start, start + 2);
        }
        return h;
    }
    getNumericMultiplier() {
        let num = parseFloat(this.props.multiplier);
        if (!isNaN(num)) {
            return num;
        }
        return 1;
    }
    getHexValueToUse(): string {
        let hexValueToUse = this.props.hexValue;
        if (this.props.flipEndianness) {
            hexValueToUse = this.flipHexString(hexValueToUse, this.props.hexDigits);
        }
        return hexValueToUse;
    }
    getBits(): string[] {
        let bits : string[] = [];
        let hexValueToUse = this.getHexValueToUse();
        for (let i = 0; i < this.props.hexDigits; ++i) {
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
    render() {
        if (this.props.hexValue === '' || this.props.hexValue === 'ERROR'
            || this.props.floatingValue === '' || this.props.floatingValue === 'ERROR'
            || this.props.hexValue.length !== 2 + this.props.hexDigits
            || !this.props.showExplanation) {
            return <div style={{ 'display': 'none' }} />;
        }
        let hexValueToUse = this.getHexValueToUse();
        let hexDigitsTds = [];
        for (let i = 0; i < this.props.hexDigits; ++i) {
            hexDigitsTds.push(<td colSpan={4} className={"hexDigitCollapsed " + this.classNameFromBitIndex(4 * i)} key={"hexDigitCollapsed" + i}>{hexValueToUse[2 + i]}</td>);
        }
        let bits : string[] = this.getBits();
        let binaryDigitsTds = [];
        for (let i = 0; i < bits.length; ++i) {
            binaryDigitsTds.push(<td className={"binaryDigit " + this.classNameFromBitIndex(i)} key={"binaryDigit" + i}>{bits[i]}</td>);
        }
        let binaryBreakdownTds = [];
        binaryBreakdownTds.push(<td className={"binaryBreakdown sign " + this.classNameFromBitIndex(0)} key="sign">{bits[0]}</td>);
        binaryBreakdownTds.push(<td className="binaryBreakdown exponent" key="exponent" colSpan={this.props.exponentBits}>{this.wrapBitsInClassName(this.getExponentBits(bits), 1)}</td>);
        binaryBreakdownTds.push(<td className="binaryBreakdown fraction" key="fraction" colSpan={this.props.fractionBits}>{this.wrapBitsInClassName(this.getMantissaBits(bits), 1 + this.props.exponentBits)}</td>);

        let flippedDescription = this.props.flipEndianness ? ' (swapped endianness)' : '';
        let floatingValueDisplay = this.props.floatingValue;
        if (this.getNumericMultiplier() !== 1) {
            let floatValue = parseFloat(this.props.floatingValue);
            if (!isNaN(floatValue)) {
                floatingValueDisplay = this.props.floatingValue + ' * ' + this.props.multiplier + ' = ' + (floatValue * this.getNumericMultiplier());
            }
        }
        let breakdownRows = [];
        for (let phase of [BreakdownPhase.RAW_BITS, BreakdownPhase.INTERMEDIATE, BreakdownPhase.FLOAT_VALUES]) {
            breakdownRows.push(<tr key={"breakdownRow" + phase.toString()}>
                <td colSpan={3}>{this.getSignExpression(bits, phase)}</td>
                <td colSpan={1 + this.props.exponentBits - 3} dangerouslySetInnerHTML={this.getExponentExpression(bits, phase)} />
                <td colSpan={this.props.hexDigits * 4 - (1 + this.props.exponentBits)}>{this.getMantissaExpression(bits, phase)}</td></tr>);
        }
        let coercedFromTr = null;
        if (this.props.coercedFromFloatingValue) {
            coercedFromTr = <tr><td colSpan={this.props.hexDigits * 4}>(coerced from {this.props.coercedFromFloatingValue})</td></tr>;
        }
        return (
            <table className="hexFloat">
                <tbody>
                    <tr><td colSpan={this.props.hexDigits * 4}>{hexValueToUse}{flippedDescription}</td></tr>
                    <tr>{hexDigitsTds}</tr>
                    <tr>{binaryDigitsTds}</tr>
                    <tr>{binaryBreakdownTds}</tr>
                    <tr><td colSpan={3}>sign</td><td colSpan={1 + this.props.exponentBits - 3}>exponent</td><td colSpan={this.props.hexDigits * 4 - (1 + this.props.exponentBits)}>mantissa</td></tr>
                    {breakdownRows}
                    <tr><td colSpan={this.props.hexDigits * 4}>{floatingValueDisplay}</td></tr>
                    {coercedFromTr}
                </tbody>
            </table>
        );
    }
}

export interface FloatingPointParams {
    floatType: string,
    floatLongDescription: string,
    hexDigits: number,
    exponentBits: number,
    fractionBits: number,
    exponentBias: number,
    decimalPrecision: number
}

export interface HexConverterProps extends FloatingPointParams {
    marginTop?: number,
    showExplanation: boolean,
    flipEndianness: boolean,
    uppercaseLetters: boolean
}

interface HexConverterState {
    hexValue: string,
    floatingValue: string,
    calculatedHexValue: string,
    calculatedFloatingValue: string,
    coercedFromFloatingValue: string,
    multiplier: string,
    flash: boolean
}

export enum ConvertMode {
    HEX_TO_FLOATING,
    FLOATING_TO_HEX
};

export class HexConverter extends Component<HexConverterProps, HexConverterState> {
    formStyle: React.CSSProperties;
    constructor(props: HexConverterProps) {
        super(props);

        //console.log('HexConverter: ' + props);
        this.state = { 'hexValue': "", 'floatingValue': '', 'calculatedHexValue': "", 'calculatedFloatingValue': "", 'coercedFromFloatingValue': "", 'multiplier': '1', flash: false };
        this.formStyle = {};
        if (props.marginTop) {
            this.formStyle['marginTop'] = props.marginTop + 'px';
        }
    }
    changeHexValue(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ 'hexValue': e.target.value, 'flash': false });
    }
    changeFloatingValue(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ 'floatingValue': e.target.value, 'flash': false });
    }
    changeMultiplier(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ 'multiplier': e.target.value });
    }
    parseXml(s: string) {
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(s, "text/xml");
        return xmlDoc;
    }
    getConvertResultState(responseText: string, mode: ConvertMode)
     : Omit<HexConverterState, "multiplier" | "flash"> | null {
        let documentElement = this.parseXml(responseText).documentElement;
        if (documentElement === null) {
            return null;
        }
        let hexElem: Element = documentElement.getElementsByTagName("hex")[0];
        let hexValue: string = hexElem?.childNodes[0]?.nodeValue || "";
        let floatingElem: Element = documentElement.getElementsByTagName(this.props.floatType.toLowerCase())[0];
        while (hexValue.length < this.props.hexDigits + 2) {
            hexValue = hexValue.substring(0, 2) + "0" + hexValue.substring(2);
        }
        let floatingValue : string = floatingElem.childNodes[0].nodeValue || "";
        let coercedFromFloatingElem = documentElement.getElementsByTagName("coercedFloat").item(0);
        let coercedFromFloatingRawValue : string = coercedFromFloatingElem?.childNodes[0]?.nodeValue || "";
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
        return {'hexValue': hexValue,
                    'floatingValue': floatingValue,
                    'calculatedHexValue': hexValue,
                    'calculatedFloatingValue': floatingValue,
                    'coercedFromFloatingValue': coercedFromFloatingValue};
    }
    showConvertResult(responseText: string, mode: ConvertMode) {
        let newState = this.getConvertResultState(responseText, mode);
        if (newState === null) {
            return;
        }
        this.setState((state, _props) => {
            // npm run build fails type checking without this, seems to be a bug
            newState = newState!;
            // This is not great - it would be nicer to put in componentDidUpdate()
            let isChange = newState.hexValue !== state.calculatedHexValue || newState.floatingValue !== state.calculatedFloatingValue;
            // should be able to return { 'flash': isChange, ...newState};
            // but npm run build fails type checking, seems to be a bug?
            return { 'flash': isChange,
                 "hexValue": newState.hexValue, "floatingValue": newState.floatingValue,
                 "calculatedFloatingValue": newState.calculatedFloatingValue, "calculatedHexValue": newState.calculatedHexValue,
                 "coercedFromFloatingValue": newState.coercedFromFloatingValue};
        });
    }
    doConvert(query: string, mode: ConvertMode) {
        if (USE_BINDGEN) {
            let start_time = performance.now();
            let responseText = window.hexfloatcgi(query);
            let end_time = performance.now();
            console.log(`bindgen call took ${(end_time - start_time).toFixed(2)}ms`);
            this.showConvertResult(responseText, mode);
        } else {
            let that = this;
            fetch(SCRIPT_URI + '?' + query).then(response => {
                return response.text();
            }).then(responseText => {
                that.showConvertResult(responseText, mode);
            });
        }
    }
    displayHex(hexValue: string): string {
        if (this.props.uppercaseLetters) {
            // Don't mess with the "0x" at the beginning
            return hexValue.substring(0,2) + hexValue.substring(2).toUpperCase();
        } else {
            return hexValue.substring(0,2) + hexValue.substring(2).toLowerCase();
        }
    }
    getNumericMultiplier(): number {
        let num = parseFloat(this.state.multiplier);
        if (!isNaN(num)) {
            return num;
        }
        return 1;
    }
    convertToHex() {
        let floatValue = parseFloat(this.state.floatingValue);
        floatValue *= this.getNumericMultiplier();
        this.doConvert('action=' + this.props.floatType.toLowerCase() + 'tohex&' + this.props.floatType.toLowerCase() + '=' + floatValue.toString().replace('+', '%2B') + '&swap=' + (this.props.flipEndianness ? '1' : '0'), ConvertMode.FLOATING_TO_HEX);
    }
    convertToFloating() {
        this.doConvert('action=hexto' + this.props.floatType.toLowerCase() + '&hex=' + this.state.hexValue.replaceAll(' ', '') + '&swap=' + (this.props.flipEndianness ? '1' : '0'), ConvertMode.HEX_TO_FLOATING);
    }
    render() {
        let multiplierSpan;
        //TODO
        //if (Config.multiplier) {
        //    multiplierSpan = <span>&nbsp;<label>Multiplier: <input type="text" value={this.state.multiplier} onChange={e => this.changeMultiplier(e)}/></label></span>;
        //}
        return (
            <AnimateOnChange
                baseClassName="hexConverter"
                animationClassName="hexConverterFlash"
                animate={this.state.flash}
                customTag="div"
            >
                <form style={this.formStyle}>
                    <h1 dangerouslySetInnerHTML={{__html: this.props.floatLongDescription}}></h1>
                    <p>
                        <label>Hex value: <input type="text" value={this.displayHex(this.state.hexValue)} onChange={e => this.changeHexValue(e)} /></label>
                        <input type="button" value={'Convert to ' + this.props.floatType.toLowerCase()} onClick={() => this.convertToFloating()} />
                    </p>
                    <HexFloatBreakdown
                        hexValue={this.displayHex(this.state.calculatedHexValue)}
                        floatingValue={this.state.calculatedFloatingValue}
                        coercedFromFloatingValue={this.state.coercedFromFloatingValue}
                        multiplier={this.state.multiplier}
                        {...this.props} />
                    <p>
                        <label>{this.props.floatType + ' value:'} <input type="text" value={this.state.floatingValue} onChange={e => this.changeFloatingValue(e)} /></label>
                        {multiplierSpan}<input type="button" value='Convert to hex' onClick={() => this.convertToHex()} />
                    </p>
                </form>
            </AnimateOnChange>
        );
    }
}

interface AppState {
    showExplanation: boolean,
    flipEndianness: boolean,
    uppercaseLetters: boolean
}

export const FLOAT_PARAMS : FloatingPointParams = {
    floatType: "Float",
    floatLongDescription: "<a href=\"https://en.wikipedia.org/wiki/Single-precision_floating-point_format\" target=\"_blank\">Single-precision</a> floating point",
    hexDigits: 8,
    exponentBits: 8,
    fractionBits: 23,
    exponentBias: 127,
    decimalPrecision: 9
};

export const DOUBLE_PARAMS : FloatingPointParams = {
    floatType: "Double",
    floatLongDescription: "<a href=\"https://en.wikipedia.org/wiki/Double-precision_floating-point_format\" target=\"_blank\">Double-precision</a> floating point",
    hexDigits: 16,
    exponentBits: 11,
    fractionBits: 52,
    exponentBias: 1023,
    decimalPrecision: 17
}

export const FLOAT16_PARAMS : FloatingPointParams = {
    floatType: "Float16",
    floatLongDescription: "<a href=\"https://en.wikipedia.org/wiki/Half-precision_floating-point_format\" target=\"_blank\">Half-precision</a> floating point",
    hexDigits: 4,
    exponentBits: 5,
    fractionBits: 10,
    exponentBias: 15,
    decimalPrecision: 5
};

export const BFLOAT16_PARAMS : FloatingPointParams = {
    floatType: "bfloat16",
    floatLongDescription: "<a href=\"https://en.wikipedia.org/wiki/Bfloat16_floating-point_format\" target=\"_blank\">Google bfloat16</a> floating point",
    hexDigits: 4,
    exponentBits: 8,
    fractionBits: 7,
    exponentBias: 127,
    decimalPrecision: 3
};


class App extends Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        // parse query hash
        let showExplanation = true;
        let uppercaseLetters = false;
        if (window.location.search) {
            let hash = window.location.search.substring(1);
            let parts = hash.split('&');
            for (let i = 0; i < parts.length; ++i) {
                // hacky
                if (parts[i] === 'showExplanation=0') {
                    showExplanation = false;
                }
                else if (parts[i] === 'uppercaseLetters=1') {
                    uppercaseLetters = true;
                }
            }
        }
        this.state = { 'showExplanation': showExplanation, 'flipEndianness': false, 'uppercaseLetters': uppercaseLetters };
    }
    handleExplanationChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ showExplanation: event.target.checked });
    }
    handleEndiannessChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ flipEndianness: event.target.checked });
    }
    handleUppercaseLettersChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ uppercaseLetters: event.target.checked });
    }
    render() {
        return (
            <div>
                <div>
                    <label><input type="checkbox" checked={this.state.showExplanation} onChange={e => this.handleExplanationChange(e)} />
                            &nbsp;Show details</label>
                    &nbsp;
                    <label><input type="checkbox" checked={this.state.flipEndianness} onChange={e => this.handleEndiannessChange(e)} />
                            &nbsp;Swap to use big-endian</label>
                    &nbsp;
                    <label><input type="checkbox" checked={this.state.uppercaseLetters} onChange={e => this.handleUppercaseLettersChange(e)} />
                            &nbsp;Uppercase letters in hex</label>
                </div>
                <div className="hexConverterContainer">
                    <HexConverter
                        showExplanation={this.state.showExplanation} flipEndianness={this.state.flipEndianness} uppercaseLetters={this.state.uppercaseLetters}
                        {...FLOAT_PARAMS} />
                    <HexConverter marginTop={0}
                        showExplanation={this.state.showExplanation} flipEndianness={this.state.flipEndianness} uppercaseLetters={this.state.uppercaseLetters}
                        {...DOUBLE_PARAMS} />
                    <HexConverter marginTop={0}
                        showExplanation={this.state.showExplanation} flipEndianness={this.state.flipEndianness} uppercaseLetters={this.state.uppercaseLetters}
                        {...FLOAT16_PARAMS} />
                    <HexConverter marginTop={0}
                        showExplanation={this.state.showExplanation} flipEndianness={this.state.flipEndianness} uppercaseLetters={this.state.uppercaseLetters}
                        {...BFLOAT16_PARAMS} />
                </div>
            </div>
        );
    }
}

export default App;
