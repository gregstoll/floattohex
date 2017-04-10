#!/usr/bin/python3

import FloatToHex, cgi, sys, math

def padAndFormatHex(h, numDigits):
    if h is None:
        return h
    if (h.endswith('L') or h.endswith('l')):
        h = h[:-1]
    # assumes it already starts with "0x"
    while len(h) < numDigits + 2:
        h = h[:2] + '0' + h[2:]
    return h

def returnFloatHex(f, h):
    print("Content-type: text/xml\n")
    print("<values>")
    if (f == 'ERROR'):
        print("<float>ERROR</float>")
    elif not isinstance(f, float):
        print("<float>%s</float>" % f)
    else:
        print("<float>%g</float>" % f)
    h = padAndFormatHex(h, 8)
    print("<hex>%s</hex>" % h)
    print("</values>")

def returnDoubleHex(d, h):
    print("Content-type: text/xml\n")
    print("<values>")
    print("<double>" + str(d) + "</double>")
    h = padAndFormatHex(h, 16)
    print("<hex>%s</hex>" % h)
    print("</values>")

def handleFloatToHex(f, swap=False):
    isNegative = False
    fToPass = f
    # weird handling for negative 0
    if not swap and math.copysign(1, f) == -1:
        isNegative = True
        fToPass = -1.0 * f
    try:
        h = FloatToHex.floattohex(fToPass, swap)
    except:
        returnFloatHex(form.getfirst('float'), 'ERROR')
        return
    h = str(hex(h)).lower()
    h = padAndFormatHex(h, 8)
    if (isNegative):
        h = h[0:2] + hex(int(h[2:3], 16) + 8)[2:] + h[3:]
    returnFloatHex(f, h)

def handleHexToFloat(h, swap=False):
    if (not h.startswith('0x')):
        h = '0x' + h
    # Handle cases that are too big for a long (won't convert to unsigned, it
    # seems)
    try:
        firstDigit = int(h[2:3], 16)
    except:
        returnFloatHex('ERROR', form.getfirst('hex'))
        return
    makeNegative = False
    hToPass = h
    if (firstDigit > 8):
        hToPass = h[0:2] + str(firstDigit - 8) + h[3:]
        makeNegative = True
    try:
        i = int(hToPass[2:], 16)
        f = FloatToHex.hextofloat(i, swap)
    except:
        returnFloatHex('ERROR', form.getfirst('hex'))
        return
    if (makeNegative):
        f = -1.0 * f
    returnFloatHex(f, h)

def handleDoubleToHex(d, swap=False):
    isNegative = False
    dToPass = d
    # weird handling for negative 0
    if not swap and math.copysign(1, d) == -1:
        isNegative = True
        dToPass = -1.0 * d
    try:
        h = FloatToHex.doubletohex(dToPass, swap)
    except:
        returnDoubleHex(form.getfirst('double'), 'ERROR')
        return
    h = str(hex(h)).lower()
    h = padAndFormatHex(h, 16)
    if (isNegative):
        try:
            h = h[0:2] + hex(int(h[2:3], 16) + 8)[2:] + h[3:]
        except:
            returnDoubleHex(form.getfirst('double'), 'ERROR')
            return
    returnDoubleHex(d, h)

def handleHexToDouble(h, swap=False):
    if (not h.startswith('0x')):
        h = '0x' + h
    # Handle cases that are too big for a long (won't convert to unsigned, it
    # seems)
    try:
        firstDigit = int(h[2:3], 16)
    except:
        returnDoubleHex('ERROR', form.getfirst('hex'))
        return
    makeNegative = False
    hToPass = h
    if (firstDigit >= 8):
        hToPass = h[0:2] + str(firstDigit - 8) + h[3:]
        makeNegative = True
    try:
        i = int(hToPass[2:], 16)
        d = FloatToHex.hextodouble(i, swap)
    except:
        returnDoubleHex('ERROR', form.getfirst('hex'))
        return
    if (makeNegative):
        d = -1.0 * d
    returnDoubleHex(d, h)

form = cgi.FieldStorage()
action = form.getfirst('action')
swap = form.getfirst('swap') == '1'
if (action == 'floattohex'):
    try:
        f = float(form.getfirst('float'))
    except:
        returnFloatHex(form.getfirst('float'), 'ERROR')
        sys.exit(0)
    handleFloatToHex(f, swap)
elif (action == 'hextofloat'):
    try:
        h = str(form.getfirst('hex').replace(' ', ''))
    except:
        returnFloatHex('ERROR', form.getfirst('hex'))
        sys.exit(0)
    handleHexToFloat(h, swap)
elif (action == 'doubletohex'):
    try:
        d = float(form.getfirst('double'))
    except:
        returnDoubleHex(form.getfirst('double'), 'ERROR')
        sys.exit(0)
    handleDoubleToHex(d, swap)
elif (action == 'hextodouble'):
    try:
        h = str(form.getfirst('hex').replace(' ', ''))
    except:
        returnDoubleHex('ERROR', form.getfirst('hex'))
        sys.exit(0)
    handleHexToDouble(h, swap)
