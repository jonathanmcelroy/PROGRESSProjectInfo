import functools

'''
def curry(f):
    @functools.wraps(f)
    def _curry(*args, **kwargs):
        return functools.partial(func, *args, **kwargs)
    return _curry
'''

class List:
    def __init__(self, *values):
        self._values = list(values)

    def __str__(self):
        return str(self._values)

    def __repr__(self):
        return repr(self._values)

    def __len__(self):
        return len(self._values)

    def __getitem__(self, index):
        return self._values[index]

    def __setitem__(self, index, value):
        self._values[index] = value

    def __iter__(self):
        return iter(self._values)

    def __add__(self, other):
        return self._values + other._values

    def fmap(self, f):
        return List(*(f(value) for value in self._values))

    def fmapMethod(self, method, *args, **kwargs):
        return List(*(getattr(m, method)(*args, **kwargs) for m in self._values))

    def apply(self, other):
        return List(*(f(value) for f in self._values for value in other._values))

    def bind(self, f):
        return [eachResult for value in self._values for eachResult in f(value)]

    def zip(self, *others):
        return List(zip(*others))

class Maybe:
    def __init__(self, *values):
        if len(values) == 0:
            self._value = None
        else:
            self._value = values[0]

    def __str__(self):
        if self.isNothing():
            return "Nothing"
        return "Just {}".format(self._value)

    def fmap(self, f, *args, **kwargs):
        if self.isNothing():
            return Maybe()
        return Maybe(f(self._value, *args, **kwargs))

    def fmapMethod(self, method, *args, **kwargs):
        if self.isNothing():
            return Maybe()
        return Maybe(getattr(self._value, method)(*args, **kwargs))

    def apply(self, otherMaybe):
        if self.isNothing() or otherMaybe.isNothing():
            return Maybe()
        return Maybe(self._value(otherMaybe._value))

    def applyAll(self, *otherMaybes):
        if self.isNothing() or any(m.isNothing() for m in otherMaybes):
            return Maybe()
        return Maybe(self._value(*(m._value for m in otherMaybes)))

    def bind(self, f):
        if self.isNothing():
            return Maybe()
        return f(self._value)

    def isNothing(self):
        return self._value == None

    def isJust(self):
        return not self.isNothing()

    def fromMaybe(self):
        if self.isNothing():
            raise Exception("Cannot extract value from Nothing")
        return self._value

    @staticmethod
    def boolMaybe(value):
        'If value evaluate to False, then return Nothing. Otherwise, return Just value'
        if not value:
            return Maybe()
        return Maybe(value)

def fmapMaybes(f, *args, **kwargs):
    if any(m.isNothing() for m in args) or any(m.isNothing() for m in kwargs.values()):
        return Maybe()
    return Maybe(f(*(m._value for m in args), **{key: m._value for key,m in kwargs.items()}))
