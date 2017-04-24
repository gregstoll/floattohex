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

void swapFloat(float* f) {
    char* fBytes = (char*)f;
    for (int i = 0; i < sizeof(float)/2; ++i) {
        int oppositeI = sizeof(float) - 1 - i;
        char temp = fBytes[i];
        fBytes[i] = fBytes[oppositeI];
        fBytes[oppositeI] = temp;
    }
}

void swapDouble(double* d) {
    char* dBytes = (char*)d;
    for (int i = 0; i < sizeof(double)/2; ++i) {
        int oppositeI = sizeof(double) - 1 - i;
        char temp = dBytes[i];
        dBytes[i] = dBytes[oppositeI];
        dBytes[oppositeI] = temp;
    }
}

static PyObject *
FloatToHex_FloatToHex(PyObject *self, PyObject *args, PyObject *keywords)
{
    float f, fToUse;
    int swap = 0;
    char *keywordNames[] = {"float", "swap", NULL};
    if (!PyArg_ParseTupleAndKeywords(args, keywords, "f|p:floattohex", keywordNames, &f, &swap))
        return NULL;
    fToUse = f;
    if (swap != 0) {
        swapFloat(&fToUse);
    }

    unsigned int i = *((unsigned int *)&fToUse);
    return Py_BuildValue("I", i);
}

static PyObject *
FloatToHex_HexToFloat(PyObject *self, PyObject *args, PyObject *keywords)
{
    unsigned int i;
    int swap = 0;
    char *keywordNames[] = {"hex", "swap", NULL};
    if (!PyArg_ParseTupleAndKeywords(args, keywords, "I|p:hextofloat", keywordNames, &i, &swap))
        return NULL;
    float f = *((float *)&i);
    float fToReturn = f;
    if (swap != 0) {
        swapFloat(&fToReturn);
    }
    return Py_BuildValue("f", fToReturn);
}

static PyObject *
FloatToHex_DoubleToHex(PyObject *self, PyObject *args, PyObject *keywords)
{
    double d;
    int swap = 0;
    char *keywordNames[] = {"double", "swap", NULL};
    if (!PyArg_ParseTupleAndKeywords(args, keywords, "d|p:doubletohex", keywordNames, &d, &swap))
        return NULL;
    double dToUse = d;
    if (swap != 0) {
        swapDouble(&dToUse);
    }
    unsigned long long l = *((unsigned long long*)&dToUse);
    return Py_BuildValue("K", l);
}

static PyObject *
FloatToHex_HexToDouble(PyObject *self, PyObject *args, PyObject *keywords)
{
    unsigned long long l;
    int swap = 0;
    char *keywordNames[] = {"hex", "swap", NULL};
    if (!PyArg_ParseTupleAndKeywords(args, keywords, "K|p:hextodouble", keywordNames, &l, &swap))
        return NULL;
    double d = *((double *)&l);
    double dToReturn = d;
    if (swap != 0) {
        swapDouble(&dToReturn);
    }
    return Py_BuildValue("d", dToReturn);
}
/* List of functions defined in the module */

static PyMethodDef FloatToHex_methods[] = {
    {"floattohex",     (PyCFunction)FloatToHex_FloatToHex,  METH_VARARGS|METH_KEYWORDS},
    {"hextofloat",     (PyCFunction)FloatToHex_HexToFloat,  METH_VARARGS|METH_KEYWORDS},
    {"doubletohex",    (PyCFunction)FloatToHex_DoubleToHex, METH_VARARGS|METH_KEYWORDS},
    {"hextodouble",    (PyCFunction)FloatToHex_HexToDouble, METH_VARARGS|METH_KEYWORDS},
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

