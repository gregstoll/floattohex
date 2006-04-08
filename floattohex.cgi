#!/usr/bin/python

import FloatToHex, cgi

def returnFloatHex(f, h):
    print "Content-type: text/xml\n\n"
    print "<values>\n"
    print "<float>%f</float>\n" % f
    print "<hex>%s</hex>\n" % hex(h)
    print "</values>\n"

form = cgi.FieldStorage()
action = form.getfirst('action')
if (action == 'floattohex'):
    f = float(form.getfirst('float'))
    h = FloatToHex.floattohex(f)
    returnFloatHex(f, h)
#elif (action == 'hextofloat'):

