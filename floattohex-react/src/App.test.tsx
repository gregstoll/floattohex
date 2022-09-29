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
function getHexFloatBreakdown(floatOrDouble: FloatOrDouble, hexValue: string, floatingValue: string, denormalized : boolean) : LocalApp.HexFloatBreakdown {
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
            let breakdown = getHexFloatBreakdown(FloatOrDouble.FLOAT, hexValue, "0", false);
            expect(breakdown.getSignExpression(hexValue.split(""), LocalApp.BreakdownPhase.RAW_BITS)).toBe(expected);
            expect(breakdown.getSignExpression(hexValue.split(""), LocalApp.BreakdownPhase.INTERMEDIATE)).toContain(expected);
            expect(breakdown.getSignExpression(hexValue.split(""), LocalApp.BreakdownPhase.FLOAT_VALUES)).toContain(expected);
           });