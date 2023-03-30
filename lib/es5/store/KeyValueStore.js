export var stringifyValue = function (obj) {
    return JSON.stringify(obj);
};
export var parseValue = function (str) {
    try {
        if (str) {
            return JSON.parse(str);
        }
    }
    catch (e) {
        // nop
    }
    return str;
};
//# sourceMappingURL=KeyValueStore.js.map