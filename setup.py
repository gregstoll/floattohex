#!/usr/bin/python3

from distutils.core import setup, Extension

FloatToHexModule = Extension('FloatToHexNew',
                         sources = ['floattohexmodule.c'])

setup (name = 'FloatToHexNew',
       version = '1.0',
       description = 'Converts float to hex and back',
       ext_modules = [FloatToHexModule])

