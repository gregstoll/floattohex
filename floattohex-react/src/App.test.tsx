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
function getHexFloatBreakdownProps(floatOrDouble: FloatOrDouble, hexValue: string, floatingValue: string) : LocalApp.HexFloatBreakdownProps {
  let floatingPointProps = floatOrDouble == FloatOrDouble.FLOAT ? LocalApp.FLOAT_PARAMS : LocalApp.DOUBLE_PARAMS;
  let props: LocalApp.HexFloatBreakdownProps = {
    multiplier: "1",
    flipEndianness: false,
    showExplanation: true,
    hexValue,
    floatingValue,
    uppercaseLetters: false,
    ...floatingPointProps
  };
  return props;
}
function getHexFloatBreakdown(floatOrDouble: FloatOrDouble, hexValue: string, floatingValue: string) : LocalApp.HexFloatBreakdown {
  let props: LocalApp.HexFloatBreakdownProps = getHexFloatBreakdownProps(floatOrDouble, hexValue, floatingValue);
  return new LocalApp.HexFloatBreakdown(props);
}

test('switching from non-denormalized to denormalized zeros', () => {
  let props = getHexFloatBreakdownProps(FloatOrDouble.FLOAT, "0x40900000", "0");
  const {rerender} = render(<LocalApp.HexFloatBreakdown {...props}/>);
  // re-render the same component with different props
  props.hexValue = "0x00000000";
  rerender(<LocalApp.HexFloatBreakdown {...props}/>);
  let exponentTableLabel = screen.getByText("exponent");
  let exponentFirstEntryTd = exponentTableLabel.parentElement!.nextSibling?.childNodes.item(1)!;
  expect((exponentFirstEntryTd as HTMLElement).innerHTML).toBe("0 <b>subnormal</b>");
});

test('switching from non-denormalized to denormalized ones', () => {
  let props = getHexFloatBreakdownProps(FloatOrDouble.FLOAT, "0x40900000", "0");
  const {rerender} = render(<LocalApp.HexFloatBreakdown {...props}/>);
  // re-render the same component with different props
  props.hexValue = "0x7ff00000";
  rerender(<LocalApp.HexFloatBreakdown {...props}/>);
  let exponentTableLabel = screen.getByText("exponent");
  let exponentFirstEntryTd = exponentTableLabel.parentElement!.nextSibling?.childNodes.item(1)!;
  expect((exponentFirstEntryTd as HTMLElement).innerHTML).toBe("255 <b>special</b>");
});

test.each([["10000000", "-1"],
           ["00000001", "+1"]])('getSignExpression %s', (hexValue: string, expected: string) => {
            let breakdown = getHexFloatBreakdown(FloatOrDouble.FLOAT, hexValue, "0");
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
            let breakdown = getHexFloatBreakdown(FloatOrDouble.FLOAT, hexValue, "0");
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
            let breakdown = getHexFloatBreakdown(FloatOrDouble.DOUBLE, hexValue, "0");
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
            let breakdown = getHexFloatBreakdown(FloatOrDouble.FLOAT, hexValue, "0");
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
            let breakdown = getHexFloatBreakdown(FloatOrDouble.DOUBLE, hexValue, "0");
            expect(breakdown.getMantissaExpression(breakdown.getBits(), LocalApp.BreakdownPhase.RAW_BITS)).toBe(expectedRawBits);
            expect(breakdown.getMantissaExpression(breakdown.getBits(), LocalApp.BreakdownPhase.INTERMEDIATE)).toBe(expectedIntermediatedValues);
            expect(breakdown.getMantissaExpression(breakdown.getBits(), LocalApp.BreakdownPhase.FLOAT_VALUES)).toBe(expectedFloatValues);
           });