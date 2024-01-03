"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIStorage = void 0;
const utils_1 = require("./utils");
const KeyValueStoreFacade_1 = require("./store/KeyValueStoreFacade");
const store = KeyValueStoreFacade_1.KeyValueStoreFacade.createStore("ug-ic");
const Key_TopologyId = "coordinator__topologyId";
const Key_CanisterIds = "coordinator__canisterIds";
exports.APIStorage = {
    coordinator: {
        getTopologyId: () => {
            const value = store.get(Key_TopologyId);
            if (value) {
                return Number(value);
            }
            return undefined;
        },
        setTopologyId: (value) => {
            store.set(Key_TopologyId, JSON.stringify(value));
        },
        getCanisterIds: () => {
            try {
                const valueFromStorage = store.get(Key_CanisterIds);
                if (valueFromStorage && Array.isArray(valueFromStorage)) {
                    return valueFromStorage;
                }
            }
            catch (e) {
                (0, utils_1.warn)("storage.getCanisterIds", e);
            }
            return [];
        },
        setCanisterIds: (value) => {
            store.set(Key_CanisterIds, JSON.stringify(value));
        },
    }
};
//# sourceMappingURL=APIStorage.js.map