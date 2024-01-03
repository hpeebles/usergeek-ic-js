"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploaderImpl = void 0;
const AnalyticsStoreApi_1 = require("../AnalyticsStoreApi");
const APIService_1 = require("../APIService");
const utils_1 = require("../utils");
class UploaderImpl {
    constructor(analyticsReceiverApiView, apiParameters) {
        this.uploadEventPacket = async (packet) => {
            try {
                const parameters = {
                    ...this.apiParameters,
                    canisterPrincipal: this.analyticsReceiverApiView.canisterPrincipal,
                    accessToken: this.analyticsReceiverApiView.accessToken,
                    packet: packet
                };
                if (!this.analyticsStoreApi) {
                    this.analyticsStoreApi = new AnalyticsStoreApi_1.AnalyticsStoreApi();
                }
                const trackEventRecursivelyResult = await this.analyticsStoreApi.trackPacketRecursively(parameters, APIService_1.ANALYTICS_STORE_RETRIES);
                if ((0, utils_1.isOk)(trackEventRecursivelyResult)) {
                    return trackEventRecursivelyResult;
                }
            }
            catch (e) {
                (0, utils_1.warn)("Uploader.uploadEventPacket trackPacketRecursively", e);
            }
            return (0, utils_1.createErrResult)(null);
        };
        this.destroy = () => {
            this.analyticsStoreApi?.destroy();
            this.analyticsStoreApi = undefined;
            (0, utils_1.warn)("Uploader: destroyed");
        };
        this.analyticsReceiverApiView = analyticsReceiverApiView;
        this.apiParameters = apiParameters;
    }
}
exports.UploaderImpl = UploaderImpl;
//# sourceMappingURL=Uploader.js.map