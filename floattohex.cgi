#!/usr/bin/python

import FloatToHex, cgi, sys

def returnFloatHex(f, h):
    print "Content-type: text/xml\n\n"
    print "<values>\n"
    if (f == 'ERROR'):
        print "<float>ERROR</float>\n"
    else:
        print "<float>%f</float>\n" % f
    if (h is not None and (h.endswith('L') or h.endswith('l'))):
        h = h[:-1]
    print "<hex>%s</hex>\n" % h
    print "</values>\n"
    sys.exit(0)

def returnDoubleHex(d, h):
    print "Content-type: text/xml\n\n"
    print "<values>\n"
    print "<double>" + str(d) + "</double>\n"
    if (h is not None and (h.endswith('L') or h.endswith('l'))):
        h = h[:-1]
    print "<hex>%s</hex>\n" % h
    print "</values>\n"
    sys.exit(0)


form = cgi.FieldStorage()
action = form.getfirst('action')
if (action == 'floattohex'):
    try:
        f = float(form.getfirst('float'))
    except:
        returnFloatHex(form.getfirst('float'), 'ERROR')
    isNegative = False
    fToPass = f
    if (f < 0.0):
        isNegative = True
        fToPass = -1.0 * f
    try:
        h = FloatToHex.floattohex(fToPass)
    except:
        returnFloatHex(form.getfirst('float'), 'ERROR')
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
    try:
        firstDigit = int(h[2:3], 16)
    except:
        returnFloatHex('ERROR', form.getfirst('hex'))
    makeNegative = False
    hToPass = h
    if (firstDigit > 8):
        hToPass = h[0:2] + str(firstDigit - 8) + h[3:]
        makeNegative = True
    try:
        i = int(hToPass[2:], 16)
        f = FloatToHex.hextofloat(i)
    except:
        returnFloatHex('ERROR', form.getfirst('hex'))
    if (makeNegative):
        f = -1.0 * f
    returnFloatHex(f, h)
elif (action == 'doubletohex'):
    try:
        d = float(form.getfirst('double'))
    except:
        returnDoubleHex(form.getfirst('double'), 'ERROR')
    isNegative = False
    dToPass = d
    if (d < 0.0):
        isNegative = True
        dToPass = -1.0 * d
    try:
        h = FloatToHex.doubletohex(dToPass)
    except:
        returnDoubleHex(form.getfirst('double'), 'ERROR')
    h = str(hex(h)).lower()
    if (isNegative):
        try:
            h = h[0:2] + hex(int(h[2:3], 16) + 8)[2:] + h[3:]
        except:
            returnDoubleHex(form.getfirst('double'), 'ERROR')
    returnDoubleHex(d, h)
elif (action == 'hextodouble'):
    try:
        h = str(form.getfirst('hex').replace(' ', ''))
    except:
        returnDoubleHex('ERROR', form.getfirst('hex'))
    if (not h.startswith('0x')):
        h = '0x' + h
    # Handle cases that are too big for a long (won't convert to unsigned, it
    # seems)
    try:
        firstDigit = int(h[2:3], 16)
    except:
        returnDoubleHex('ERROR', form.getfirst('hex'))
    makeNegative = False
    hToPass = h
    if (firstDigit > 8):
        hToPass = h[0:2] + str(firstDigit - 8) + h[3:]
        makeNegative = True
    try:
        i = int(hToPass[2:], 16)
        d = FloatToHex.hextodouble(i)
    except:
        returnDoubleHex('ERROR', form.getfirst('hex'))
    if (makeNegative):
        d = -1.0 * d
    returnDoubleHex(d, h)
    
