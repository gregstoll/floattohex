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


struct module_state {
    PyObject *error;
};

#if PY_MAJOR_VERSION >= 3
#define GETSTATE(m) ((struct module_state*)PyModule_GetState(m))
#else
#define GETSTATE(m) (&_state)
static struct module_state _state;
#endif

static PyObject *
FloatToHex_FloatToHex(PyObject *self, PyObject *args)
{
    float f;
    if (!PyArg_ParseTuple(args, "f:floattohex", &f))
        return NULL;
    int i = *((int *)&f);
    return Py_BuildValue("i", i);
}

static PyObject *
FloatToHex_HexToFloat(PyObject *self, PyObject *args)
{
    unsigned int i;
    if (!PyArg_ParseTuple(args, "I:hextofloat", &i))
        return NULL;
    float f = *((float *)&i);
    return Py_BuildValue("f", f);
}

static PyObject *
FloatToHex_DoubleToHex(PyObject *self, PyObject *args)
{
    double d;
    if (!PyArg_ParseTuple(args, "d:doubletohex", &d))
        return NULL;
    long long l = *((long long*)&d);
    return Py_BuildValue("L", l);
}

static PyObject *
FloatToHex_HexToDouble(PyObject *self, PyObject *args)
{
    unsigned long long l;
    if (!PyArg_ParseTuple(args, "L:hextodouble", &l))
        return NULL;
    double d = *((double *)&l);
    return Py_BuildValue("d", d);
}
/* List of functions defined in the module */

static PyMethodDef FloatToHex_methods[] = {
    {"floattohex",     (PyCFunction)FloatToHex_FloatToHex,  METH_VARARGS},
    {"hextofloat",     (PyCFunction)FloatToHex_HexToFloat,  METH_VARARGS},
    {"doubletohex",    (PyCFunction)FloatToHex_DoubleToHex, METH_VARARGS},
    {"hextodouble",    (PyCFunction)FloatToHex_HexToDouble, METH_VARARGS},
    {NULL,      NULL}       /* sentinel */
};


static int FloatToHex_traverse(PyObject *m, visitproc visit, void *arg) {
    Py_VISIT(GETSTATE(m)->error);
    return 0;
}

static int FloatToHex_clear(PyObject *m) {
    Py_CLEAR(GETSTATE(m)->error);
    return 0;
}


static struct PyModuleDef moduledef = {
        PyModuleDef_HEAD_INIT,
        "FloatToHex",
        NULL,
        sizeof(struct module_state),
        FloatToHex_methods,
        NULL,
        FloatToHex_traverse,
        FloatToHex_clear,
        NULL
};
/* Initialization function for the module (*must* be called initxx) */

PyObject* PyInit_FloatToHex(void)
{
    /* Create the module and add the functions */
    PyObject* module = PyModule_Create(&moduledef);
    if (module == NULL)
        return NULL;

    struct module_state *st = GETSTATE(module);

    /* Add some symbolic constants to the module */
    st->error = PyErr_NewException("FloatToHex.Error", NULL, NULL);
    if (st->error == NULL) {
        Py_DECREF(module);
        return NULL;
    }

    return module;
}

