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

    def test_2(self):
        out = captureStdout(lambda: handleFloatToHex(2))
        self.checkFloatHex(out, '2', '0x40000000')

    def test_neg2(self):
        out = captureStdout(lambda: handleFloatToHex(-2))
        self.checkFloatHex(out, '-2', '0xc0000000')

    @unittest.skip("bug")
    def test_0(self):
        out = captureStdout(lambda: handleFloatToHex(0))
        self.checkFloatHex(out, '0', '0x00000000')

    @unittest.skip("bug")
    def test_neg0(self):
        out = captureStdout(lambda: handleFloatToHex(float("-0.0")))
        self.checkFloatHex(out, '-0', '0x80000000')

class TestHexToFloat(FloatToHexTest):
    def test_05(self):
        out = captureStdout(lambda: handleHexToFloat('0x3f000000'))
        self.checkFloatHex(out, '0.5', '0x3f000000')

    def test_2(self):
        out = captureStdout(lambda: handleHexToFloat('0x40000000'))
        self.checkFloatHex(out, '2', '0x40000000')

    def test_neg2(self):
        out = captureStdout(lambda: handleHexToFloat('0xc0000000'))
        self.checkFloatHex(out, '-2', '0xc0000000')

    def test_0(self):
        out = captureStdout(lambda: handleHexToFloat('0x00000000'))
        self.checkFloatHex(out, '0', '0x00000000')

    @unittest.skip("bug")
    def test_neg0(self):
        out = captureStdout(lambda: handleHexToFloat('0x80000000'))
        self.checkFloatHex(out, '-0', '0x80000000')

    def test_nan(self):
        out = captureStdout(lambda: handleHexToFloat('0xffffffff'))
        self.checkFloatHex(out, 'nan', '0xffffffff')

    def test_no0x(self):
        out = captureStdout(lambda: handleHexToFloat('40000000'))
        self.checkFloatHex(out, '2', '0x40000000')

    def test_notlongenough(self):
        out = captureStdout(lambda: handleHexToFloat('0x400000'))
        self.checkFloatHex(out, '5.87747e-39', '0x400000')

    def test_gcharacter(self):
        out = captureStdout(lambda: handleHexToFloat('0xg0000000'))
        self.checkHexToFloatError(out)

    def test_minuscharacter(self):
        out = captureStdout(lambda: handleHexToFloat('-0x40000000'))
        self.checkHexToFloatError(out)

    def test_minuscharacterinmiddle(self):
        out = captureStdout(lambda: handleHexToFloat('0x40-000000'))
        self.checkHexToFloatError(out)

class TestDoubleToHex(FloatToHexTest):
    def test_05(self):
        out = captureStdout(lambda: handleDoubleToHex(0.5))
        self.checkDoubleHex(out, '0.5', '0x3fe0000000000000')

    def test_2(self):
        out = captureStdout(lambda: handleDoubleToHex(2))
        self.checkDoubleHex(out, '2', '0x4000000000000000')

    def test_neg2(self):
        out = captureStdout(lambda: handleDoubleToHex(-2))
        self.checkDoubleHex(out, '-2', '0xc000000000000000')

    @unittest.skip("bug")
    def test_0(self):
        out = captureStdout(lambda: handleDoubleToHex(0))
        self.checkDoubleHex(out, '0', '0x0000000000000000')

    @unittest.skip("bug")
    def test_neg0(self):
        out = captureStdout(lambda: handleDoubleToHex(float("-0.0")))
        self.checkDoubleHex(out, '-0', '0x8000000000000000')

class TestHexToDouble(FloatToHexTest):
    def test_05(self):
        out = captureStdout(lambda: handleHexToDouble('0x3fe0000000000000'))
        self.checkDoubleHex(out, '0.5', '0x3fe0000000000000')

    def test_2(self):
        out = captureStdout(lambda: handleHexToDouble('0x4000000000000000'))
        self.checkDoubleHex(out, '2.0', '0x4000000000000000')

    def test_neg2(self):
        out = captureStdout(lambda: handleHexToDouble('0xc000000000000000'))
        self.checkDoubleHex(out, '-2.0', '0xc000000000000000')

    def test_0(self):
        out = captureStdout(lambda: handleHexToDouble('0x0000000000000000'))
        self.checkDoubleHex(out, '0.0', '0x0000000000000000')

    @unittest.skip("bug")
    def test_neg0(self):
        out = captureStdout(lambda: handleHexToDouble('0x8000000000000000'))
        self.checkDoubleHex(out, '-0.0', '0x8000000000000000')

    def test_nan(self):
        out = captureStdout(lambda: handleHexToDouble('0xffffffffffffffff'))
        self.checkDoubleHex(out, 'nan', '0xffffffffffffffff')

    def test_no0x(self):
        out = captureStdout(lambda: handleHexToDouble('4000000000000000'))
        self.checkDoubleHex(out, '2.0', '0x4000000000000000')

    def test_notlongenough(self):
        out = captureStdout(lambda: handleHexToDouble('0x40000000000000'))
        self.checkDoubleHex(out, '1.7800590868057611e-307', '0x40000000000000')

    def test_gcharacter(self):
        out = captureStdout(lambda: handleHexToDouble('0xg000000000000000'))
        self.checkHexToDoubleError(out)

    def test_minuscharacter(self):
        out = captureStdout(lambda: handleHexToDouble('-0x4000000000000000'))
        self.checkHexToDoubleError(out)

    def test_minuscharacterinmiddle(self):
        out = captureStdout(lambda: handleHexToDouble('0x40-00000000000000'))
        self.checkHexToDoubleError(out)


    
if __name__ == '__main__':
    unittest.main()
