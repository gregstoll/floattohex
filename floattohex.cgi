#!/usr/bin/python

import FloatToHex, cgi, sys

def returnFloatHex(f, h):
    print "Content-type: text/xml\n\n"
    print "<values>\n"
    print "<float>%f</float>\n" % f
    if (isinstance(h, int) or isinstance(h, long)):
        h = str(hex(h))
    elif (isinstance(h, str)):
        if (not h.startswith('0x')):
            h = '0x' + h
    if (h.endswith('L')):
        h = h[:-1]
    print "<hex>%s</hex>\n" % h
    print "</values>\n"
    sys.exit(0)

def returnDoubleHex(d, h):
    print "Content-type: text/xml\n\n"
    print "<values>\n"
    print "<double>" + str(d) + "</double>\n"
    if (isinstance(h, int) or isinstance(h, long)):
        h = str(hex(h))
    elif (isinstance(h, str)):
        if (not h.startswith('0x')):
            h = '0x' + h
    if (h.endswith('L')):
        h = h[:-1]
    print "<hex>%s</hex>\n" % h
    print "</values>\n"
    sys.exit(0)


form = cgi.FieldStorage()
action = form.getfirst('action')
if (action == 'floattohex'):
    f = float(form.getfirst('float'))
    h = FloatToHex.floattohex(f)
    returnFloatHex(f, h)
elif (action == 'hextofloat'):
    h = str(form.getfirst('hex'))
    if (not h.startswith('0x')):
        h = '0x' + h
    i = int(h[2:], 16)
    f = FloatToHex.hextofloat(i)
    returnFloatHex(f, h)
elif (action == 'doubletohex'):
    d = float(form.getfirst('double'))
    h = FloatToHex.doubletohex(d)
    returnDoubleHex(d, h)
elif (action == 'hextodouble'):
    h = str(form.getfirst('hex'))
    if (not h.startswith('0x')):
        h = '0x' + h
    i = int(h[2:], 16)
    d = FloatToHex.hextodouble(i)
    returnDoubleHex(d, h)
    
