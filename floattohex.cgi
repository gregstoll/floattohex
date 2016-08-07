#!/usr/bin/python

import FloatToHex, cgi, sys

def returnFloatHex(f, h):
    print "Content-type: text/xml\n\n"
    print "<values>\n"
    print "<float>%f</float>\n" % f
    if (h.endswith('L') or h.endswith('l')):
        h = h[:-1]
    print "<hex>%s</hex>\n" % h
    print "</values>\n"
    sys.exit(0)

def returnDoubleHex(d, h):
    print "Content-type: text/xml\n\n"
    print "<values>\n"
    print "<double>" + str(d) + "</double>\n"
    if (h.endswith('L') or h.endswith('l')):
        h = h[:-1]
    print "<hex>%s</hex>\n" % h
    print "</values>\n"
    sys.exit(0)


form = cgi.FieldStorage()
action = form.getfirst('action')
if (action == 'floattohex'):
    f = float(form.getfirst('float'))
    isNegative = False
    fToPass = f
    if (f < 0.0):
        isNegative = True
        fToPass = -1.0 * f
    h = FloatToHex.floattohex(fToPass)
    h = str(hex(h)).lower()
    if (isNegative):
        h = h[0:2] + hex(int(h[2:3], 16) + 8)[2:] + h[3:]
    returnFloatHex(f, h)
elif (action == 'hextofloat'):
    h = str(form.getfirst('hex').replace(' ', ''))
    if (not h.startswith('0x')):
        h = '0x' + h
    # Handle cases that are too big for a long (won't convert to unsigned, it
    # seems)
    firstDigit = int(h[2:3], 16)
    makeNegative = False
    hToPass = h
    if (firstDigit > 8):
        hToPass = h[0:2] + str(firstDigit - 8) + h[3:]
        makeNegative = True
    i = int(hToPass[2:], 16)
    f = FloatToHex.hextofloat(i)
    if (makeNegative):
        f = -1.0 * f
    returnFloatHex(f, h)
elif (action == 'doubletohex'):
    d = float(form.getfirst('double'))
    isNegative = False
    dToPass = d
    if (d < 0.0):
        isNegative = True
        dToPass = -1.0 * d
    h = FloatToHex.doubletohex(dToPass)
    h = str(hex(h)).lower()
    if (isNegative):
        h = h[0:2] + hex(int(h[2:3], 16) + 8)[2:] + h[3:]
    returnDoubleHex(d, h)
elif (action == 'hextodouble'):
    h = str(form.getfirst('hex'))
    if (not h.startswith('0x')):
        h = '0x' + h
    # Handle cases that are too big for a long (won't convert to unsigned, it
    # seems)
    firstDigit = int(h[2:3], 16)
    makeNegative = False
    hToPass = h
    if (firstDigit > 8):
        hToPass = h[0:2] + str(firstDigit - 8) + h[3:]
        makeNegative = True
    i = int(hToPass[2:], 16)
    d = FloatToHex.hextodouble(i)
    if (makeNegative):
        d = -1.0 * d
    returnDoubleHex(d, h)
    
