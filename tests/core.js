module("core");

test("array_max, array_min", function() {
    equal(1, dviz._array_min([3,5,1,4]));
    equal(5, dviz._array_max([3,5,1,4]));
});
