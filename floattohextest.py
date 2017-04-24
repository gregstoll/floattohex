#!/usr/bin/python3

import unittest
import xml.etree.ElementTree
from floattohex import *
from io import StringIO

def captureStdout(func):
    # https://stackoverflow.com/questions/5136611/capture-stdout-from-a-script-in-python
    # setup the environment
    backup = sys.stdout

    # ####
    sys.stdout = StringIO()     # capture output
    func()
    out = sys.stdout.getvalue() # release output
    # ####

    sys.stdout.close()  # close the stream 
    sys.stdout = backup # restore original stdout
    return out

class FloatToHexTest(unittest.TestCase):
    def checkHeaderAndStrip(self, s):
        HEADER = "Content-type: text/xml\n"
        self.assertTrue(s.startswith(HEADER))
        return s[len(HEADER):]

    def checkFloatHex(self, s, f, h):
        s = self.checkHeaderAndStrip(s)
        e = xml.etree.ElementTree.fromstring(s)
        self.assertEqual(f, e.find('float').text)
        self.assertEqual(h, e.find('hex').text)

    def checkDoubleHex(self, s, d, h):
        s = self.checkHeaderAndStrip(s)
        e = xml.etree.ElementTree.fromstring(s)
        self.assertEqual(d, e.find('double').text)
        self.assertEqual(h, e.find('hex').text)

    def checkHexToFloatError(self, s):
        s = self.checkHeaderAndStrip(s)
        e = xml.etree.ElementTree.fromstring(s)
        self.assertEqual('ERROR', e.find('float').text)
        self.assertEqual('None', e.find('hex').text)

    def checkHexToDoubleError(self, s):
        s = self.checkHeaderAndStrip(s)
        e = xml.etree.ElementTree.fromstring(s)
        self.assertEqual('ERROR', e.find('double').text)
        self.assertEqual('None', e.find('hex').text)

class TestFloatToHex(FloatToHexTest):
    def test_05(self):
        out = captureStdout(lambda: handleFloatToHex(0.5))
        self.checkFloatHex(out, '0.5', '0x3f000000')

    def test_05_swap(self):
        out = captureStdout(lambda: handleFloatToHex(0.5, True))
        self.checkFloatHex(out, '0.5', '0x0000003f')

    def test_2(self):
        out = captureStdout(lambda: handleFloatToHex(2))
        self.checkFloatHex(out, '2', '0x40000000')

    def test_2_swap(self):
        out = captureStdout(lambda: handleFloatToHex(2, True))
        self.checkFloatHex(out, '2', '0x00000040')

    def test_neg2(self):
        out = captureStdout(lambda: handleFloatToHex(-2))
        self.checkFloatHex(out, '-2', '0xc0000000')

    def test_neg2_swap(self):
        out = captureStdout(lambda: handleFloatToHex(-2, True))
        self.checkFloatHex(out, '-2', '0x000000c0')

    def test_userbug(self):
        out = captureStdout(lambda: handleFloatToHex(2435.49))
        self.checkFloatHex(out, '2435.49', '0x451837d7')

    def test_userbug_swap(self):
        out = captureStdout(lambda: handleFloatToHex(2435.49, True))
        self.checkFloatHex(out, '2435.49', '0xd7371845')

    def test_highlowbyte(self):
        out = captureStdout(lambda: handleFloatToHex(1.0002))
        self.checkFloatHex(out, '1.0002', '0x3f80068e')

    def test_highlowbyte_swap(self):
        out = captureStdout(lambda: handleFloatToHex(1.0002, True))
        self.checkFloatHex(out, '1.0002', '0x8e06803f')

    def test_0(self):
        out = captureStdout(lambda: handleFloatToHex(0))
        self.checkFloatHex(out, '0', '0x00000000')

    def test_0_swap(self):
        out = captureStdout(lambda: handleFloatToHex(0, True))
        self.checkFloatHex(out, '0', '0x00000000')

    def test_neg0(self):
        out = captureStdout(lambda: handleFloatToHex(float("-0.0")))
        self.checkFloatHex(out, '-0', '0x80000000')

    def test_neg0_swap(self):
        out = captureStdout(lambda: handleFloatToHex(float("-0.0"), True))
        self.checkFloatHex(out, '-0', '0x00000080')

class TestHexToFloat(FloatToHexTest):
    def test_05(self):
        out = captureStdout(lambda: handleHexToFloat('0x3f000000'))
        self.checkFloatHex(out, '0.5', '0x3f000000')

    def test_05_swap(self):
        out = captureStdout(lambda: handleHexToFloat('0x0000003f', True))
        self.checkFloatHex(out, '0.5', '0x0000003f')

    def test_2(self):
        out = captureStdout(lambda: handleHexToFloat('0x40000000'))
        self.checkFloatHex(out, '2', '0x40000000')

    def test_2_swap(self):
        out = captureStdout(lambda: handleHexToFloat('0x00000040', True))
        self.checkFloatHex(out, '2', '0x00000040')

    def test_neg2(self):
        out = captureStdout(lambda: handleHexToFloat('0xc0000000'))
        self.checkFloatHex(out, '-2', '0xc0000000')

    def test_neg2_swap(self):
        out = captureStdout(lambda: handleHexToFloat('0x000000c0', True))
        self.checkFloatHex(out, '-2', '0x000000c0')

    def test_userbug(self):
        out = captureStdout(lambda: handleHexToFloat('0x451837f5'))
        self.checkFloatHex(out, '2435.5', '0x451837f5')

    def test_userbug_swap(self):
        out = captureStdout(lambda: handleHexToFloat('0xf5371845', True))
        self.checkFloatHex(out, '2435.5', '0xf5371845')

    def test_0(self):
        out = captureStdout(lambda: handleHexToFloat('0x00000000'))
        self.checkFloatHex(out, '0', '0x00000000')
    
    def test_0_swap(self):
        out = captureStdout(lambda: handleHexToFloat('0x00000000', True))
        self.checkFloatHex(out, '0', '0x00000000')

    def test_neg0(self):
        out = captureStdout(lambda: handleHexToFloat('0x80000000'))
        self.checkFloatHex(out, '-0', '0x80000000')

    def test_neg0_swap(self):
        out = captureStdout(lambda: handleHexToFloat('0x00000080', True))
        self.checkFloatHex(out, '-0', '0x00000080')

    def test_nan(self):
        out = captureStdout(lambda: handleHexToFloat('0xffffffff'))
        self.checkFloatHex(out, 'nan', '0xffffffff')

    def test_nan_swap(self):
        out = captureStdout(lambda: handleHexToFloat('0xffffffff', True))
        self.checkFloatHex(out, 'nan', '0xffffffff')

    def test_no0x(self):
        out = captureStdout(lambda: handleHexToFloat('40000000'))
        self.checkFloatHex(out, '2', '0x40000000')

    def test_no0x_swap(self):
        out = captureStdout(lambda: handleHexToFloat('40', True))
        self.checkFloatHex(out, '2', '0x00000040')

    def test_notlongenough(self):
        out = captureStdout(lambda: handleHexToFloat('0x400000'))
        self.checkFloatHex(out, '5.87747e-39', '0x00400000')

    def test_gcharacter(self):
        out = captureStdout(lambda: handleHexToFloat('0xg0000000'))
        self.checkHexToFloatError(out)

    def test_gcharacter_swap(self):
        out = captureStdout(lambda: handleHexToFloat('0xg0000000', True))
        self.checkHexToFloatError(out)

    def test_minuscharacter(self):
        out = captureStdout(lambda: handleHexToFloat('-0x40000000'))
        self.checkHexToFloatError(out)

    def test_minuscharacter_swap(self):
        out = captureStdout(lambda: handleHexToFloat('-0x40000000', True))
        self.checkHexToFloatError(out)

    def test_minuscharacterinmiddle(self):
        out = captureStdout(lambda: handleHexToFloat('0x40-000000'))
        self.checkHexToFloatError(out)

    def test_minuscharacterinmiddle_swap(self):
        out = captureStdout(lambda: handleHexToFloat('0x40-000000', True))
        self.checkHexToFloatError(out)

class TestDoubleToHex(FloatToHexTest):
    def test_05(self):
        out = captureStdout(lambda: handleDoubleToHex(0.5))
        self.checkDoubleHex(out, '0.5', '0x3fe0000000000000')

    def test_05_swap(self):
        out = captureStdout(lambda: handleDoubleToHex(0.5, True))
        self.checkDoubleHex(out, '0.5', '0x000000000000e03f')

    def test_2(self):
        out = captureStdout(lambda: handleDoubleToHex(2))
        self.checkDoubleHex(out, '2', '0x4000000000000000')

    def test_2_swap(self):
        out = captureStdout(lambda: handleDoubleToHex(2, True))
        self.checkDoubleHex(out, '2', '0x0000000000000040')

    def test_neg2(self):
        out = captureStdout(lambda: handleDoubleToHex(-2))
        self.checkDoubleHex(out, '-2', '0xc000000000000000')

    def test_neg2_swap(self):
        out = captureStdout(lambda: handleDoubleToHex(-2, True))
        self.checkDoubleHex(out, '-2', '0x00000000000000c0')

    def test_userbug(self):
        out = captureStdout(lambda: handleDoubleToHex(2435.52535))
        self.checkDoubleHex(out, '2435.52535', '0x40a3070cfaacd9e8')

    def test_userbug_swap(self):
        out = captureStdout(lambda: handleDoubleToHex(2435.52535, True))
        self.checkDoubleHex(out, '2435.52535', '0xe8d9acfa0c07a340')

    def test_0(self):
        out = captureStdout(lambda: handleDoubleToHex(0))
        self.checkDoubleHex(out, '0', '0x0000000000000000')

    def test_0(self):
        out = captureStdout(lambda: handleDoubleToHex(0, True))
        self.checkDoubleHex(out, '0', '0x0000000000000000')

    def test_neg0(self):
        out = captureStdout(lambda: handleDoubleToHex(float("-0.0")))
        self.checkDoubleHex(out, '-0.0', '0x8000000000000000')

    def test_neg0(self):
        out = captureStdout(lambda: handleDoubleToHex(float("-0.0"), True))
        self.checkDoubleHex(out, '-0.0', '0x0000000000000080')

class TestHexToDouble(FloatToHexTest):
    def test_05(self):
        out = captureStdout(lambda: handleHexToDouble('0x3fe0000000000000'))
        self.checkDoubleHex(out, '0.5', '0x3fe0000000000000')

    def test_05_swap(self):
        out = captureStdout(lambda: handleHexToDouble('0x000000000000e03f', True))
        self.checkDoubleHex(out, '0.5', '0x000000000000e03f')

    def test_2(self):
        out = captureStdout(lambda: handleHexToDouble('0x4000000000000000'))
        self.checkDoubleHex(out, '2.0', '0x4000000000000000')

    def test_2_swap(self):
        out = captureStdout(lambda: handleHexToDouble('0x0000000000000040', True))
        self.checkDoubleHex(out, '2.0', '0x0000000000000040')

    def test_neg2(self):
        out = captureStdout(lambda: handleHexToDouble('0xc000000000000000'))
        self.checkDoubleHex(out, '-2.0', '0xc000000000000000')

    def test_neg2_swap(self):
        out = captureStdout(lambda: handleHexToDouble('0x00000000000000c0', True))
        self.checkDoubleHex(out, '-2.0', '0x00000000000000c0')

    def test_userbug(self):
        out = captureStdout(lambda: handleHexToDouble('0x40a3070cfaacd9e8'))
        self.checkDoubleHex(out, '2435.52535', '0x40a3070cfaacd9e8')

    def test_userbug_swap(self):
        out = captureStdout(lambda: handleHexToDouble('0xe8d9acfa0c07a340', True))
        self.checkDoubleHex(out, '2435.52535', '0xe8d9acfa0c07a340')

    def test_0(self):
        out = captureStdout(lambda: handleHexToDouble('0x0000000000000000'))
        self.checkDoubleHex(out, '0.0', '0x0000000000000000')

    def test_0_swap(self):
        out = captureStdout(lambda: handleHexToDouble('0x0000000000000000', True))
        self.checkDoubleHex(out, '0.0', '0x0000000000000000')

    def test_neg0(self):
        out = captureStdout(lambda: handleHexToDouble('0x8000000000000000'))
        self.checkDoubleHex(out, '-0.0', '0x8000000000000000')

    def test_neg0_swap(self):
        out = captureStdout(lambda: handleHexToDouble('0x0000000000000080', True))
        self.checkDoubleHex(out, '-0.0', '0x0000000000000080')

    def test_nan(self):
        out = captureStdout(lambda: handleHexToDouble('0xffffffffffffffff'))
        self.checkDoubleHex(out, 'nan', '0xffffffffffffffff')
    
    def test_nan_swa(self):
        out = captureStdout(lambda: handleHexToDouble('0xffffffffffffffff', True))
        self.checkDoubleHex(out, 'nan', '0xffffffffffffffff')

    def test_no0x(self):
        out = captureStdout(lambda: handleHexToDouble('4000000000000000'))
        self.checkDoubleHex(out, '2.0', '0x4000000000000000')

    def test_no0x_swap(self):
        out = captureStdout(lambda: handleHexToDouble('40', True))
        self.checkDoubleHex(out, '2.0', '0x0000000000000040')

    def test_notlongenough(self):
        out = captureStdout(lambda: handleHexToDouble('0x40000000000000'))
        self.checkDoubleHex(out, '1.7800590868057611e-307', '0x0040000000000000')

    def test_gcharacter(self):
        out = captureStdout(lambda: handleHexToDouble('0xg000000000000000'))
        self.checkHexToDoubleError(out)

    def test_gcharacter_swap(self):
        out = captureStdout(lambda: handleHexToDouble('0xg000000000000000', True))
        self.checkHexToDoubleError(out)

    def test_minuscharacter(self):
        out = captureStdout(lambda: handleHexToDouble('-0x4000000000000000'))
        self.checkHexToDoubleError(out)

    def test_minuscharacter_swap(self):
        out = captureStdout(lambda: handleHexToDouble('-0x4000000000000000', True))
        self.checkHexToDoubleError(out)

    def test_minuscharacterinmiddle(self):
        out = captureStdout(lambda: handleHexToDouble('0x40-00000000000000'))
        self.checkHexToDoubleError(out)

    def test_minuscharacterinmiddle_swap(self):
        out = captureStdout(lambda: handleHexToDouble('0x40-00000000000000', True))
        self.checkHexToDoubleError(out)


    
if __name__ == '__main__':
    unittest.main()
