import React, { Component } from 'react';
import { NICE, SUPER_NICE } from './colors';

// https://stackoverflow.com/questions/34107925/node-referenceerror-promise-is-not-defined
var Promise = require('promise')

require('./style.less')

class HexFloatBreakdown extends Component {
  constructor(props) {
      super(props);
      this.getSignExpression = this.getSignExpression.bind(this);
      this.getExponentExpression = this.getExponentExpression.bind(this);
      this.getMantissaExpression = this.getMantissaExpression.bind(this);
      this.getExponentBits = this.getExponentBits.bind(this);
      this.getMantissaBits = this.getMantissaBits.bind(this);
  }
  getSignExpression(bits, phase) {
      var bit = bits[0];
      var one = bit == 1 ? "-1" : "+1";
      if (phase > 0) {
          one += " *";
      }
      return one;
  }
  getExponentExpression(bits, phase) {
      var expressionBits = this.getExponentBits(bits).join('');
      var exponent = parseInt(expressionBits, 2);
      if (phase == 0)
      {
          return exponent;
      }
      if (phase == 1)
      {
          return "2^(" + exponent + " - " + this.props.exponentBias + ") *";
      }
      if (phase == 2)
      {
          return Math.pow(2, exponent - this.props.exponentBias) + " *";
      }
  }
  getMantissaExpression(bits, phase) {
      var expressionBits = this.getMantissaBits(bits).join('');
      if (phase == 0)
      {
          return "1." + expressionBits;
      }
      // can't parse float in base 2 :-(
      var value = parseInt(expressionBits, 2) / Math.pow(2, this.props.fractionBits);
      return 1.0 + value;
  }
  getExponentBits(bits) {
      return bits.slice(1,1+this.props.exponentBits);
  }
  getMantissaBits(bits) {
      return bits.slice(1+this.props.exponentBits);
  }
  render() {
    if (this.props.hexValue === '' || this.props.hexValue === 'ERROR'
      || this.props.floatingValue === '' || this.props.floatingValue === 'ERROR'
      || this.props.hexValue.length != 2 + this.props.hexDigits)
    {
        return <div style={{'display': 'none'}}/>;
    }
    var hexDigitsTds = [];
    for (var i = 0; i < this.props.hexDigits; ++i) {
        hexDigitsTds.push(<td colSpan="4" className="hexDigitCollapsed" key={"hexDigitCollapsed" + i}>{this.props.hexValue.substr(2 + i, 1)}</td>);
    }
    var binaryDigitsTds = [];
    var bits = [];
    for (var i = 0; i < this.props.hexDigits; ++i) {
        var binaryString = parseInt(this.props.hexValue.substr(2 + i, 1), 16).toString(2);
        while (binaryString.length < 4) {
            binaryString = "0" + binaryString;
        }
        for (var j = 0; j < 4; ++j) {
            bits.push(binaryString.substr(j, 1));
            binaryDigitsTds.push(<td className="binaryDigit" key={"binaryDigit" + (4*i+j)}>{binaryString.substr(j, 1)}</td>);
        }
    }
    var binaryBreakdownTds = [];
    binaryBreakdownTds.push(<td className="binaryBreakdown sign" key="sign">{bits[0]}</td>);
    binaryBreakdownTds.push(<td className="binaryBreakdown exponent" key="exponent" colSpan={this.props.exponentBits}>{this.getExponentBits(bits)}</td>);
    binaryBreakdownTds.push(<td className="binaryBreakdown fraction" key="fraction" colSpan={this.props.fractionBits}>{this.getMantissaBits(bits)}</td>);

    return (
      <table>
        <tbody>
          <tr><td colSpan={this.props.hexDigits * 4}>{this.props.hexValue}</td></tr>
          <tr>{hexDigitsTds}</tr>
          <tr>{binaryDigitsTds}</tr>
          <tr>{binaryBreakdownTds}</tr>
          <tr><td colSpan={3}>sign</td><td colSpan={1+this.props.exponentBits-3}>exponent</td><td colSpan={this.props.hexDigits*4-(1+this.props.exponentBits)}>mantissa</td></tr>
          <tr><td colSpan={3}>{this.getSignExpression(bits, 0)}</td><td colSpan={1+this.props.exponentBits-3}>{this.getExponentExpression(bits, 0)}</td><td colSpan={this.props.hexDigits*4-(1+this.props.exponentBits)}>{this.getMantissaExpression(bits, 0)}</td></tr>
          <tr><td colSpan={3}>{this.getSignExpression(bits, 1)}</td><td colSpan={1+this.props.exponentBits-3}>{this.getExponentExpression(bits, 1)}</td><td colSpan={this.props.hexDigits*4-(1+this.props.exponentBits)}>{this.getMantissaExpression(bits, 1)}</td></tr>
          <tr><td colSpan={3}>{this.getSignExpression(bits, 2)}</td><td colSpan={1+this.props.exponentBits-3}>{this.getExponentExpression(bits, 2)}</td><td colSpan={this.props.hexDigits*4-(1+this.props.exponentBits)}>{this.getMantissaExpression(bits, 2)}</td></tr>
          <tr><td colSpan={this.props.hexDigits * 4}>{this.props.floatingValue}</td></tr>
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
};

class HexConverter extends Component {
  constructor(props) {
      super(props);
      this.state = {'hexValue': "", 'floatingValue': '', 'calculatedHexValue': "", 'calculatedFloatingValue': ""}; 
      this.formStyle = {}
      if (props.marginTop) {
          this.formStyle['marginTop'] = props.marginTop + 'px';
      }
      this.changeHexValue = this.changeHexValue.bind(this);
      this.changeFloatingValue = this.changeFloatingValue.bind(this);
      this.doConvert = this.doConvert.bind(this);
      this.convertToHex = this.convertToHex.bind(this);
      this.convertToFloating = this.convertToFloating.bind(this);
  }
  changeHexValue(e) {
      this.setState({'hexValue': e.target.value});
  }
  changeFloatingValue(e) {
      this.setState({'floatingValue': e.target.value});
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
  doConvert(query) {
      var that = this;
      fetch('floattohex.cgi?' + query).then(function(response) {
          return response.text();
      }).then(function(responseText) {
          var xmlDoc = that.parseXml(responseText);
          var hexElem = xmlDoc.documentElement.getElementsByTagName("hex")[0];
          var hexValue = hexElem.childNodes[0].nodeValue;
          var floatingElem = xmlDoc.documentElement.getElementsByTagName(that.props.floatType.toLowerCase())[0];
          var floatingValue = floatingElem.childNodes[0].nodeValue;
          that.setState({'hexValue': hexValue, 'floatingValue': floatingValue, 'calculatedHexValue': hexValue, 'calculatedFloatingValue': floatingValue});
      });
  }
  convertToHex() {
      this.doConvert('action=' + this.props.floatType.toLowerCase() + 'tohex&' + this.props.floatType.toLowerCase() + '=' + this.state.floatingValue);
  }
  convertToFloating() {
      this.doConvert('action=hexto' + this.props.floatType.toLowerCase() + '&hex=' + this.state.hexValue);
  }
  render() {
    return (
      <form action="javascript:void(0);" style={this.formStyle}>
        <p>
            <label htmlFor={'hex' + this.props.floatType}>Hex value:</label>
            <input type="text" name={'hex' + this.props.floatType} id={'hex' + this.props.floatType} value={this.state.hexValue} onChange={this.changeHexValue}/><input type="button" value={'Convert to ' + this.props.floatType.toLowerCase()} onClick={this.convertToFloating}/>
        </p>
        <HexFloatBreakdown hexValue={this.state.calculatedHexValue} floatingValue={this.state.calculatedFloatingValue} hexDigits={this.props.hexDigits} exponentBits={this.props.exponentBits} fractionBits={this.props.fractionBits} exponentBias={this.props.exponentBias}/>
        <p>
            <label htmlFor={this.props.floatType.toLowerCase() + 'Hex'}>{this.props.floatType + ' value:'}</label>
            <input type="text" name={this.props.floatType.toLowerCase() + 'Hex'} id={this.props.floatType.toLowerCase() + 'Hex'} value={this.state.floatingValue} onChange={this.changeFloatingValue}/><input type="button" value='Convert to hex' onClick={this.convertToHex}/>
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
    marginTop: React.PropTypes.number,
};

export class App extends Component {
  render() {
    return (
      <div>
        <HexConverter floatType="Float" hexDigits={8} exponentBits={8} fractionBits={23} exponentBias={127}/>
        <HexConverter marginTop={50} floatType="Double" hexDigits={16} exponentBits={11} fractionBits={52} exponentBias={1023}/>
      </div>
    );
  }
}
