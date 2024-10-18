---
title: Expressions
sidebar_label: Expressions
sidebar_position: 500
---

Datacore has an internal "expression language", which can be used essentially as a simple scripting language in various parts of Datacore. The most common use cases is in [queries](../data/index.md), for filtering down to a desired set of pages, though they can also be used via the [Javascript View API](../code-views/index.md)
and will be used in the upcoming YAML-based view format.

Datacore expressions vaguely resemble Javascript, with some special syntax considerations for dates, durations, and links. A reference table of all of the available
operations is [below](#syntax-reference).

## Syntax Reference

```js
// Literals
1                   (number)
true/false          (boolean)
"text"              (text)
date(2021-04-18)    (date)
dur(1 day)          (duration)
[[Link]]            (link)
[1, 2, 3]           (list)
{ a: 1, b: 2 }      (object)

// Lambdas
(x1, x2) => ...     (lambda)

// References
field               (directly refer to a field)
simple-field        (refer to fields with spaces/punctuation in them like "Simple Field!")
a.b                 (if a is an object, retrieve field named 'b')
a[expr]             (if a is an object or array, retrieve field with name specified by expression 'expr')
f(a, b, ...)        (call a function called `f` on arguments a, b, ...)

// Arithmetic
a + b               (addition)
a - b               (subtraction)
a * b               (multiplication)
a / b               (division)
a % b               (modulo / remainder of division)

// Comparison
a > b               (check if a is greater than b)
a < b               (check if a is less than b)
a = b               (check if a equals b)
a != b              (check if a does not equal b)
a <= b              (check if a is less than or equal to b)
a >= b              (check if a is greater than or equal to b)

// Strings
a + b               (string concatenation)
a * num             (repeat string <num> times)


// Special Operations
[[Link]].value      (fetch `value` from page `Link`)
```