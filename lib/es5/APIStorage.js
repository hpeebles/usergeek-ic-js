import { warn } from "./utils";
import { KeyValueStoreFacade } from "./store/KeyValueStoreFacade";
var store = KeyValueStoreFacade.createStore("ug-ic");
var Key_TopologyId = "coordinator__topologyId";
var Key_CanisterIds = "coordinator__canisterIds";
export var APIStorage = {
    coordinator: {
        getTopologyId: function () {
            var value = store.get(Key_TopologyId);
            if (value) {
                return Number(value);
            }
            return undefined;
        },
        setTopologyId: function (value) {
            store.set(Key_TopologyId, JSON.stringify(value));
        },
        getCanisterIds: function () {
            try {
                var valueFromStorage = store.get(Key_CanisterIds);
                if (valueFromStorage && Array.isArray(valueFromStorage)) {
                    return valueFromStorage;
                }
            }
            catch (e) {
                warn("storage.getCanisterIds", e);
            }
            return [];
        },
        setCanisterIds: function (value) {
            store.set(Key_CanisterIds, JSON.stringify(value));
        },
    }
};
//# sourceMappingURL=APIStorage.js.map