import FloatToHex
import unittest
import json
import math

class Test_FloatToHexParameterized(unittest.TestCase):
    testCasesJson = None

    @classmethod
    def setUpClass(cls):
        with open('testCases.json', 'r') as testCasesFile:
            cls.testCasesJson = json.load(testCasesFile)

    @classmethod
    def tearDownClass(cls):
        pass

    def getTestName(self, testCase):
        return f"{testCase['action']}|{testCase.get('float', testCase.get('double', ''))}"

    def test_fileFloatToHex(self):
        for testCase in self.testCasesJson:
            if testCase["action"] == "floatToHex":
                with self.subTest(self.getTestName(testCase)):
                    self.assertEqual(int(testCase["hex"], 16), FloatToHex.floattohex(float(testCase["float"]), False))

    def test_fileHexToFloat(self):
        for testCase in self.testCasesJson:
            if testCase["action"] == "floatToHex":
                with self.subTest(self.getTestName(testCase)):
                    f = float(testCase["float"])
                    h = FloatToHex.hextofloat(int(testCase["hex"], 16), False)
                    if math.isnan(f):
                        self.assertTrue(math.isnan(h), f"f={f}, h={h}")
                    else:
                        self.assertEqual(f, h)

    def test_fileDoubleToHex(self):
        for testCase in self.testCasesJson:
            if testCase["action"] == "doubleToHex":
                with self.subTest(self.getTestName(testCase)):
                    self.assertEqual(int(testCase["hex"], 16), FloatToHex.doubletohex(float(testCase["double"]), False))

    def test_fileHexToDouble(self):
        for testCase in self.testCasesJson:
            if testCase["action"] == "doubleToHex":
                with self.subTest(self.getTestName(testCase)):
                    d = float(testCase["double"])
                    h = FloatToHex.hextodouble(int(testCase["hex"], 16), False)
                    if math.isnan(d):
                        self.assertTrue(math.isnan(h), f"d={d}, h={h}")
                    else:
                        self.assertEqual(d, h)

  
    def test_allTestCasesValid(self):
        for testCase in self.testCasesJson:
            self.assertIn(testCase["action"], ["floatToHex", "doubleToHex"])
            self.assertIn("hex", testCase.keys())
            if testCase["action"] == "floatToHex":
                self.assertIn("float", testCase.keys())
            elif testCase["action"] == "doubleToHex":
                self.assertIn("double", testCase.keys())
    

if __name__ == '__main__':
    unittest.main()
