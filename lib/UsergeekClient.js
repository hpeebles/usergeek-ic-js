"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsergeekClient = void 0;
const PageVisibilityTracker_1 = require("./pageVisibility/PageVisibilityTracker");
const APIService_1 = require("./APIService");
const utils_1 = require("./utils");
const Tracker_1 = require("./tracker/Tracker");
const sdkVersion = 1;
class UsergeekClient {
    constructor() {
        this.sessionAlreadyTracked = false;
        this.init = (config) => {
            this.destroy();
            this.config = config;
            try {
                (0, utils_1.log)(`Usergeek: initialized with config: ${JSON.stringify(config)}`);
            }
            catch (e) {
            }
        };
        this.setPrincipal = (principal) => {
            try {
                this.validateConfig();
                this.destroy();
                this.clientPrincipal = principal;
                this.tryToUploadPendingPackets();
            }
            catch (e) {
                if (this.config?.debugConfiguration?.loggerError) {
                    this.config?.debugConfiguration?.loggerError(`Please pass valid Principal`, { principal });
                }
                (0, utils_1.warn)("UsergeekClient.setPrincipal", e);
            }
        };
        this.trackSession = () => {
            (async () => {
                try {
                    this.validateAndPrepareEventTracker();
                    this.tracker.logSession();
                    if (!this.pageVisibilityTracker) {
                        this.pageVisibilityTracker = new PageVisibilityTracker_1.PageVisibilityTracker();
                        this.pageVisibilityTracker.start(() => {
                            // noinspection JSIgnoredPromiseFromCall
                            this.trackSession();
                        });
                    }
                    await this.waitForAnalyticsReceiverApiReadyAndUpload(true, true);
                }
                catch (e) {
                    if (this.config?.debugConfiguration?.loggerError) {
                        this.config?.debugConfiguration?.loggerError("UsergeekClient.trackSession", e);
                    }
                    (0, utils_1.warn)("UsergeekClient.trackSession", e);
                }
            })();
        };
        this.trackEvent = (eventName) => {
            (async () => {
                try {
                    this.validateAndPrepareEventTracker();
                    this.tracker.logEvent(eventName);
                    await this.waitForAnalyticsReceiverApiReadyAndUpload(false, false);
                }
                catch (e) {
                    if (this.config?.debugConfiguration?.loggerError) {
                        this.config?.debugConfiguration?.loggerError("UsergeekClient.trackEvent", e);
                    }
                    (0, utils_1.warn)("UsergeekClient.trackEvent", e);
                }
            })();
        };
        this.flush = () => {
            (async () => {
                try {
                    this.validateAndPrepareEventTracker();
                    await this.waitForAnalyticsReceiverApiReadyAndUpload(true, false);
                }
                catch (e) {
                    (0, utils_1.warn)("UsergeekClient.flush", e);
                }
            })();
        };
        this.validateAndPrepareEventTracker = () => {
            validateApiParameters(this.config.apiKey, this.clientPrincipal);
            this.askForAnalyticsReceiverApi();
            if (!this.tracker) {
                this.tracker = new Tracker_1.Tracker(this.config.apiKey, this.clientPrincipal, this.config.eventTrackerConfiguration, this.config.debugConfiguration);
            }
        };
        this.waitForAnalyticsReceiverApiReadyAndUpload = async (flush, markSessionAsTracked) => {
            await this.onAnalyticsReceiverApiReady((analyticsReceiverApiResult) => {
                if (analyticsReceiverApiResult) {
                    const apiParameters = {
                        apiKey: this.config.apiKey,
                        clientPrincipal: this.clientPrincipal,
                        host: this.config.host,
                        sdkVersion: sdkVersion,
                    };
                    if (this.tracker) {
                        const promise = this.tracker.upload(analyticsReceiverApiResult, this.sessionAlreadyTracked, apiParameters, flush);
                        if (markSessionAsTracked) {
                            this.sessionAlreadyTracked = true;
                        }
                        return promise;
                    }
                }
            });
        };
        this.tryToUploadPendingPackets = () => {
            const apiParametersValid = isApiKeyValid(this.config.apiKey) && isClientPrincipalValid(this.clientPrincipal);
            if (apiParametersValid) {
                // api parameters valid
                // if EventsTracker does not exist OR clientPrincipal changed...
                // ...it is possible to try to upload pending custom events
                if (!this.tracker || !this.tracker.isClientPrincipalEqual(this.clientPrincipal)) {
                    this.tracker = new Tracker_1.Tracker(this.config.apiKey, this.clientPrincipal, this.config.eventTrackerConfiguration, this.config.debugConfiguration);
                    if (this.tracker.hasUnsentPackets()) {
                        // ...try to prefetch AnalyticsReceiverApi in case is it not exist
                        this.askForAnalyticsReceiverApi();
                        // noinspection JSIgnoredPromiseFromCall
                        this.waitForAnalyticsReceiverApiReadyAndUpload(true, false);
                    }
                }
            }
            else {
                if (this.config?.debugConfiguration?.loggerWarn) {
                    this.config?.debugConfiguration?.loggerWarn(`Please pass valid apiKey and non anonymous Principal.`);
                }
                (0, utils_1.warn)("UsergeekClient.tryToUploadPendingPackets: Please pass valid apiKey and non anonymous Principal.", { apiKey: this.config?.apiKey, clientPrincipal: this.clientPrincipal });
            }
        };
        this.onAnalyticsReceiverApiReady = (promise) => {
            return this.analyticsReceiverApiPromise.then(promise);
        };
        this.askForAnalyticsReceiverApi = () => {
            if (!this.analyticsReceiverApiPromise) {
                this.analyticsReceiverApiPromise = Promise.resolve().then(this.getAnalyticsReceiverApi);
            }
        };
        this.getAnalyticsReceiverApi = async () => {
            try {
                const apiParameters = {
                    apiKey: this.config.apiKey,
                    clientPrincipal: this.clientPrincipal,
                    host: this.config.host,
                    sdkVersion: sdkVersion
                };
                if (!this.apiService) {
                    this.apiService = new APIService_1.APIService();
                }
                const getAnalyticsReceiverApiResult = await this.apiService.getAnalyticsReceiverApi(apiParameters);
                if ((0, utils_1.isOk)(getAnalyticsReceiverApiResult)) {
                    return getAnalyticsReceiverApiResult.ok;
                }
                return undefined;
            }
            catch (e) {
                (0, utils_1.warn)("UsergeekClient.getAnalyticsReceiverApi", e);
                return undefined;
            }
        };
        this.validateConfig = () => {
            if (this.config == undefined) {
                throw "UsergeekClient: Please initialize Usergeek first!";
            }
        };
        this.destroy = () => {
            if (this.apiService) {
                this.apiService.destroy();
                this.apiService = undefined;
            }
            if (this.tracker) {
                //destroy existing tracker if principal cleared
                this.tracker.destroy();
                this.tracker = undefined;
                if (this.config?.debugConfiguration?.loggerWarn) {
                    this.config?.debugConfiguration?.loggerWarn(`Existing Tracker destroyed`, { clientPrincipal: this.clientPrincipal });
                }
                (0, utils_1.warn)(`UsergeekClient.setPrincipal: existing Tracker destroyed`, { clientPrincipal: this.clientPrincipal });
            }
            this.analyticsReceiverApiPromise = undefined;
            this.sessionAlreadyTracked = false;
        };
    }
}
exports.UsergeekClient = UsergeekClient;
const validateApiParameters = (apiKey, clientPrincipal) => {
    if (!isApiKeyValid(apiKey)) {
        throw "Usergeek: ApiKey should be not empty string";
    }
    if (!isClientPrincipalValid(clientPrincipal)) {
        throw "Usergeek: anonymous Principal cannot be tracked";
    }
};
const isApiKeyValid = (apiKey) => typeof apiKey == "string" && apiKey.length > 0;
const isClientPrincipalValid = (clientPrincipal) => clientPrincipal && !clientPrincipal.isAnonymous();
//# sourceMappingURL=UsergeekClient.js.map