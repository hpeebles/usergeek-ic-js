"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoordinatorApi = exports.isAnalyticsReceiver = exports.isClientRegistry = void 0;
const agent_1 = require("@dfinity/agent");
const coordinator_1 = require("./canisters/coordinator");
const APIStorage_1 = require("./APIStorage");
const utils_1 = require("./utils");
const ClientRegistryApi_1 = require("./ClientRegistryApi");
const APIService_1 = require("./APIService");
const constants_1 = require("./canisters/constants");
const isClientRegistry = (obj) => {
    return (0, utils_1.hasOwnProperty)(obj, "clientRegistry");
};
exports.isClientRegistry = isClientRegistry;
const isAnalyticsReceiver = (obj) => {
    return (0, utils_1.hasOwnProperty)(obj, "analyticsReceiver");
};
exports.isAnalyticsReceiver = isAnalyticsReceiver;
let currentSessionTopologyId;
class CoordinatorApi {
    constructor() {
        this.destroyed = false;
        this.destroy = () => {
            this.destroyed = true;
            (0, utils_1.warn)("CoordinatorApi: destroyed");
        };
        this.getResult = async (apiParameters) => {
            currentSessionTopologyId = APIStorage_1.APIStorage.coordinator.getTopologyId();
            let canisterIds = APIStorage_1.APIStorage.coordinator.getCanisterIds();
            if (canisterIds.length === 0) {
                canisterIds = Array.from(constants_1.coordinator_canister_ids);
            }
            if (canisterIds.length === 0) {
                (0, utils_1.warn)("no canisters");
                return (0, utils_1.createErrFatal)();
            }
            return this.getClientRegistryRecursively(apiParameters, canisterIds);
        };
        this.getClientRegistryRecursively = async (apiParameters, inProgressCanisterIds) => {
            const canisterId = CoordinatorApi.getCanisterId(inProgressCanisterIds);
            (0, utils_1.log)("CoordinatorApi.getClientRegistryRecursively using", { inProgressCanisterIds, currentSessionTopologyId, canisterId });
            if (canisterId) {
                let result;
                try {
                    result = await this.hello(apiParameters, canisterId);
                }
                catch (e) {
                    (0, utils_1.warn)("CoordinatorApi.getClientRegistryRecursively actor.hello", e);
                    return (0, utils_1.createErrRetry)();
                }
                (0, utils_1.log)("CoordinatorApi.getClientRegistryRecursively actor.hello", result);
                if ((0, utils_1.hasOwnProperty)(result, "clientRegistry")) {
                    const clientRegistry = result.clientRegistry;
                    const clientRegistryPrincipal = (0, utils_1.getSharedFunctionDataPrincipal)(clientRegistry.getAnalyticsReceiver);
                    if (clientRegistryPrincipal) {
                        return (0, utils_1.createOkResult)({ clientRegistry: { canisterPrincipal: clientRegistryPrincipal } });
                    }
                }
                else if ((0, utils_1.hasOwnProperty)(result, "analyticsReceiver")) {
                    const analyticsReceiver = result.analyticsReceiver;
                    const analyticsReceiverView = ClientRegistryApi_1.ClientRegistryApi.getAnalyticsReceiverData(analyticsReceiver);
                    if (analyticsReceiverView) {
                        return (0, utils_1.createOkResult)({ analyticsReceiver: { view: analyticsReceiverView } });
                    }
                }
                else if ((0, utils_1.hasOwnProperty)(result, "changeTopology")) {
                    const changeTopology = result.changeTopology;
                    const newTopologyId = changeTopology.topologyId;
                    const newCoordinators = changeTopology.coordinators;
                    const newCanisterIds = [];
                    for (let i = 0; i < newCoordinators.length; i++) {
                        const newCoordinatorData = (0, utils_1.getSharedFunctionData)(newCoordinators[i]);
                        if (newCoordinatorData) {
                            const [coordinatorPrincipal, coordinatorMethodName] = newCoordinatorData;
                            if (coordinatorMethodName == "hello") {
                                newCanisterIds.push(coordinatorPrincipal.toText());
                            }
                        }
                    }
                    if (newCanisterIds.length > 0) {
                        currentSessionTopologyId = newTopologyId;
                        APIStorage_1.APIStorage.coordinator.setCanisterIds(newCanisterIds);
                        APIStorage_1.APIStorage.coordinator.setTopologyId(newTopologyId);
                    }
                    return (0, utils_1.createErrResult)("changeTopology");
                }
                else if ((0, utils_1.hasOwnProperty)(result, "invalidClient")) {
                    return (0, utils_1.createErrFatal)();
                }
                //"temporaryUnavailable" case
                if (!this.destroyed) {
                    const timeout = APIService_1.timeoutBetweenRetriesSec * 1000;
                    (0, utils_1.log)("sleep for", timeout, "ms");
                    await (0, utils_1.delayPromise)(timeout);
                    const updatedInProgressCanisters = CoordinatorApi.markCanisterIdAsFailed(canisterId, inProgressCanisterIds);
                    return this.getClientRegistryRecursively(apiParameters, updatedInProgressCanisters);
                }
                else {
                    (0, utils_1.warn)("CoordinatorApi: temporaryUnavailable: getClientRegistryRecursively skipped - destroyed");
                }
            }
            return (0, utils_1.createErrRetry)();
        };
        this.hello = async (apiParameters, canisterId) => {
            const actor = (0, coordinator_1.createCanisterActor)(canisterId, new agent_1.AnonymousIdentity(), apiParameters.host);
            const topologyId = currentSessionTopologyId;
            return await actor.hello([apiParameters.clientPrincipal], apiParameters.sdkVersion, topologyId ? [topologyId] : [], apiParameters.apiKey);
        };
    }
    async callCoordinatorRecursively(apiParameters, retriesLeft) {
        const coordinatorResponse = await this.getResult(apiParameters);
        (0, utils_1.log)("CoordinatorApi.callCoordinatorRecursively.coordinator", coordinatorResponse, { retriesLeft });
        if ((0, utils_1.isOk)(coordinatorResponse)) {
            return coordinatorResponse;
        }
        else if ((0, utils_1.isProceed)(coordinatorResponse)) {
            return coordinatorResponse;
        }
        else if ((0, utils_1.isErr)(coordinatorResponse)) {
            switch (coordinatorResponse.err) {
                case "changeTopology": {
                    if (!this.destroyed) {
                        const timeout = (0, APIService_1.getTimeout)(APIService_1.COORDINATOR_RETRIES - retriesLeft);
                        (0, utils_1.log)("sleep for", timeout, "ms");
                        await (0, utils_1.delayPromise)(timeout);
                        return this.callCoordinatorRecursively(apiParameters, retriesLeft - 1);
                    }
                    else {
                        (0, utils_1.warn)("CoordinatorApi: changeTopology: callCoordinatorRecursively skipped - destroyed");
                    }
                    break;
                }
                case "retry": {
                    if (retriesLeft > 0) {
                        if (!this.destroyed) {
                            const timeout = (0, APIService_1.getTimeout)(APIService_1.COORDINATOR_RETRIES - retriesLeft);
                            (0, utils_1.log)("sleep for", timeout, "ms");
                            await (0, utils_1.delayPromise)(timeout);
                            return this.callCoordinatorRecursively(apiParameters, retriesLeft - 1);
                        }
                        else {
                            (0, utils_1.warn)("CoordinatorApi: retry: callCoordinatorRecursively skipped - destroyed");
                        }
                    }
                    break;
                }
                default: {
                }
            }
        }
        return (0, utils_1.createErrFatal)();
    }
    static markCanisterIdAsFailed(failedCanisterId, inProgressCanisterIds) {
        return inProgressCanisterIds.filter(value => value !== failedCanisterId);
    }
}
exports.CoordinatorApi = CoordinatorApi;
CoordinatorApi.getRandomCanisterId = (array) => {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
};
CoordinatorApi.getCanisterId = (inProgressCanisterIds) => {
    if (inProgressCanisterIds.length == 0) {
        return undefined;
    }
    return CoordinatorApi.getRandomCanisterId(inProgressCanisterIds);
};
//# sourceMappingURL=CoordinatorAPI.js.map