/* Use this file as a template to start implementing a module that
   also declares object types. All occurrences of 'Xxo' should be changed
   to something reasonable for your objects. After that, all other
   occurrences of 'xx' should be changed to something reasonable for your
   module. If your module is named foo your sourcefile should be named
   foomodule.c.
   
   You will probably want to delete all references to 'x_attr' and add
   your own types of attributes instead.  Maybe you want to name your
   local variables other than 'self'.  If your object type is needed in
   other files, you'll have to create a file "foobarobject.h"; see
   intobject.h for an example. */

#include "Python.h"

static PyObject *ErrorObject;

/* Function of two integers returning integer */

static PyObject *
FloatToHex_FloatHoHex(PyObject *, PyObject *args)
{
    float f;
    if (!PyArg_ParseTuple(args, "f:floattohex", &f))
        return NULL;
    int i = *((int *)&f);
    return PyInt_FromLong(i);
}


/* List of functions defined in the module */

static PyMethodDef FloatToHex_methods[] = {
    {"floattohex",     (PyCFunction)FloatToHex_FloatToHex,  METH_VARARGS},
    {NULL,      NULL}       /* sentinel */
};


/* Initialization function for the module (*must* be called initxx) */

DL_EXPORT(void)
initFloatToHex(void)
{
    PyObject *m, *d;

    /* Initialize the type of the new type object here; doing it here
     * is required for portability to Windows without requiring C++. */
    Xxo_Type.ob_type = &PyType_Type;

    /* Create the module and add the functions */
    m = Py_InitModule("FloatToHex", FloatToHex_methods);

    /* Add some symbolic constants to the module */
    d = PyModule_GetDict(m);
    ErrorObject = PyErr_NewException("FloatToHex.error", NULL, NULL);
    PyDict_SetItemString(d, "error", ErrorObject);
}


