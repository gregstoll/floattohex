import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App, * as LocalApp from './App';
import { createRoot } from 'react-dom/client';

it('renders without crashing', () => {
  const div = document.createElement('div');
  const root = createRoot(div);
  root.render(<App />);
  root.unmount();
});

enum FloatOrDouble {
  FLOAT,
  DOUBLE
}
function getHexFloatBreakdownProps(floatOrDouble: FloatOrDouble, hexValue: string, floatingValue: string, coercedFromFloatingValue: string) : LocalApp.HexFloatBreakdownProps {
  let floatingPointProps = floatOrDouble == FloatOrDouble.FLOAT ? LocalApp.FLOAT_PARAMS : LocalApp.DOUBLE_PARAMS;
  let props: LocalApp.HexFloatBreakdownProps = {
    multiplier: "1",
    flipEndianness: false,
    showExplanation: true,
    hexValue,
    floatingValue,
    coercedFromFloatingValue: coercedFromFloatingValue,
    uppercaseLetters: false,
    ...floatingPointProps
  };
  return props;
}
function getHexFloatBreakdown(floatOrDouble: FloatOrDouble, hexValue: string, floatingValue: string, coercedFromFloatingValue: string) : LocalApp.HexFloatBreakdown {
  let props: LocalApp.HexFloatBreakdownProps = getHexFloatBreakdownProps(floatOrDouble, hexValue, floatingValue, coercedFromFloatingValue);
  return new LocalApp.HexFloatBreakdown(props);
}

test('switching from non-denormalized to denormalized zeros', () => {
  let props = getHexFloatBreakdownProps(FloatOrDouble.FLOAT, "0x40900000", "0", "");
  const {rerender} = render(<LocalApp.HexFloatBreakdown {...props}/>);
  // re-render the same component with different props
  props.hexValue = "0x00000000";
  rerender(<LocalApp.HexFloatBreakdown {...props}/>);
  let exponentTableLabel = screen.getByText("exponent");
  let exponentFirstEntryTd = exponentTableLabel.parentElement!.nextSibling?.childNodes.item(1)!;
  expect((exponentFirstEntryTd as HTMLElement).innerHTML).toBe("0 <b>subnormal</b>");
});

test('switching from non-denormalized to denormalized ones', () => {
  let props = getHexFloatBreakdownProps(FloatOrDouble.FLOAT, "0x40900000", "0", "");
  const {rerender} = render(<LocalApp.HexFloatBreakdown {...props}/>);
  // re-render the same component with different props
  props.hexValue = "0x7ff00000";
  rerender(<LocalApp.HexFloatBreakdown {...props}/>);
  let exponentTableLabel = screen.getByText("exponent");
  let exponentFirstEntryTd = exponentTableLabel.parentElement!.nextSibling?.childNodes.item(1)!;
  expect((exponentFirstEntryTd as HTMLElement).innerHTML).toBe("255 <b>special</b>");
});

test('switching from denormalized zeros to non-denormalized', () => {
  let props = getHexFloatBreakdownProps(FloatOrDouble.FLOAT, "0x00000000", "0", "");
  const {rerender} = render(<LocalApp.HexFloatBreakdown {...props}/>);
  // re-render the same component with different props
  props.hexValue = "0x40900000";
  rerender(<LocalApp.HexFloatBreakdown {...props}/>);
  let exponentTableLabel = screen.getByText("exponent");
  let exponentFirstEntryTd = exponentTableLabel.parentElement!.nextSibling?.childNodes.item(1)!;
  expect((exponentFirstEntryTd as HTMLElement).innerHTML).toBe("129");
});

test('switching from denormalized ones to non-denormalized', () => {
  let props = getHexFloatBreakdownProps(FloatOrDouble.FLOAT, "0x7ff00000", "0", "");
  const {rerender} = render(<LocalApp.HexFloatBreakdown {...props}/>);
  // re-render the same component with different props
  props.hexValue = "0x40900000";
  rerender(<LocalApp.HexFloatBreakdown {...props}/>);
  let exponentTableLabel = screen.getByText("exponent");
  let exponentFirstEntryTd = exponentTableLabel.parentElement!.nextSibling?.childNodes.item(1)!;
  expect((exponentFirstEntryTd as HTMLElement).innerHTML).toBe("129");
});

test('flipHexBreakdown', () => {
  let breakdown = getHexFloatBreakdown(FloatOrDouble.FLOAT, "0x00000000", "0", "");
  expect(breakdown.flipHexString("0x1234ABCD", 8)).toBe("0xCDAB3412");
});

test('noCoercedFloatValue', () => {
    let props : LocalApp.HexConverterProps = {
      uppercaseLetters: false,
      showExplanation: true,
      flipEndianness: false,
      ...LocalApp.FLOAT_PARAMS
    }
  let hexConverter = new LocalApp.HexConverter(props);
  let xml = "<values><float>4.5</float><hex>0x40900000</hex></values>";
  let newState = hexConverter.getConvertResultState(xml, LocalApp.ConvertMode.FLOATING_TO_HEX)!;
  expect(newState.coercedFromFloatingValue).toBeFalsy();
  expect(newState.hexValue).toBe("0x40900000");
  expect(newState.floatingValue).toBe("4.5");
});

test('coercedFloatValue', () => {
    let props : LocalApp.HexConverterProps = {
      uppercaseLetters: false,
      showExplanation: true,
      flipEndianness: false,
      ...LocalApp.FLOAT_PARAMS
    }
  let hexConverter = new LocalApp.HexConverter(props);
  let xml = "<values><float>4.500243111</float><hex>0x409001fe</hex><coercedFloat>4.500243</coercedFloat></values>"
  let newState = hexConverter.getConvertResultState(xml, LocalApp.ConvertMode.FLOATING_TO_HEX)!;
  expect(newState.coercedFromFloatingValue).toBe("4.500243111");
  expect(newState.hexValue).toBe("0x409001fe");
  expect(newState.floatingValue).toBe("4.500243");
});

test.each([["0x12ab34CD", false, "0x12ab34cd"],
           ["0x12ab34CD", true, "0x12AB34CD"]])('HexConverter.displayHex %s uppercase:%s', (hexValue: string, uppercase: boolean, expected: string) => {
            let props : LocalApp.HexConverterProps = {
              uppercaseLetters: uppercase,
              showExplanation: true,
              flipEndianness: false,
              ...LocalApp.FLOAT_PARAMS
            }
            let hexConverter = new LocalApp.HexConverter(props);
            expect(hexConverter.displayHex(hexValue)).toBe(expected);
           });

test.each([
  ["0x00000000", false, "00000000000000000000000000000000"],
  ["0x00000000", true, "00000000000000000000000000000000"],
  ["0xffffffff", false, "11111111111111111111111111111111"],
  ["0xffffffff", true, "11111111111111111111111111111111"],
  ["0x12AB34CD", false, "00010010101010110011010011001101"],
  ["0x12AB34CD", true, "11001101001101001010101100010010"],
])('getBits %s flip:%s', (hexValue: string, flipEndianness: boolean, expectedBits: string) => {
    let props = getHexFloatBreakdownProps(FloatOrDouble.FLOAT, hexValue, "0", "");
    props.flipEndianness = flipEndianness;
    let breakdown = new LocalApp.HexFloatBreakdown(props);
    expect(breakdown.getBits().join("")).toBe(expectedBits);
  });

test.each([["10000000", "-1"],
           ["00000001", "+1"]])('getSignExpression %s', (hexValue: string, expected: string) => {
            let breakdown = getHexFloatBreakdown(FloatOrDouble.FLOAT, hexValue, "0", "");
            expect(breakdown.getSignExpression(hexValue.split(""), LocalApp.BreakdownPhase.RAW_BITS)).toBe(expected);
            expect(breakdown.getSignExpression(hexValue.split(""), LocalApp.BreakdownPhase.INTERMEDIATE)).toContain(expected);
            expect(breakdown.getSignExpression(hexValue.split(""), LocalApp.BreakdownPhase.FLOAT_VALUES)).toContain(expected);
           });

test.each([
  ["0x00000000", "0 <b>subnormal</b>", "2^-126 *", "1.17549435e-38 *"],
  ["0x80000000", "0 <b>subnormal</b>", "2^-126 *", "1.17549435e-38 *"],
  ["0x40900000", "129", "2^(129 - 127) *", "4.00000000 *"],
  ["0xc0900000", "129", "2^(129 - 127) *", "4.00000000 *"],
  ["0x7fc00000", "255 <b>special</b>", "", ""],
  ["0x7f800000", "255 <b>special</b>", "", ""],
  ["0xff800000", "255 <b>special</b>", "", ""],
  ["0x00000001", "0 <b>subnormal</b>", "2^-126 *", "1.17549435e-38 *"],
  ["0x80000001", "0 <b>subnormal</b>", "2^-126 *", "1.17549435e-38 *"],
])
           ('getExponentExpression float %s', (hexValue: string, expectedRawBits: string, expectedIntermediatedValues: string, expectedFloatValues: string) => {
            let breakdown = getHexFloatBreakdown(FloatOrDouble.FLOAT, hexValue, "0", "");
            expect(breakdown.getExponentExpression(breakdown.getBits(), LocalApp.BreakdownPhase.RAW_BITS)).toStrictEqual({__html: expectedRawBits});
            expect(breakdown.getExponentExpression(breakdown.getBits(), LocalApp.BreakdownPhase.INTERMEDIATE)).toStrictEqual({__html: expectedIntermediatedValues});
            expect(breakdown.getExponentExpression(breakdown.getBits(), LocalApp.BreakdownPhase.FLOAT_VALUES)).toStrictEqual({__html: expectedFloatValues});
           });

test.each([
  ["0x0000000000000000", "0 <b>subnormal</b>", "2^-1022 *", "2.2250738585072014e-308 *"],
  ["0x8000000000000000", "0 <b>subnormal</b>", "2^-1022 *", "2.2250738585072014e-308 *"],
  ["0x4012000000000000", "1025", "2^(1025 - 1023) *", "4.0000000000000000 *"],
  ["0xc012000000000000", "1025", "2^(1025 - 1023) *", "4.0000000000000000 *"],
  ["0x7ff8000000000000", "2047 <b>special</b>", "", ""],
  ["0x7ff0000000000000", "2047 <b>special</b>", "", ""],
  ["0xfff0000000000000", "2047 <b>special</b>", "", ""],
  ["0x0000000000000001", "0 <b>subnormal</b>", "2^-1022 *", "2.2250738585072014e-308 *"],
  ["0x8000000000000001", "0 <b>subnormal</b>", "2^-1022 *", "2.2250738585072014e-308 *"],
])
           ('getExponentExpression double %s', (hexValue: string, expectedRawBits: string, expectedIntermediatedValues: string, expectedFloatValues: string) => {
            let breakdown = getHexFloatBreakdown(FloatOrDouble.DOUBLE, hexValue, "0", "");
            expect(breakdown.getExponentExpression(breakdown.getBits(), LocalApp.BreakdownPhase.RAW_BITS)).toStrictEqual({__html: expectedRawBits});
            expect(breakdown.getExponentExpression(breakdown.getBits(), LocalApp.BreakdownPhase.INTERMEDIATE)).toStrictEqual({__html: expectedIntermediatedValues});
            expect(breakdown.getExponentExpression(breakdown.getBits(), LocalApp.BreakdownPhase.FLOAT_VALUES)).toStrictEqual({__html: expectedFloatValues});
           });

test.each([
  ["0x00000000", "0.00000000000000000000000 (binary)", 0, 0],
  ["0x80000000", "0.00000000000000000000000 (binary)", 0, 0],
  ["0x40900000", "1.00100000000000000000000 (binary)", 1.125, 1.125],
  ["0xc0900000", "1.00100000000000000000000 (binary)", 1.125, 1.125],
  ["0x7fc00000", "NaN (since non-zero)", "NaN (since non-zero)", "NaN (since non-zero)"],
  ["0x7f800000", "Infinity (since all zeros)", "Infinity (since all zeros)", "Infinity (since all zeros)"],
  ["0xff800000", "Infinity (since all zeros)", "Infinity (since all zeros)", "Infinity (since all zeros)"],
  ["0x00000001", "0.00000000000000000000001 (binary)", 1.1920928955078125e-7, 1.1920928955078125e-7],
  ["0x80000001", "0.00000000000000000000001 (binary)", 1.1920928955078125e-7, 1.1920928955078125e-7],
])
           ('getMantissaExpression float %s', (hexValue: string, expectedRawBits: string, expectedIntermediatedValues: number|string, expectedFloatValues: number|string) => {
            let breakdown = getHexFloatBreakdown(FloatOrDouble.FLOAT, hexValue, "0", "");
            expect(breakdown.getMantissaExpression(breakdown.getBits(), LocalApp.BreakdownPhase.RAW_BITS)).toBe(expectedRawBits);
            expect(breakdown.getMantissaExpression(breakdown.getBits(), LocalApp.BreakdownPhase.INTERMEDIATE)).toBe(expectedIntermediatedValues);
            expect(breakdown.getMantissaExpression(breakdown.getBits(), LocalApp.BreakdownPhase.FLOAT_VALUES)).toBe(expectedFloatValues);
           });

test.each([
  ["0x0000000000000000", "0.0000000000000000000000000000000000000000000000000000 (binary)", 0, 0],
  ["0x8000000000000000", "0.0000000000000000000000000000000000000000000000000000 (binary)", 0, 0],
  ["0x4012000000000000", "1.0010000000000000000000000000000000000000000000000000 (binary)", 1.125, 1.125],
  ["0xc012000000000000", "1.0010000000000000000000000000000000000000000000000000 (binary)", 1.125, 1.125],
  ["0x7ff8000000000000", "NaN (since non-zero)", "NaN (since non-zero)", "NaN (since non-zero)"],
  ["0x7ff0000000000000", "Infinity (since all zeros)", "Infinity (since all zeros)", "Infinity (since all zeros)"],
  ["0xfff0000000000000", "Infinity (since all zeros)", "Infinity (since all zeros)", "Infinity (since all zeros)"],
  ["0x0000000000000001", "0.0000000000000000000000000000000000000000000000000001 (binary)", 2.220446049250313e-16, 2.220446049250313e-16],
  ["0x8000000000000001", "0.0000000000000000000000000000000000000000000000000001 (binary)", 2.220446049250313e-16, 2.220446049250313e-16],
])
           ('getMantissaExpression double %s', (hexValue: string, expectedRawBits: string, expectedIntermediatedValues: number|string, expectedFloatValues: number|string) => {
            let breakdown = getHexFloatBreakdown(FloatOrDouble.DOUBLE, hexValue, "0", "");
            expect(breakdown.getMantissaExpression(breakdown.getBits(), LocalApp.BreakdownPhase.RAW_BITS)).toBe(expectedRawBits);
            expect(breakdown.getMantissaExpression(breakdown.getBits(), LocalApp.BreakdownPhase.INTERMEDIATE)).toBe(expectedIntermediatedValues);
            expect(breakdown.getMantissaExpression(breakdown.getBits(), LocalApp.BreakdownPhase.FLOAT_VALUES)).toBe(expectedFloatValues);
           });