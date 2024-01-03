"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsStoreApi = void 0;
const analyticsStore_1 = require("./canisters/analyticsStore");
const utils_1 = require("./utils");
const agent_1 = require("@dfinity/agent");
const APIService_1 = require("./APIService");
class AnalyticsStoreApi {
    constructor() {
        this.destroyed = false;
        this.destroy = () => {
            this.destroyed = true;
            (0, utils_1.warn)("AnalyticsStoreApi: destroyed");
        };
        this.sendPacket = async (parameters) => {
            const actor = (0, analyticsStore_1.createCanisterActor)(parameters.canisterPrincipal.toText(), new agent_1.AnonymousIdentity(), parameters.host);
            const validatePacketResponse = await this.validatePacket(actor, parameters);
            (0, utils_1.log)("AnalyticsStoreApi.sendPacket validatePacket", validatePacketResponse);
            if ((0, utils_1.isOk)(validatePacketResponse)) {
                //check for errors
                const validate_rejectedItems = validatePacketResponse.ok;
                if (validate_rejectedItems.length > 0) {
                    //remove bad items from packet based on validation result
                    parameters.packet.items = parameters.packet.items.filter((item) => {
                        const isBadItem = validate_rejectedItems.some((rejectedItem) => {
                            if ((0, utils_1.hasOwnProperty)(item, "event")) {
                                return rejectedItem.sequence == item.event.sequence;
                            }
                            else if ((0, utils_1.hasOwnProperty)(item, "session")) {
                                return rejectedItem.sequence == item.session.sequence;
                            }
                            //by default
                            return false;
                        });
                        return !isBadItem;
                    });
                }
                if (parameters.packet.items.length > 0) {
                    const collectPacketResponse = await this.collectPacket(actor, parameters);
                    (0, utils_1.log)("AnalyticsStoreApi.sendPacket collectPacket", collectPacketResponse);
                    if ((0, utils_1.isOk)(collectPacketResponse)) {
                        return (0, utils_1.createOkResult)(null);
                    }
                    else if ((0, utils_1.isErr)(collectPacketResponse)) {
                        return collectPacketResponse;
                    }
                }
                else {
                    //all event are bad
                    return (0, utils_1.createOkResult)(null);
                }
            }
            else if ((0, utils_1.isErr)(validatePacketResponse)) {
                return validatePacketResponse;
            }
            return (0, utils_1.createErrFatal)();
        };
        this.actor_getAnalyticsReceiverApi = async (actor, parameters) => {
            let result;
            try {
                result = await actor.getAnalyticsReceiverApi([parameters.clientPrincipal], parameters.sdkVersion, parameters.accessToken);
            }
            catch (e) {
                (0, utils_1.warn)("AnalyticsStoreApi.getAnalyticsReceiverApi actor.getAnalyticsReceiverApi", e);
                return (0, utils_1.createErrRetry)();
            }
            (0, utils_1.log)("AnalyticsStoreApi.getAnalyticsReceiverApi actor.getAnalyticsReceiverApi", result);
            if ((0, utils_1.isOk)(result)) {
                const apiPrincipal = AnalyticsStoreApi.getAnalyticsReceiverApiPrincipal(result.ok);
                return (0, utils_1.createOkResult)({
                    canisterPrincipal: apiPrincipal,
                    accessToken: parameters.accessToken
                });
            }
            else if ((0, utils_1.isErr)(result)) {
                const error = result.err;
                if ((0, utils_1.isErrTemporarilyUnavailable)(error)) {
                    return (0, utils_1.createErrRetry)();
                }
            }
            return (0, utils_1.createErrFatal)();
        };
        this.validatePacket = async (actor, parameters) => {
            let result;
            try {
                result = await actor.validatePacket([parameters.clientPrincipal], parameters.sdkVersion, parameters.accessToken, parameters.packet);
            }
            catch (e) {
                (0, utils_1.warn)("AnalyticsStoreApi.validatePacket actor.validatePacket", e);
                return (0, utils_1.createErrRetry)();
            }
            (0, utils_1.log)("AnalyticsStoreApi.validatePacket actor.validatePacket", result);
            if ((0, utils_1.isOk)(result)) {
                let rejectedItems = [];
                if (result.ok.rejectedItems.length == 1) {
                    rejectedItems = result.ok.rejectedItems[0];
                }
                return (0, utils_1.createOkResult)(rejectedItems);
            }
            else if ((0, utils_1.isErr)(result)) {
                const error = result.err;
                if ((0, utils_1.isErrApi)(error)) {
                    const apiError = error.api;
                    if ((0, utils_1.isErrTemporarilyUnavailable)(apiError)) {
                        return (0, utils_1.createErrRetry)();
                    }
                }
            }
            return (0, utils_1.createErrFatal)();
        };
        this.collectPacket = async (actor, parameters) => {
            let result;
            try {
                result = await actor.collectPacket([parameters.clientPrincipal], parameters.sdkVersion, parameters.accessToken, parameters.packet);
            }
            catch (e) {
                (0, utils_1.warn)("AnalyticsStoreApi.collectPacket actor.collectPacket", e);
                return (0, utils_1.createErrRetry)();
            }
            (0, utils_1.log)("AnalyticsStoreApi.collectPacket actor.collectPacket", result);
            if ((0, utils_1.isOk)(result)) {
                return (0, utils_1.createOkResult)(null);
            }
            else if ((0, utils_1.isErr)(result)) {
                const error = result.err;
                if ((0, utils_1.isErrApi)(error)) {
                    const apiError = error.api;
                    if ((0, utils_1.isErrTemporarilyUnavailable)(apiError)) {
                        return (0, utils_1.createErrRetry)();
                    }
                }
            }
            return (0, utils_1.createErrFatal)();
        };
    }
    async getAnalyticsReceiverApiRecursively(parameters, retriesLeft) {
        const getAnalyticsReceiverApiResult = await this.getAnalyticsReceiverApi(parameters);
        (0, utils_1.log)("AnalyticsStoreApi.getAnalyticsReceiverApiRecursively.getAnalyticsReceiverApi", getAnalyticsReceiverApiResult, { retriesLeft });
        if ((0, utils_1.isOk)(getAnalyticsReceiverApiResult)) {
            return getAnalyticsReceiverApiResult;
        }
        else if ((0, utils_1.isErr)(getAnalyticsReceiverApiResult)) {
            switch (getAnalyticsReceiverApiResult.err) {
                case "retry": {
                    if (retriesLeft > 0) {
                        if (!this.destroyed) {
                            const timeout = (0, APIService_1.getTimeout)(APIService_1.ANALYTICS_STORE_RETRIES - retriesLeft);
                            (0, utils_1.log)("sleep for", timeout, "ms");
                            await (0, utils_1.delayPromise)(timeout);
                            return this.getAnalyticsReceiverApiRecursively(parameters, retriesLeft - 1);
                        }
                        else {
                            (0, utils_1.warn)("AnalyticsStoreApi: getAnalyticsReceiverApiRecursively skipped - destroyed");
                        }
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        }
        return (0, utils_1.createErrFatal)();
    }
    async trackPacketRecursively(parameters, retriesLeft) {
        const sendPacketResponse = await this.sendPacket(parameters);
        if ((0, utils_1.isOk)(sendPacketResponse)) {
            return sendPacketResponse;
        }
        else if ((0, utils_1.isErr)(sendPacketResponse)) {
            switch (sendPacketResponse.err) {
                case "retry": {
                    if (retriesLeft > 0) {
                        if (!this.destroyed) {
                            const timeout = (0, APIService_1.getTimeout)(APIService_1.ANALYTICS_STORE_RETRIES - retriesLeft);
                            (0, utils_1.log)("sleep for", timeout, "ms");
                            await (0, utils_1.delayPromise)(timeout);
                            return this.trackPacketRecursively(parameters, retriesLeft - 1);
                        }
                        else {
                            (0, utils_1.warn)("AnalyticsStoreApi: trackPacketRecursively skipped - destroyed");
                        }
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        }
        return (0, utils_1.createErrFatal)();
    }
    async getAnalyticsReceiverApi(parameters) {
        const getApiActor = (0, analyticsStore_1.createCanisterActor)(parameters.canisterPrincipal.toText(), new agent_1.AnonymousIdentity(), parameters.host);
        const handleGetAnalyticsReceiverApiResponse = await this.actor_getAnalyticsReceiverApi(getApiActor, parameters);
        (0, utils_1.log)("AnalyticsStoreApi.getAnalyticsReceiverApi", handleGetAnalyticsReceiverApiResponse);
        if ((0, utils_1.isOk)(handleGetAnalyticsReceiverApiResponse)) {
            return (0, utils_1.createOkResult)(handleGetAnalyticsReceiverApiResponse.ok);
        }
        else if ((0, utils_1.isErr)(handleGetAnalyticsReceiverApiResponse)) {
            return handleGetAnalyticsReceiverApiResponse;
        }
        return (0, utils_1.createErrFatal)();
    }
}
exports.AnalyticsStoreApi = AnalyticsStoreApi;
AnalyticsStoreApi.getAnalyticsReceiverApiPrincipal = (analyticsReceiverApi) => {
    const getAnalyticsReceiverApiData = (0, utils_1.getSharedFunctionData)(analyticsReceiverApi.isCollectRequired);
    if (getAnalyticsReceiverApiData) {
        const [principal] = getAnalyticsReceiverApiData;
        return principal;
    }
    return undefined;
};
//# sourceMappingURL=AnalyticsStoreApi.js.map