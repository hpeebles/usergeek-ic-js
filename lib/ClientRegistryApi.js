"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRegistryApi = void 0;
const agent_1 = require("@dfinity/agent");
const clientRegistry_1 = require("./canisters/clientRegistry");
const utils_1 = require("./utils");
const APIService_1 = require("./APIService");
class ClientRegistryApi {
    constructor() {
        this.destroyed = false;
        this.destroy = () => {
            this.destroyed = true;
            (0, utils_1.warn)("CoordinatorApi: destroyed");
        };
        this.getResult = async (parameters) => {
            const actor = (0, clientRegistry_1.createCanisterActor)(parameters.clientRegistryPrincipal.toText(), new agent_1.AnonymousIdentity(), parameters.host);
            const handleGetAnalyticsReceiverResponse = await this.getAnalyticsReceiver(actor, parameters);
            (0, utils_1.log)("ClientRegistryApi.getResult.getAnalyticsReceiver", handleGetAnalyticsReceiverResponse);
            if (!this.destroyed) {
                if ((0, utils_1.isOk)(handleGetAnalyticsReceiverResponse)) {
                    const analyticsReceiverView = handleGetAnalyticsReceiverResponse.ok;
                    if (analyticsReceiverView) {
                        return (0, utils_1.createOkResult)({
                            analyticsStoreNotified: false,
                            analyticsReceiverView: analyticsReceiverView
                        });
                    }
                }
                else if ((0, utils_1.isErr)(handleGetAnalyticsReceiverResponse)) {
                    switch (handleGetAnalyticsReceiverResponse.err) {
                        case "clientNotRegistered":
                            const handleRegisterClientResult = await this.registerClient(actor, parameters);
                            (0, utils_1.log)("handle.registerClient", handleRegisterClientResult);
                            if (!this.destroyed) {
                                if ((0, utils_1.isOk)(handleRegisterClientResult)) {
                                    return handleRegisterClientResult;
                                }
                                else if ((0, utils_1.isProceed)(handleRegisterClientResult)) {
                                    return handleRegisterClientResult;
                                }
                                else if ((0, utils_1.isErr)(handleRegisterClientResult)) {
                                    return handleRegisterClientResult;
                                }
                            }
                            else {
                                (0, utils_1.warn)("ClientRegistryApi: registerClient() result skipped - destroyed");
                            }
                            break;
                        case "retry": {
                            return (0, utils_1.createErrRetry)();
                        }
                        case "restart": {
                            return (0, utils_1.createErrRestart)();
                        }
                        default: {
                            //all other error should stop
                            break;
                        }
                    }
                }
            }
            else {
                (0, utils_1.warn)("ClientRegistryApi: getAnalyticsReceiver() result skipped - destroyed");
            }
            return (0, utils_1.createErrFatal)();
        };
        this.getAnalyticsReceiver = async (actor, parameters) => {
            let result;
            try {
                result = await actor.getAnalyticsReceiver([parameters.clientPrincipal], parameters.sdkVersion, parameters.apiKey);
            }
            catch (e) {
                (0, utils_1.warn)("ClientRegistryApi.getAnalyticsReceiver actor.getAnalyticsReceiver", e);
                return (0, utils_1.createErrRetry)();
            }
            (0, utils_1.log)("ClientRegistryApi.getAnalyticsReceiver actor.getAnalyticsReceiver", result);
            if ((0, utils_1.isOk)(result)) {
                const analyticsReceiverView = ClientRegistryApi.getAnalyticsReceiverData(result.ok);
                if (analyticsReceiverView) {
                    return (0, utils_1.createOkResult)(analyticsReceiverView);
                }
            }
            else if ((0, utils_1.isErr)(result)) {
                const error = result.err;
                if ((0, utils_1.hasOwnProperty)(error, "clientNotRegistered")) {
                    return (0, utils_1.createErrResult)("clientNotRegistered");
                }
                if ((0, utils_1.isErrTemporarilyUnavailable)(error)) {
                    return (0, utils_1.createErrRetry)();
                }
                if ((0, utils_1.isErrWrongTopology)(error)) {
                    return (0, utils_1.createErrRestart)();
                }
            }
            return (0, utils_1.createErrFatal)();
        };
        this.registerClient = async (actor, parameters) => {
            let result;
            try {
                result = await actor.registerClient([parameters.clientPrincipal], parameters.sdkVersion, parameters.apiKey);
            }
            catch (e) {
                (0, utils_1.warn)("ClientRegistryApi.registerClient actor.registerClient", e);
                return (0, utils_1.createErrRetry)();
            }
            (0, utils_1.log)("ClientRegistryApi.registerClient actor.registerClient", result);
            if ((0, utils_1.isOk)(result)) {
                const { analyticsReceiver, analyticsStoreNotified } = result.ok;
                const analyticsReceiverView = ClientRegistryApi.getAnalyticsReceiverData(analyticsReceiver);
                if (analyticsReceiverView) {
                    return (0, utils_1.createOkResult)({
                        analyticsStoreNotified: analyticsStoreNotified,
                        analyticsReceiverView: analyticsReceiverView
                    });
                }
            }
            else if ((0, utils_1.isErr)(result)) {
                const error = result.err;
                if ((0, utils_1.isErrTemporarilyUnavailable)(error)) {
                    return (0, utils_1.createErrRetry)();
                }
                if ((0, utils_1.isErrWrongTopology)(error)) {
                    return (0, utils_1.createErrRestart)();
                }
            }
            return (0, utils_1.createErrFatal)();
        };
    }
    async callClientRegistryRecursively(parameters, retriesLeft) {
        const clientRegistryResponse = await this.getResult(parameters);
        (0, utils_1.log)("ClientRegistryApi.callClientRegistryRecursively.clientRegistry", clientRegistryResponse, { retriesLeft });
        if ((0, utils_1.isProceed)(clientRegistryResponse)) {
            return clientRegistryResponse;
        }
        else if ((0, utils_1.isOk)(clientRegistryResponse)) {
            return clientRegistryResponse;
        }
        else if ((0, utils_1.isErr)(clientRegistryResponse)) {
            switch (clientRegistryResponse.err) {
                case "retry": {
                    if (retriesLeft > 0) {
                        if (!this.destroyed) {
                            const timeout = (0, APIService_1.getTimeout)(APIService_1.CLIENT_REGISTRY_RETRIES - retriesLeft);
                            (0, utils_1.log)("sleep for", timeout, "ms");
                            await (0, utils_1.delayPromise)(timeout);
                            return this.callClientRegistryRecursively(parameters, retriesLeft - 1);
                        }
                        else {
                            (0, utils_1.warn)("ClientRegistryApi: callClientRegistryRecursively skipped - destroyed");
                        }
                    }
                    break;
                }
                case "restart": {
                    return (0, utils_1.createErrRestart)();
                }
                default: {
                    break;
                }
            }
        }
        return (0, utils_1.createErrFatal)();
    }
}
exports.ClientRegistryApi = ClientRegistryApi;
ClientRegistryApi.getAnalyticsReceiverData = (analyticsReceiver) => {
    const getAnalyticsReceiverPrincipal = (0, utils_1.getSharedFunctionDataPrincipal)(analyticsReceiver.getAnalyticsReceiverApi);
    if (getAnalyticsReceiverPrincipal) {
        return {
            canisterPrincipal: getAnalyticsReceiverPrincipal,
            accessToken: analyticsReceiver.accessToken
        };
    }
    return undefined;
};
//# sourceMappingURL=ClientRegistryApi.js.map