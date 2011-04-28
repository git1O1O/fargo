var Runtime = Fargo.Runtime,
    Cons    = Runtime.Cons,
    Symbol  = Runtime.Symbol,
    NULL    = Cons.NULL;

//================================================================
// Core syntax

Fargo.runtime.syntax('define', function(scope, cells) {
  if (cells.car.klass === Cons) {
    var name   = cells.car.car.name,
        params = cells.car.cdr,
        body   = cells.cdr,
        proc   = new Runtime.Procedure(scope, params, body);
    
    scope.define(name, proc);
    return proc;
    
  } else if (cells.car.klass === Symbol) {
    var value = Fargo.evaluate(cells.cdr.car, scope);
    scope.define(cells.car.name, value);
    return value;
  }
});

Fargo.runtime.syntax('if', function(scope, cells) {
  var which = Fargo.evaluate(cells.car, scope) ? cells.cdr.car : cells.cdr.cdr.car;
  return new Runtime.Frame(which, scope);
});

Fargo.runtime.syntax('begin', function(scope, cells) {
  return new Runtime.Body(cells, scope);
});

Fargo.runtime.syntax('lambda', function(scope, cells) {
  return new Runtime.Procedure(scope, cells.car, cells.cdr);
});

Fargo.runtime.syntax('quote', function(scope, cells) {
  return Fargo.freeze(cells.car);
});

//================================================================
// Fibers

Fargo.runtime.syntax('fiber', function(scope, cells) {
  return new Runtime.Fiber(scope, cells.car, cells.cdr);
});

Fargo.runtime.define('current-fiber', function() { return Runtime.Fiber.current });

Fargo.runtime.define('yield', function(value) {
  value = (value === undefined) ? NULL : value;
  return {yieldValue: value};
});

//================================================================
// Should be macros

Fargo.runtime.syntax('and', function(scope, cells) {
  var and = true, cell = cells;
  while (and && cell !== NULL) {
    and = and && Fargo.evaluate(cell.car, scope);
    cell = cell.cdr;
  }
  return and;
});

Fargo.runtime.syntax('or', function(scope, cells) {
  var or = false, cell = cells;
  while (!or && cell !== NULL) {
    or = or || Fargo.evaluate(cell.car, scope);
    cell = cell.cdr;
  }
  return or;
});

//================================================================
// I/O

Fargo.runtime.syntax('load', function(scope, cells) {
  scope.run(Fargo.evaluate(cells.car, scope));
  return true;
});

Fargo.runtime.define('puts', function(string) {
  require('sys').puts(string);
  return string;
});

Fargo.runtime.define('exit', function() {
  process.exit();
});

//================================================================
// Predicates

var eqv = function(a,b) {
  if (a.klass === Symbol && b.klass === Symbol)
    return a.name === b.name;
  else
    return a === b;
};
Fargo.runtime.define('eqv?', eqv);
Fargo.runtime.define('eq?',  eqv);

Fargo.runtime.define('equal?', function(a, b) {
  return (a && a.equals) ? a.equals(b) : a === b;
});

Fargo.runtime.define('pair?', function(object) {
  return object.klass === Cons && object !== NULL;
});

Fargo.runtime.define('boolean?', function(object) { return typeof object === 'boolean' });
Fargo.runtime.define('number?',  function(object) { return typeof object === 'number'  });
Fargo.runtime.define('string?',  function(object) { return typeof object === 'string'  });

Fargo.runtime.define('symbol?', function(object) {
  return object.klass === Runtime.Symbol;
});

Fargo.runtime.define('procedure?', function(object) {
  return object.klass === Runtime.Function
});

//================================================================
// Math library

Fargo.runtime.define('+', function(a,b) { return a + b });
Fargo.runtime.define('-', function(a,b) { return a - b });
Fargo.runtime.define('*', function(a,b) { return a * b });
Fargo.runtime.define('/', function(a,b) { return a / b });

Fargo.runtime.define('<',  function(a,b) { return a <  b });
Fargo.runtime.define('<=', function(a,b) { return a <= b });
Fargo.runtime.define('>',  function(a,b) { return a >  b });
Fargo.runtime.define('>=', function(a,b) { return a >= b });

'ceil floor round sin cos tan asin acos atan exp log sqrt random'.
split(' ').forEach(function(fn) {
  Fargo.runtime.define(fn, Math[fn]);
});

Fargo.runtime.define('expt', Math.pow);

Fargo.runtime.define('number->string', function(number) {
  return number.toString(10);
});

Fargo.runtime.define('string->number', function(string) {
  return parseFloat(string, 10);
});

//================================================================
// Lists and pairs

Fargo.runtime.define('cons', function(a,b) { return new Cons(a,b) });

Fargo.runtime.define('car', function(pair) { return pair.car });
Fargo.runtime.define('cdr', function(pair) { return pair.cdr });

Fargo.runtime.define('set-car!', function(pair, value) {
  if (pair.frozen) throw new Error('Cannot set-car! on immutable list');
  pair.car = value;
  return value;
});

Fargo.runtime.define('set-cdr!', function(pair, value) {
  if (pair.frozen) throw new Error('Cannot set-cdr! on immutable list');
  pair.cdr = value;
  return value;
});

//================================================================

// Vectors

Fargo.runtime.define('make-vector', function(size, fill) {
  if (fill === undefined) fill = NULL;
  var elements = [];
  while (size--) elements.push(fill);
  return new Runtime.Vector(elements);
});

Fargo.runtime.define('vector-length', function(vector) {
  return vector._elements.length;
});

Fargo.runtime.define('vector-ref', function(vector, k) {
  var size = vector._elements.length;
  if (k < 0 || k >= size) throw new Error('Index out of bounds');
  return vector._elements[k];
});

Fargo.runtime.define('vector-set!', function(vector, k, object) {
  var size = vector._elements.length;
  if (k < 0 || k >= size) throw new Error('Index out of bounds');
  if (vector.frozen) throw new Error('Cannot vector-set! on immutable vector');
  return vector._elements[k] = object;
});
