import React, { Component } from 'react';
//import { NICE, SUPER_NICE } from './colors';

// https://stackoverflow.com/questions/34107925/node-referenceerror-promise-is-not-defined
var Promise = require('promise')
require('./style.less')

// adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  /*function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    var origPower = value[1] ? (+value[1]) : 0;
    value = Math[type](+(value[0] + 'e' + (-exp)));
    //value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
  */

class HexFloatBreakdown extends Component {
  constructor(props) {
      super(props);

      this.bits = [];
      for (var i = 0; i < this.props.hexDigits; ++i) {
          var binaryString = parseInt(this.props.hexValue.substr(2 + i, 1), 16).toString(2);
          while (binaryString.length < 4) {
              binaryString = "0" + binaryString;
          }
          for (var j = 0; j < 4; ++j) {
              this.bits.push(binaryString.substr(j, 1));
          }
      }

      this.getSignExpression = this.getSignExpression.bind(this);
      this.getExponentExpression = this.getExponentExpression.bind(this);
      this.getMantissaExpression = this.getMantissaExpression.bind(this);
      this.getExponentBits = this.getExponentBits.bind(this);
      this.getMantissaBits = this.getMantissaBits.bind(this);
      this.classNameFromBitIndex = this.classNameFromBitIndex.bind(this);
      this.wrapBitsInClassName = this.wrapBitsInClassName.bind(this);
      this.getNumericMultiplier = this.getNumericMultiplier.bind(this);
  }
  getSignExpression(phase) {
      var bit = this.bits[0];
      var one = bit == 1 ? "-1" : "+1";
      if (phase > 0) {
          one += " *";
      }
      return one;
  }
  getExponentExpression(phase) {
      var expressionBits = this.getExponentBits().join('');
      var exponent = parseInt(expressionBits, 2);
      if (phase == 0)
      {
          if (this.denormalizedZeros) {
              return {__html: exponent + ' <b>subnormal</b>'};
          }
          else if (this.denormalizedOnes) {
              return {__html: exponent + ' <b>special</b>'};
          }
          return {__html: exponent};
      }
      if (phase == 1)
      {
          if (this.denormalizedZeros) {
              return "2^" + (1 - this.props.exponentBias) + " *";
          }
          else if (this.denormalizedOnes) {
              return "";
          }
          return "2^(" + exponent + " - " + this.props.exponentBias + ") *";
      }
      if (phase == 2)
      {
          if (this.denormalizedOnes) {
              return "";
          }
          var power = exponent - this.props.exponentBias;
          if (this.denormalizedZeros) {
              power = 1 - this.props.exponentBias;
          }
          //return Math.round10(Math.pow(2, power), -1 * this.props.decimalPrecision) + " *";
          return Math.pow(2, power).toPrecision(this.props.decimalPrecision) + " *";
      }
  }
  getMantissaExpression(phase) {
      var expressionBits = this.getMantissaBits().join('');
      if (this.denormalizedOnes) {
          var mantissaAllZeros = this.getMantissaBits().reduce((pre, cur) => pre && (cur == 0), true);
          if (mantissaAllZeros) {
              return "Infinity (since all zeros)";
          }
          else {
              return "NaN (since non-zero)";
          }
      }
      var leadingDigit = this.denormalizedZeros ? 0 : 1;
      if (phase == 0)
      {
          return leadingDigit + "." + expressionBits + " (binary)";
      }
      // can't parse float in base 2 :-(
      var value = parseInt(expressionBits, 2) / Math.pow(2, this.props.fractionBits);
      return leadingDigit + value;
  }
  getExponentBits() {
      return this.bits.slice(1,1+this.props.exponentBits);
  }
  getMantissaBits() {
      return this.bits.slice(1+this.props.exponentBits);
  }
  classNameFromBitIndex(index) {
      return "bitGroup " + ((Math.floor(index/4) % 2 == 0) ? "even" : "odd");
  }
  wrapBitsInClassName(bits, startingIndex) {
      var spans = [];
      var curSpanText = bits[0];
      var curClassName = this.classNameFromBitIndex(startingIndex);
      for (var i = 1; i < bits.length; ++i) {
          var newClassName = this.classNameFromBitIndex(startingIndex + i);
          if (curClassName == newClassName) {
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
  flipHexString(hexValue, hexDigits) {
      var h = hexValue.substr(0, 2);
      for (var i = 0; i < hexDigits; ++i) {
          h += hexValue.substr(2 + (hexDigits - 1 - i) * 2, 2);
      }
      return h;
  }
  getNumericMultiplier() {
      var num = parseFloat(this.props.multiplier);
      if (!isNaN(num)) {
          return num;
      }
      return 1;
  }
  render() {
    if (this.props.hexValue === '' || this.props.hexValue === 'ERROR'
      || this.props.floatingValue === '' || this.props.floatingValue === 'ERROR'
      || this.props.hexValue.length != 2 + this.props.hexDigits
      || !this.props.showExplanation)
    {
        return <div style={{'display': 'none'}}/>;
    }
    this.hexValueToUse = this.props.hexValue;
    if (this.props.flipEndianness) {
        this.hexValueToUse = this.flipHexString(this.hexValueToUse, this.props.hexDigits);
    }
    var hexDigitsTds = [];
    for (var i = 0; i < this.props.hexDigits; ++i) {
        hexDigitsTds.push(<td colSpan="4" className={"hexDigitCollapsed " + this.classNameFromBitIndex(4*i)} key={"hexDigitCollapsed" + i}>{this.hexValueToUse.substr(2 + i, 1)}</td>);
    }
    this.bits = [];
    for (var i = 0; i < this.props.hexDigits; ++i) {
        var binaryString = parseInt(this.hexValueToUse.substr(2 + i, 1), 16).toString(2);
        while (binaryString.length < 4) {
            binaryString = "0" + binaryString;
        }
        for (var j = 0; j < 4; ++j) {
            this.bits.push(binaryString.substr(j, 1));
        }
    }
    var binaryDigitsTds = [];
    for (var i = 0; i < this.bits.length; ++i) {
        binaryDigitsTds.push(<td className={"binaryDigit " + this.classNameFromBitIndex(i)} key={"binaryDigit" + i}>{this.bits[i]}</td>);
    }
    var binaryBreakdownTds = [];
    binaryBreakdownTds.push(<td className={"binaryBreakdown sign " + this.classNameFromBitIndex(0)} key="sign">{this.bits[0]}</td>);
    binaryBreakdownTds.push(<td className="binaryBreakdown exponent" key="exponent" colSpan={this.props.exponentBits}>{this.wrapBitsInClassName(this.getExponentBits(), 1)}</td>);
    binaryBreakdownTds.push(<td className="binaryBreakdown fraction" key="fraction" colSpan={this.props.fractionBits}>{this.wrapBitsInClassName(this.getMantissaBits(), 1 + this.props.exponentBits)}</td>);

    this.denormalizedZeros = this.getExponentBits().reduce((pre, cur) => pre && (cur == 0), true);
    this.denormalizedOnes = this.getExponentBits().reduce((pre, cur) => pre && (cur == 1), true);
    this.flippedDescription = this.props.flipEndianness ? ' (swapped endianness)': '';
    this.floatingValueDisplay = this.props.floatingValue;
    if (this.getNumericMultiplier() != 1) {
        var floatValue = parseFloat(this.props.floatingValue);
        if (!isNaN(floatValue)) {
            this.floatingValueDisplay = this.props.floatingValue + ' * ' + this.props.multiplier + ' = ' + (floatValue * this.getNumericMultiplier());
        }
    }
    return (
      <table className="hexFloat">
        <tbody>
          <tr><td colSpan={this.props.hexDigits * 4}>{this.hexValueToUse}{this.flippedDescription}</td></tr>
          <tr>{hexDigitsTds}</tr>
          <tr>{binaryDigitsTds}</tr>
          <tr>{binaryBreakdownTds}</tr>
          <tr><td colSpan={3}>sign</td><td colSpan={1+this.props.exponentBits-3}>exponent</td><td colSpan={this.props.hexDigits*4-(1+this.props.exponentBits)}>mantissa</td></tr>
          <tr><td colSpan={3}>{this.getSignExpression(0)}</td><td colSpan={1+this.props.exponentBits-3} dangerouslySetInnerHTML={this.getExponentExpression(0)}/><td colSpan={this.props.hexDigits*4-(1+this.props.exponentBits)}>{this.getMantissaExpression(0)}</td></tr>
          <tr><td colSpan={3}>{this.getSignExpression(1)}</td><td colSpan={1+this.props.exponentBits-3}>{this.getExponentExpression(1)}</td><td colSpan={this.props.hexDigits*4-(1+this.props.exponentBits)}>{this.getMantissaExpression(1)}</td></tr>
          <tr><td colSpan={3}>{this.getSignExpression(2)}</td><td colSpan={1+this.props.exponentBits-3}>{this.getExponentExpression(2)}</td><td colSpan={this.props.hexDigits*4-(1+this.props.exponentBits)}>{this.getMantissaExpression(2)}</td></tr>
          <tr><td colSpan={this.props.hexDigits * 4}>{this.floatingValueDisplay}</td></tr>
        </tbody>
      </table>
    );
  }
}
HexFloatBreakdown.propTypes = {
    hexValue: React.PropTypes.string.isRequired,
    floatingValue: React.PropTypes.string.isRequired,
    hexDigits: React.PropTypes.number.isRequired,
    exponentBits: React.PropTypes.number.isRequired,
    exponentBias: React.PropTypes.number.isRequired,
    fractionBits: React.PropTypes.number.isRequired,
    decimalPrecision: React.PropTypes.number.isRequired,
    showExplanation: React.PropTypes.bool,
};

var ConvertMode = {
    HEX_TO_FLOATING: 1,
    FLOATING_TO_HEX: 2
};

class HexConverter extends Component {
  constructor(props) {
      super(props);
      //console.log('HexConverter: ' + props);
      this.state = {'hexValue': "", 'floatingValue': '', 'calculatedHexValue': "", 'calculatedFloatingValue': "", 'multiplier': '1'};
      this.formStyle = {}
      if (props.marginTop) {
          this.formStyle['marginTop'] = props.marginTop + 'px';
      }
      this.topLevelRef = null;

      this.changeHexValue = this.changeHexValue.bind(this);
      this.changeFloatingValue = this.changeFloatingValue.bind(this);
      this.changeMultiplier = this.changeMultiplier.bind(this);
      this.getNumericMultiplier = this.getNumericMultiplier.bind(this);
      this.doConvert = this.doConvert.bind(this);
      this.convertToHex = this.convertToHex.bind(this);
      this.convertToFloating = this.convertToFloating.bind(this);
      this.animationEndListener = this.animationEndListener.bind(this);
      this.setTopLevelRef = this.setTopLevelRef.bind(this);
      this.addFlash = this.addFlash.bind(this);
  }
  changeHexValue(e) {
      this.setState({'hexValue': e.target.value});
  }
  changeFloatingValue(e) {
      this.setState({'floatingValue': e.target.value});
  }
  changeMultiplier(e) {
      this.setState({'multiplier': e.target.value});
  }
  parseXml(s) {
      var xmlDoc;
      if (window.DOMParser)
      {
          var parser = new DOMParser();
          xmlDoc = parser.parseFromString(s, "text/xml");
      }
      else // Internet Explorer
      {
          xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
          xmlDoc.async = false;
          xmlDoc.loadXML(s);
      }
      return xmlDoc;
  }
  doConvert(query, mode) {
      var that = this;
      fetch('floattohex.cgi?' + query).then(function(response) {
          return response.text();
      }).then(function(responseText) {
          var xmlDoc = that.parseXml(responseText);
          var hexElem = xmlDoc.documentElement.getElementsByTagName("hex")[0];
          var hexValue = hexElem.childNodes[0].nodeValue;
          var floatingElem = xmlDoc.documentElement.getElementsByTagName(that.props.floatType.toLowerCase())[0];
          while (hexValue.length < that.props.hexDigits+2) {
              hexValue = hexValue.substr(0, 2) + "0" + hexValue.substr(2);
          }
          var floatingValue = floatingElem.childNodes[0].nodeValue;
          if (mode == ConvertMode.FLOATING_TO_HEX) {
              var parsedFloatValue = parseFloat(floatingValue);
              if (!isNaN(parsedFloatValue)) {
                  floatingValue = (parsedFloatValue/that.getNumericMultiplier()).toString();
              }
          }
          that.setState({'hexValue': hexValue, 'floatingValue': floatingValue, 'calculatedHexValue': hexValue, 'calculatedFloatingValue': floatingValue, 'flash': true});
      });
  }
  getNumericMultiplier() {
      var num = parseFloat(this.state.multiplier);
      if (!isNaN(num)) {
          return num;
      }
      return 1;
  }
  convertToHex() {
      var floatValue = parseFloat(this.state.floatingValue);
      floatValue *= this.getNumericMultiplier();
      this.doConvert('action=' + this.props.floatType.toLowerCase() + 'tohex&' + this.props.floatType.toLowerCase() + '=' + floatValue.toString().replace('+', '%2B') + '&swap=' + (this.props.flipEndianness ? '1' : '0'), ConvertMode.FLOATING_TO_HEX);
  }
  convertToFloating() {
      this.doConvert('action=hexto' + this.props.floatType.toLowerCase() + '&hex=' + this.state.hexValue + '&swap=' + (this.props.flipEndianness ? '1' : '0'), ConvertMode.HEX_TO_FLOATING);
  }
  setTopLevelRef(c) {
      this.topLevelRef = c;
  }
  addFlash() {
      if (this.topLevelRef) {
          this.topLevelRef.addEventListener("animationend", this.animationEndListener, false);
          this.topLevelRef.classList.add("flash");
      }
  }
  componentDidUpdate(prevProps, prevState) {
      if (this.topLevelRef) {
          if ((this.state.calculatedHexValue && this.state.calculatedHexValue != prevState.calculatedHexValue) ||
              (this.state.calculatedFloatingValue && this.state.calculatedFloatingValue != prevState.calculatedFloatingValue)) {
              if (this.topLevelRef.classList.contains("flash")) {
                  this.topLevelRef.classList.remove("flash");
                  setTimeout(this.addFlash, 10);
              } else {
                  this.addFlash();
              }
          }
      }
  }
  animationEndListener(e) {
      if (e.type == "animationend") {
          this.topLevelRef.classList.remove("flash");
          this.topLevelRef.removeEventListener("animationend", this.animationEndListener, false);
      }
  }
  render() {
      var multiplierSpan;
      if (Config.multiplier) {
          multiplierSpan = <span>&nbsp;<label htmlFor={this.props.floatType.toLowerCase() + 'Multiplier'}>Multiplier:</label><input type="text" name={this.props.floatType.toLowerCase() + 'Multiplier'} id={this.props.floatType.toLowerCase() + 'Multiplier'} value={this.state.multiplier} onChange={this.changeMultiplier}/></span>;
      }
    return (
      <form action="javascript:void(0);" style={this.formStyle} ref={this.setTopLevelRef}>
        <p>
            <label htmlFor={'hex' + this.props.floatType}>Hex value:</label>
            <input type="text" name={'hex' + this.props.floatType} id={'hex' + this.props.floatType} value={this.state.hexValue} onChange={this.changeHexValue}/><input type="button" value={'Convert to ' + this.props.floatType.toLowerCase()} onClick={this.convertToFloating}/>
        </p>
        <HexFloatBreakdown hexValue={this.state.calculatedHexValue} floatingValue={this.state.calculatedFloatingValue} multiplier={this.state.multiplier} {...this.props}/>
        <p>
            <label htmlFor={this.props.floatType.toLowerCase() + 'Hex'}>{this.props.floatType + ' value:'}</label>
            <input type="text" name={this.props.floatType.toLowerCase() + 'Hex'} id={this.props.floatType.toLowerCase() + 'Hex'} value={this.state.floatingValue} onChange={this.changeFloatingValue}/>{multiplierSpan}<input type="button" value='Convert to hex' onClick={this.convertToHex}/>
        </p>
      </form>
    );
  }
}
HexConverter.propTypes = {
    floatType: React.PropTypes.string.isRequired,
    hexDigits: React.PropTypes.number.isRequired,
    exponentBits: React.PropTypes.number.isRequired,
    fractionBits: React.PropTypes.number.isRequired,
    exponentBias: React.PropTypes.number.isRequired,
    decimalPrecision: React.PropTypes.number.isRequired,
    marginTop: React.PropTypes.number,
    flash: React.PropTypes.bool,
    showExplanation: React.PropTypes.bool,
};

export class App extends Component {
  constructor(props) {
      super(props);
      // parse query hash
      var showExplanation = true;
      if (window.location.search) {
          var hash = window.location.search.substring(1);
          var parts = hash.split('&');
          for (var i = 0; i < parts.length; ++i) {
              // hacky
              if (parts[i] == 'showExplanation=0') {
                  showExplanation = false;
              }
          }
      }
      this.state = {'showExplanation': showExplanation};

      this.handleExplanationChange = this.handleExplanationChange.bind(this);
      this.handleEndiannessChange = this.handleEndiannessChange.bind(this);
  }
  handleExplanationChange(event) {
      // a little hacky?
      this.setState({'showExplanation': !this.state.showExplanation});
  }
  handleEndiannessChange(event) {
      // a little hacky?
      this.setState({'flipEndianness': !this.state.flipEndianness});
  }
  render() {
    return (
      <div>
        <div><input type="checkbox" checked={this.state.showExplanation} id="showExplanation" onChange={this.handleExplanationChange}/>&nbsp;<label htmlFor="showExplanation">Show details</label>&nbsp;<input type="checkbox" checked={this.state.flipEndianness} id="flipEndianness" onChange={this.handleEndiannessChange}/>&nbsp;<label htmlFor="flipEndianness">Swap endianness</label></div>
        <HexConverter floatType="Float" hexDigits={8} exponentBits={8} fractionBits={23} exponentBias={127} decimalPrecision={9} showExplanation={this.state.showExplanation} flipEndianness={this.state.flipEndianness}/>
        <HexConverter marginTop={50} floatType="Double" hexDigits={16} exponentBits={11} fractionBits={52} exponentBias={1023} decimalPrecision={17} showExplanation={this.state.showExplanation} flipEndianness={this.state.flipEndianness}/>
      </div>
    );
  }
}
