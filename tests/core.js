module("core");

test('array_max, array_min', function() {
    equal(dviz._array_min([3,5,1,4]), 1);
    equal(dviz._array_max([3,5,1,4]), 5);
});

test('parse simple csv', function() {
    var raw = ['1, 2, 3', '4, 5, 6'].join('\n');
    deepEqual(dviz._parse_csv(raw),
              [[1, 2, 3],
               [4, 5, 6]]);
});

test('parse csv with single row', function() {
    var raw = '1, 2, 3';
    deepEqual(dviz._parse_csv(raw), [1, 2, 3],
              'should return one dimensional array');
});

test('parse csv with column header', function() {
    var raw = ['a, b, c', '1, 2, 3', '4, 5, 6'].join('\n');
    deepEqual(dviz._parse_csv(raw, true),
              [['a', 'b', 'c'],
               [1, 2, 3],
               [4, 5, 6]]);
});

test('parse csv with row header', function() {
    var raw = ['a, 1, 2', 'b, 3, 4'].join('\n');
    deepEqual(dviz._parse_csv(raw, false, true),
              [['a', 1, 2],
               ['b', 3, 4]]);
});

test('parse csv with column and row header', function() {
    var raw = ['x, a, b, c', 'd, 1, 2, 3', 'e, 4, 5, 6'].join('\n');
    deepEqual(dviz._parse_csv(raw, true, true),
              [['x', 'a', 'b', 'c'],
               ['d', 1, 2, 3],
               ['e', 4, 5, 6]]);
});

test('parse csv with various numbers', function() {
    var raw = ['1, 2.2, -3'].join('\n');
    var actual = dviz._parse_csv(raw);
    deepEqual(actual[0], 1, 'integer');
    deepEqual(actual[1], 2.2, 'float');
    deepEqual(actual[2], -3, 'negative integer');
});
