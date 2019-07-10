import React, { Component } from 'react';
//import { NICE, SUPER_NICE } from './colors';
import AnimateOnChange from 'react-animate-on-change';

require('./style.css')

//TODO
const SCRIPT_URI = 'floattohex.cgi';
//const SCRIPT_URI = "https://gregstoll.dyndns.org/~gregstoll/floattohex/floattohex.cgi";
interface HexFloatBreakdownProps extends HexConverterProps {
    hexValue: string,
    floatingValue: string,
    multiplier: string
}

class HexFloatBreakdown extends Component<HexFloatBreakdownProps, {}> {
    denormalizedZeros: boolean;
    denormalizedOnes: boolean;
    constructor(props: HexFloatBreakdownProps) {
        super(props);

        this.denormalizedZeros = false;
        this.denormalizedOnes = false;
    }
    getSignExpression(bits: string[], phase: number) {
        let bit = bits[0];
        let one = bit === "1" ? "-1" : "+1";
        if (phase > 0) {
            one += " *";
        }
        return one;
    }
    getExponentExpression(bits: string[], phase: number) {
        let expressionBits = this.getExponentBits(bits).join('');
        let exponent = parseInt(expressionBits, 2);
        if (phase === 0) {
            if (this.denormalizedZeros) {
                return { __html: exponent + ' <b>subnormal</b>' };
            }
            else if (this.denormalizedOnes) {
                return { __html: exponent + ' <b>special</b>' };
            }
            return { __html: exponent + "" };
        }
        if (phase === 1) {
            if (this.denormalizedZeros) {
                return { __html: "2^" + (1 - this.props.exponentBias) + " *" };
            }
            else if (this.denormalizedOnes) {
                return { __html: "" };
            }
            return { __html: "2^(" + exponent + " - " + this.props.exponentBias + ") *" };
        }
        if (phase === 2) {
            if (this.denormalizedOnes) {
                return { __html: "" };
            }
            let power = exponent - this.props.exponentBias;
            if (this.denormalizedZeros) {
                power = 1 - this.props.exponentBias;
            }
            //return Math.round10(Math.pow(2, power), -1 * this.props.decimalPrecision) + " *";
            return { __html: Math.pow(2, power).toPrecision(this.props.decimalPrecision) + " *" };
        }
        //TODO assert or something
        return { __html: "" };
    }
    getMantissaExpression(bits: string[], phase: number) {
        let expressionBits = this.getMantissaBits(bits).join('');
        if (this.denormalizedOnes) {
            let mantissaAllZeros = this.getMantissaBits(bits).reduce((pre, cur) => pre && (cur === "0"), true);
            if (mantissaAllZeros) {
                return "Infinity (since all zeros)";
            }
            else {
                return "NaN (since non-zero)";
            }
        }
        let leadingDigit = this.denormalizedZeros ? 0 : 1;
        if (phase === 0) {
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
        let h = hexValue.substr(0, 2);
        for (let i = 0; i < hexDigits; ++i) {
            h += hexValue.substr(2 + (hexDigits - 1 - i) * 2, 2);
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
    render() {
        if (this.props.hexValue === '' || this.props.hexValue === 'ERROR'
            || this.props.floatingValue === '' || this.props.floatingValue === 'ERROR'
            || this.props.hexValue.length !== 2 + this.props.hexDigits
            || !this.props.showExplanation) {
            return <div style={{ 'display': 'none' }} />;
        }
        let hexValueToUse = this.props.hexValue;
        if (this.props.flipEndianness) {
            hexValueToUse = this.flipHexString(hexValueToUse, this.props.hexDigits);
        }
        let hexDigitsTds = [];
        for (let i = 0; i < this.props.hexDigits; ++i) {
            hexDigitsTds.push(<td colSpan={4} className={"hexDigitCollapsed " + this.classNameFromBitIndex(4 * i)} key={"hexDigitCollapsed" + i}>{hexValueToUse.substr(2 + i, 1)}</td>);
        }
        let bits : string[] = [];
        for (let i = 0; i < this.props.hexDigits; ++i) {
            let binaryString = parseInt(hexValueToUse.substr(2 + i, 1), 16).toString(2);
            while (binaryString.length < 4) {
                binaryString = "0" + binaryString;
            }
            for (let j = 0; j < 4; ++j) {
                bits.push(binaryString.substr(j, 1));
            }
        }
        let binaryDigitsTds = [];
        for (let i = 0; i < bits.length; ++i) {
            binaryDigitsTds.push(<td className={"binaryDigit " + this.classNameFromBitIndex(i)} key={"binaryDigit" + i}>{bits[i]}</td>);
        }
        let binaryBreakdownTds = [];
        binaryBreakdownTds.push(<td className={"binaryBreakdown sign " + this.classNameFromBitIndex(0)} key="sign">{bits[0]}</td>);
        binaryBreakdownTds.push(<td className="binaryBreakdown exponent" key="exponent" colSpan={this.props.exponentBits}>{this.wrapBitsInClassName(this.getExponentBits(bits), 1)}</td>);
        binaryBreakdownTds.push(<td className="binaryBreakdown fraction" key="fraction" colSpan={this.props.fractionBits}>{this.wrapBitsInClassName(this.getMantissaBits(bits), 1 + this.props.exponentBits)}</td>);

        this.denormalizedZeros = this.getExponentBits(bits).reduce((pre: boolean, cur: string) => (pre && (cur === "0")), true);
        this.denormalizedOnes = this.getExponentBits(bits).reduce((pre: boolean, cur: string) => pre && (cur === "1"), true);
        let flippedDescription = this.props.flipEndianness ? ' (swapped endianness)' : '';
        let floatingValueDisplay = this.props.floatingValue;
        if (this.getNumericMultiplier() !== 1) {
            let floatValue = parseFloat(this.props.floatingValue);
            if (!isNaN(floatValue)) {
                floatingValueDisplay = this.props.floatingValue + ' * ' + this.props.multiplier + ' = ' + (floatValue * this.getNumericMultiplier());
            }
        }
        return (
            <table className="hexFloat">
                <tbody>
                    <tr><td colSpan={this.props.hexDigits * 4}>{hexValueToUse}{flippedDescription}</td></tr>
                    <tr>{hexDigitsTds}</tr>
                    <tr>{binaryDigitsTds}</tr>
                    <tr>{binaryBreakdownTds}</tr>
                    <tr><td colSpan={3}>sign</td><td colSpan={1 + this.props.exponentBits - 3}>exponent</td><td colSpan={this.props.hexDigits * 4 - (1 + this.props.exponentBits)}>mantissa</td></tr>
                    <tr><td colSpan={3}>{this.getSignExpression(bits, 0)}</td><td colSpan={1 + this.props.exponentBits - 3} dangerouslySetInnerHTML={this.getExponentExpression(bits, 0)} /><td colSpan={this.props.hexDigits * 4 - (1 + this.props.exponentBits)}>{this.getMantissaExpression(bits, 0)}</td></tr>
                    <tr><td colSpan={3}>{this.getSignExpression(bits, 1)}</td><td colSpan={1 + this.props.exponentBits - 3} dangerouslySetInnerHTML={this.getExponentExpression(bits, 1)} /><td colSpan={this.props.hexDigits * 4 - (1 + this.props.exponentBits)}>{this.getMantissaExpression(bits, 1)}</td></tr>
                    <tr><td colSpan={3}>{this.getSignExpression(bits, 2)}</td><td colSpan={1 + this.props.exponentBits - 3} dangerouslySetInnerHTML={this.getExponentExpression(bits, 2)} /><td colSpan={this.props.hexDigits * 4 - (1 + this.props.exponentBits)}>{this.getMantissaExpression(bits, 2)}</td></tr>
                    <tr><td colSpan={this.props.hexDigits * 4}>{floatingValueDisplay}</td></tr>
                </tbody>
            </table>
        );
    }
}

interface HexConverterProps {
    marginTop?: number,
    floatType: string,
    hexDigits: number,
    exponentBits: number,
    fractionBits: number,
    exponentBias: number,
    decimalPrecision: number,
    showExplanation: boolean,
    flipEndianness: boolean
}

interface HexConverterState {
    hexValue: string,
    floatingValue: string,
    calculatedHexValue: string,
    calculatedFloatingValue: string,
    multiplier: string,
    flash: boolean
}

enum ConvertMode {
    HEX_TO_FLOATING,
    FLOATING_TO_HEX
};

class HexConverter extends Component<HexConverterProps, HexConverterState> {
    formStyle: React.CSSProperties;
    constructor(props: HexConverterProps) {
        super(props);

        //console.log('HexConverter: ' + props);
        this.state = { 'hexValue': "", 'floatingValue': '', 'calculatedHexValue': "", 'calculatedFloatingValue': "", 'multiplier': '1', flash: false };
        this.formStyle = {}
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
    doConvert(query: string, mode: ConvertMode) {
        let that = this;
        fetch(SCRIPT_URI + '?' + query).then(response => {
            return response.text();
        }).then(responseText => {
            let documentElement = that.parseXml(responseText).documentElement;
            if (documentElement === null) {
                return;
            }
            let hexElem: Element = documentElement.getElementsByTagName("hex")[0];
            let hexValue: string = hexElem.childNodes[0].nodeValue || "";
            let floatingElem: Element = documentElement.getElementsByTagName(that.props.floatType.toLowerCase())[0];
            while (hexValue.length < that.props.hexDigits + 2) {
                hexValue = hexValue.substr(0, 2) + "0" + hexValue.substr(2);
            }
            let floatingValue : string = floatingElem.childNodes[0].nodeValue || "";
            if (mode === ConvertMode.FLOATING_TO_HEX) {
                let parsedFloatValue = parseFloat(floatingValue);
                if (!isNaN(parsedFloatValue)) {
                    floatingValue = (parsedFloatValue / that.getNumericMultiplier()).toString();
                }
            }
            that.setState((state, _props) => {
                // This is not great - it would be nicer to put in componentDidUpdate()
                let isChange = hexValue !== state.calculatedHexValue || floatingValue !== state.calculatedFloatingValue;
                return { 'hexValue': hexValue, 'floatingValue': floatingValue, 'calculatedHexValue': hexValue, 'calculatedFloatingValue': floatingValue, 'flash': isChange };
            });
        });
    }
    getNumericMultiplier() {
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
        this.doConvert('action=hexto' + this.props.floatType.toLowerCase() + '&hex=' + this.state.hexValue + '&swap=' + (this.props.flipEndianness ? '1' : '0'), ConvertMode.HEX_TO_FLOATING);
    }
    render() {
        let multiplierSpan;
        //TODO
        //if (Config.multiplier) {
        //    multiplierSpan = <span>&nbsp;<label htmlFor={this.props.floatType.toLowerCase() + 'Multiplier'}>Multiplier:</label><input type="text" name={this.props.floatType.toLowerCase() + 'Multiplier'} id={this.props.floatType.toLowerCase() + 'Multiplier'} value={this.state.multiplier} onChange={e => this.changeMultiplier(e)}/></span>;
        //}
        return (
            <AnimateOnChange
                baseClassName="hexConverter"
                animationClassName="hexConverterFlash"
                animate={this.state.flash}
                customTag="div"
            >
                <form style={this.formStyle}>
                    <p>
                        <label htmlFor={'hex' + this.props.floatType}>Hex value:</label>
                        <input type="text" name={'hex' + this.props.floatType} id={'hex' + this.props.floatType} value={this.state.hexValue} onChange={e => this.changeHexValue(e)} /><input type="button" value={'Convert to ' + this.props.floatType.toLowerCase()} onClick={() => this.convertToFloating()} />
                    </p>
                    <HexFloatBreakdown hexValue={this.state.calculatedHexValue} floatingValue={this.state.calculatedFloatingValue} multiplier={this.state.multiplier} {...this.props} />
                    <p>
                        <label htmlFor={this.props.floatType.toLowerCase() + 'Hex'}>{this.props.floatType + ' value:'}</label>
                        <input type="text" name={this.props.floatType.toLowerCase() + 'Hex'} id={this.props.floatType.toLowerCase() + 'Hex'} value={this.state.floatingValue} onChange={e => this.changeFloatingValue(e)} />{multiplierSpan}<input type="button" value='Convert to hex' onClick={() => this.convertToHex()} />
                    </p>
                </form>
            </AnimateOnChange>
        );
    }
}

interface AppState {
    showExplanation: boolean,
    flipEndianness: boolean
}

class App extends Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        // parse query hash
        let showExplanation = true;
        if (window.location.search) {
            let hash = window.location.search.substring(1);
            let parts = hash.split('&');
            for (let i = 0; i < parts.length; ++i) {
                // hacky
                if (parts[i] === 'showExplanation=0') {
                    showExplanation = false;
                }
            }
        }
        this.state = { 'showExplanation': showExplanation, 'flipEndianness': false };
    }
    handleExplanationChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ showExplanation: event.target.checked });
    }
    handleEndiannessChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ flipEndianness: event.target.checked });
    }
    render() {
        return (
            <div>
                <div>
                    <input type="checkbox" checked={this.state.showExplanation} id="showExplanation" onChange={e => this.handleExplanationChange(e)} />
                    &nbsp;
                <label htmlFor="showExplanation">Show details</label>
                    &nbsp;
                <input type="checkbox" checked={this.state.flipEndianness} id="flipEndianness" onChange={e => this.handleEndiannessChange(e)} />
                    &nbsp;
                <label htmlFor="flipEndianness">Swap endianness</label>
                </div>
                <HexConverter floatType="Float" hexDigits={8} exponentBits={8} fractionBits={23} exponentBias={127} decimalPrecision={9} showExplanation={this.state.showExplanation} flipEndianness={this.state.flipEndianness} />
                <HexConverter marginTop={50} floatType="Double" hexDigits={16} exponentBits={11} fractionBits={52} exponentBias={1023} decimalPrecision={17} showExplanation={this.state.showExplanation} flipEndianness={this.state.flipEndianness} />
            </div>
        );
    }
}

export default App;