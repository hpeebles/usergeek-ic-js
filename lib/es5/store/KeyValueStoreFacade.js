import { LocalStorageKeyValueStore } from "./LocalStorageKeyValueStore";
import { InMemoryKeyValueStore } from "./InMemoryKeyValueStore";
export var grabLocalStorage = function () {
    return window.localStorage;
};
var checkLocalStorage = function () {
    try {
        var storage = grabLocalStorage();
        var testKey = "ug-ic_test_ls";
        storage.setItem(testKey, "_");
        storage.removeItem(testKey);
        return true;
    }
    catch (e) {
        return false;
    }
};
var isLocalStorageSupported = checkLocalStorage();
var createStore = function (namespace) {
    if (namespace === void 0) { namespace = ""; }
    if (isLocalStorageSupported) {
        return new LocalStorageKeyValueStore(namespace);
    }
    else {
        return new InMemoryKeyValueStore();
    }
};
export var KeyValueStoreFacade = {
    createStore: createStore,
};
//# sourceMappingURL=KeyValueStoreFacade.js.map