#!/usr/local/bin/python

from distutils.core import setup, Extension

FloatToHexModule = Extension('FloatToHex',
                         sources = ['floattohex.cpp'])

setup (name = 'FloatToHex',
       version = '1.0',
       description = 'Converts float to hex and back',
       ext_modules = [FloatToHexModule])

