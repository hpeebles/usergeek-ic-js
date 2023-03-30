import { parseValue, stringifyValue } from "./KeyValueStore";
var InMemoryKeyValueStore = /** @class */ (function () {
    function InMemoryKeyValueStore() {
        this.items = {};
    }
    InMemoryKeyValueStore.prototype.isFake = function () {
        return true;
    };
    InMemoryKeyValueStore.prototype.set = function (key, data) {
        this.items[key] = stringifyValue(data);
    };
    InMemoryKeyValueStore.prototype.get = function (key) {
        var storageValue = this.items[key];
        if (storageValue) {
            return parseValue(storageValue);
        }
        return undefined;
    };
    InMemoryKeyValueStore.prototype.remove = function (key) {
        delete this.items[key];
    };
    InMemoryKeyValueStore.prototype.clearAll = function () {
        this.items = {};
    };
    InMemoryKeyValueStore.prototype.isEmpty = function () {
        for (var key in this.items) {
            if (this.items.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    };
    return InMemoryKeyValueStore;
}());
export { InMemoryKeyValueStore };
//# sourceMappingURL=InMemoryKeyValueStore.js.map