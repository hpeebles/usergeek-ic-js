"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeout = exports.APIService = exports.ANALYTICS_STORE_RETRIES = exports.CLIENT_REGISTRY_RETRIES = exports.COORDINATOR_RETRIES = exports.timeoutBetweenRetriesSec = void 0;
const CoordinatorAPI_1 = require("./CoordinatorAPI");
const ClientRegistryApi_1 = require("./ClientRegistryApi");
const utils_1 = require("./utils");
const AnalyticsStoreApi_1 = require("./AnalyticsStoreApi");
exports.timeoutBetweenRetriesSec = 2;
const GLOBAL_RETRIES = 20;
exports.COORDINATOR_RETRIES = 20;
exports.CLIENT_REGISTRY_RETRIES = 20;
exports.ANALYTICS_STORE_RETRIES = 20;
class APIService {
    constructor() {
        this.destroyed = false;
        this.destroy = () => {
            this.destroyed = true;
            this.coordinatorApi?.destroy();
            this.coordinatorApi = undefined;
            this.clientRegistryApi?.destroy();
            this.clientRegistryApi = undefined;
            this.analyticsStoreApi?.destroy();
            this.analyticsStoreApi = undefined;
            (0, utils_1.warn)("APIService: destroyed");
        };
    }
    async getAnalyticsReceiverApi(apiParameters) {
        try {
            const result = await this.getAnalyticsReceiverApiRecursively(apiParameters, GLOBAL_RETRIES);
            (0, utils_1.log)("APIService.getAnalyticsReceiverApi: getAnalyticsReceiverApiRecursively() result", result);
            return result;
        }
        catch (e) {
            (0, utils_1.warn)("APIService.getAnalyticsReceiverApi getAnalyticsReceiverApiRecursively() error", e);
        }
        return (0, utils_1.createErrFatal)();
    }
    async getAnalyticsReceiverApiRecursively(apiParameters, retriesLeft) {
        if (!this.coordinatorApi) {
            this.coordinatorApi = new CoordinatorAPI_1.CoordinatorApi();
        }
        const coordinatorResponse = await this.coordinatorApi.callCoordinatorRecursively(apiParameters, exports.COORDINATOR_RETRIES);
        (0, utils_1.log)("APIService.getAnalyticsReceiverApiRecursively.CoordinatorApi.callCoordinatorRecursively", coordinatorResponse);
        if (!this.destroyed) {
            if ((0, utils_1.isOk)(coordinatorResponse)) {
                const okResponse = coordinatorResponse.ok;
                if ((0, CoordinatorAPI_1.isClientRegistry)(okResponse)) {
                    //proceed to clientRegistry
                    const { canisterPrincipal: clientRegistryPrincipal } = okResponse.clientRegistry;
                    const clientRegistryApiParameters = {
                        ...apiParameters,
                        clientRegistryPrincipal: clientRegistryPrincipal
                    };
                    if (!this.clientRegistryApi) {
                        this.clientRegistryApi = new ClientRegistryApi_1.ClientRegistryApi();
                    }
                    const clientRegistryResponse = await this.clientRegistryApi.callClientRegistryRecursively(clientRegistryApiParameters, exports.CLIENT_REGISTRY_RETRIES);
                    (0, utils_1.log)("APIService.getAnalyticsReceiverApiRecursively.ClientRegistryApi.callClientRegistryRecursively", clientRegistryResponse);
                    if (!this.destroyed) {
                        if ((0, utils_1.isOk)(clientRegistryResponse)) {
                            const analyticsReceiverView = clientRegistryResponse.ok;
                            const analyticsStoreApiParameters = {
                                ...apiParameters,
                                canisterPrincipal: analyticsReceiverView.analyticsReceiverView.canisterPrincipal,
                                accessToken: analyticsReceiverView.analyticsReceiverView.accessToken
                            };
                            if (!this.analyticsStoreApi) {
                                this.analyticsStoreApi = new AnalyticsStoreApi_1.AnalyticsStoreApi();
                            }
                            const analyticsReceiverApiResult = await this.analyticsStoreApi.getAnalyticsReceiverApiRecursively(analyticsStoreApiParameters, exports.ANALYTICS_STORE_RETRIES);
                            (0, utils_1.log)("APIService.getAnalyticsReceiverApiRecursively.AnalyticsStoreApi.getAnalyticsReceiverApiRecursively", analyticsReceiverApiResult);
                            if (!this.destroyed) {
                                if ((0, utils_1.isOk)(analyticsReceiverApiResult)) {
                                    const analyticsReceiverApiView = analyticsReceiverApiResult.ok;
                                    return (0, utils_1.createOkResult)({
                                        analyticsReceiverApiView: analyticsReceiverApiView,
                                        analyticsStoreNotified: analyticsReceiverView.analyticsStoreNotified
                                    });
                                }
                            }
                            else {
                                (0, utils_1.warn)("APIService: analyticsStoreApi.getAnalyticsReceiverApiRecursively() result skipped - destroyed");
                            }
                        }
                        else if ((0, utils_1.isErr)(clientRegistryResponse)) {
                            switch (clientRegistryResponse.err) {
                                case "restart": {
                                    if (!this.destroyed) {
                                        const timeout = (0, exports.getTimeout)(GLOBAL_RETRIES - retriesLeft);
                                        (0, utils_1.log)("sleep for", timeout, "ms");
                                        await (0, utils_1.delayPromise)(timeout);
                                        return await this.getAnalyticsReceiverApiRecursively(apiParameters, retriesLeft - 1);
                                    }
                                    else {
                                        (0, utils_1.warn)("APIService: getAnalyticsReceiverApiRecursively skipped - destroyed");
                                    }
                                    break;
                                }
                                default: {
                                    return clientRegistryResponse;
                                }
                            }
                        }
                    }
                    else {
                        (0, utils_1.warn)("APIService: clientRegistryApi.callClientRegistryRecursively() result skipped - destroyed");
                    }
                }
                else if ((0, CoordinatorAPI_1.isAnalyticsReceiver)(okResponse)) {
                    const { view: analyticsReceiverView } = okResponse.analyticsReceiver;
                    const analyticsStoreApiParameters = {
                        ...apiParameters,
                        canisterPrincipal: analyticsReceiverView.canisterPrincipal,
                        accessToken: analyticsReceiverView.accessToken
                    };
                    if (!this.analyticsStoreApi) {
                        this.analyticsStoreApi = new AnalyticsStoreApi_1.AnalyticsStoreApi();
                    }
                    const analyticsReceiverApiResult = await this.analyticsStoreApi.getAnalyticsReceiverApiRecursively(analyticsStoreApiParameters, exports.ANALYTICS_STORE_RETRIES);
                    (0, utils_1.log)("APIService.getAnalyticsReceiverApiRecursively.AnalyticsStoreApi.getAnalyticsReceiverApiRecursively", analyticsReceiverApiResult);
                    if (!this.destroyed) {
                        if ((0, utils_1.isOk)(analyticsReceiverApiResult)) {
                            const analyticsReceiverApiView = analyticsReceiverApiResult.ok;
                            return (0, utils_1.createOkResult)({
                                analyticsReceiverApiView: analyticsReceiverApiView,
                                analyticsStoreNotified: false
                            });
                        }
                    }
                    else {
                        (0, utils_1.warn)("APIService: analyticsStoreApi.getAnalyticsReceiverApiRecursively() result skipped - destroyed");
                    }
                }
            }
        }
        else {
            (0, utils_1.warn)("APIService: coordinatorApi.callCoordinatorRecursively() result skipped - destroyed");
        }
        return (0, utils_1.createErrFatal)();
    }
}
exports.APIService = APIService;
const getTimeout = (retryIndex) => {
    return Math.max(exports.timeoutBetweenRetriesSec, Math.pow(exports.timeoutBetweenRetriesSec, retryIndex + 1)) * 1000;
};
exports.getTimeout = getTimeout;
//# sourceMappingURL=APIService.js.map