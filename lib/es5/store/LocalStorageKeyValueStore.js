import { parseValue, stringifyValue } from "./KeyValueStore";
import { grabLocalStorage } from "./KeyValueStoreFacade";
var each = function (store, namespace, callback) {
    for (var i = 0; i < store.length; i++) {
        var key = store.key(i);
        var prefix = namespace;
        if (key && key.indexOf(prefix) === 0) {
            var rawKey = key.substring(prefix.length);
            callback(rawKey);
        }
    }
};
var allKeys = function (store, namespace) {
    var result = [];
    each(store, namespace, function (key) { return result.push(key); });
    return result;
};
var LocalStorageKeyValueStore = /** @class */ (function () {
    function LocalStorageKeyValueStore(namespace) {
        if (namespace === void 0) { namespace = ""; }
        this.namespace = namespace;
        this.store = grabLocalStorage();
    }
    LocalStorageKeyValueStore.prototype.isFake = function () {
        return false;
    };
    LocalStorageKeyValueStore.prototype.set = function (key, data) {
        var k = this.namespace + key;
        var d = stringifyValue(data);
        this.store.setItem(k, d);
    };
    LocalStorageKeyValueStore.prototype.get = function (key) {
        var k = this.namespace + key;
        var storageValue = this.store.getItem(k);
        if (storageValue) {
            return parseValue(storageValue);
        }
        return undefined;
    };
    LocalStorageKeyValueStore.prototype.remove = function (key) {
        var k = this.namespace + key;
        this.store.removeItem(k);
    };
    LocalStorageKeyValueStore.prototype.clearAll = function () {
        var keys = allKeys(this.store, this.namespace);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            this.remove(key);
        }
    };
    LocalStorageKeyValueStore.prototype.isEmpty = function () {
        for (var i = 0; i < this.store.length; i++) {
            var key = this.store.key(i);
            if (key && key.indexOf(this.namespace) === 0) {
                return false;
            }
        }
        return true;
    };
    return LocalStorageKeyValueStore;
}());
export { LocalStorageKeyValueStore };
//# sourceMappingURL=LocalStorageKeyValueStore.js.map