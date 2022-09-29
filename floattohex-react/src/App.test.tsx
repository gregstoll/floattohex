import React from 'react';
import ReactDOM from 'react-dom';
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
function getHexFloatBreakdown(floatOrDouble: FloatOrDouble, hexValue: string, floatingValue: string) : LocalApp.HexFloatBreakdown {
  let floatingPointProps = floatOrDouble == FloatOrDouble.FLOAT ? LocalApp.FLOAT_PARAMS : LocalApp.DOUBLE_PARAMS;
  let props : LocalApp.HexFloatBreakdownProps = {
    multiplier: "1",
    flipEndianness: false,
    showExplanation: true,
    hexValue,
    floatingValue,
    uppercaseLetters: false,
    ...floatingPointProps
  };
  return new LocalApp.HexFloatBreakdown(props);
}

test.each([["10000000", "-1"],
           ["00000001", "+1"]])('getSignExpression %s', (hexValue: string, expected: string) => {
            let breakdown = getHexFloatBreakdown(FloatOrDouble.FLOAT, hexValue, "0");
            expect(breakdown.getSignExpression(hexValue.split(""), LocalApp.BreakdownPhase.RAW_BITS)).toBe(expected);
            expect(breakdown.getSignExpression(hexValue.split(""), LocalApp.BreakdownPhase.INTERMEDIATE)).toContain(expected);
            expect(breakdown.getSignExpression(hexValue.split(""), LocalApp.BreakdownPhase.FLOAT_VALUES)).toContain(expected);
           });

test.each([["0x00000000", "0 <b>subnormal</b>", "2^-126 *", "1.17549435e-38 *"],
           ["0xc0900000", "129", "2^(129 - 127) *", "4.00000000 *"]])
           ('getExponentExpression float %s', (hexValue: string, expectedRawBits: string, expectedIntermediatedValues: string, expectedFloatValues: string) => {
            let breakdown = getHexFloatBreakdown(FloatOrDouble.FLOAT, hexValue, "0");
            expect(breakdown.getExponentExpression(breakdown.getBits(), LocalApp.BreakdownPhase.RAW_BITS)).toStrictEqual({__html: expectedRawBits});
            expect(breakdown.getExponentExpression(breakdown.getBits(), LocalApp.BreakdownPhase.INTERMEDIATE)).toStrictEqual({__html: expectedIntermediatedValues});
            expect(breakdown.getExponentExpression(breakdown.getBits(), LocalApp.BreakdownPhase.FLOAT_VALUES)).toStrictEqual({__html: expectedFloatValues});
           });