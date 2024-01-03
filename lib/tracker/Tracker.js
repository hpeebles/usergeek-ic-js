"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
const utils_1 = require("../utils");
const ReportsStorage_1 = require("./ReportsStorage");
const KeyValueStoreFacade_1 = require("../store/KeyValueStoreFacade");
const Configuration_1 = require("./Configuration");
const Uploader_1 = require("./Uploader");
const EVENT_NAME_MAX_SIZE = 1024;
class Tracker {
    constructor(apiKey, clientPrincipal, initialConfiguration, debugConfiguration) {
        this.scheduleUpload = false;
        this.uploading = false;
        this.destroyed = false;
        this.isClientPrincipalEqual = (principal) => {
            return principal?.toText() == this.clientPrincipal?.toText();
        };
        this.logSession = () => {
            try {
                const reportSessionContent = {};
                const report = {
                    session: reportSessionContent
                };
                this.logReport(utils_1.UsergeekUtils.getCurrentTime(), report);
            }
            catch (e) {
                //nop
            }
        };
        this.logEvent = (eventName) => {
            try {
                const reportEventContent = {
                    name: String(eventName).trim()
                };
                const report = {
                    event: reportEventContent
                };
                this.logReport(utils_1.UsergeekUtils.getCurrentTime(), report);
            }
            catch (e) {
                //nop
            }
        };
        this.destroy = () => {
            this.destroyed = true;
            this.uploader?.destroy();
            window.clearTimeout(this.scheduleUploadTimer);
            this.scheduleUpload = false;
            (0, utils_1.warn)("Tracker: destroyed");
        };
        this.logReport = (timeMillis, reportContent) => {
            this.validateSequence();
            const reportSequence = ++this.sequence;
            const validationSuccess = this.validateReport(reportContent);
            if (!validationSuccess) {
                return;
            }
            if (this.configuration.dryRunEnabled) {
                if (reportContent && this.debugConfiguration?.loggerLog) {
                    this.debugConfiguration?.loggerLog(`Report skipped (dryRun ON)`, { reportContent });
                }
                return;
            }
            const putSuccess = this.reportsStorage.putReport(reportSequence, timeMillis, reportContent);
            if (!putSuccess) {
                if (this.debugConfiguration?.loggerError) {
                    this.debugConfiguration?.loggerError(`Unable to store data in localStorage. Seems that there is no space left... Will try to remove ${this.configuration.removeReportsPercentWhenFull}% of oldest events`);
                }
                const [tryToFreeSpaceSuccess, removeCount] = this.reportsStorage.tryToFreeSpace(reportSequence, this.configuration.removeReportsPercentWhenFull);
                if (tryToFreeSpaceSuccess) {
                    if (this.debugConfiguration?.loggerWarn) {
                        this.debugConfiguration?.loggerWarn(`Number of reports removed: ${removeCount}. Actual reports: ${this.reportsStorage.getReportsCount()}`);
                    }
                    this.reportsStorage.putReport(reportSequence, timeMillis, reportContent);
                }
                else {
                    if (this.debugConfiguration?.loggerError) {
                        this.debugConfiguration?.loggerError(`Failed to remove ${removeCount} reports. Existing reports: ${this.reportsStorage.getReportsCount()}`);
                    }
                    this.reportsStorage.clearAll();
                }
            }
            else {
                if (reportContent && this.debugConfiguration?.loggerLog) {
                    this.debugConfiguration?.loggerLog(`Report stored`, { reportSequence, timeMillis, reportContent });
                }
            }
            const reportsCount = this.reportsStorage.getReportsCount();
            if (reportsCount > this.configuration.maxReportsCountInStorage) {
                const [tryToFreeSpaceSuccess, removeCount] = this.reportsStorage.tryToFreeSpace(reportSequence, this.configuration.removeReportsPercentWhenFull);
                if (tryToFreeSpaceSuccess) {
                    if (this.debugConfiguration?.loggerWarn) {
                        this.debugConfiguration?.loggerWarn(`Number of reports removed: ${removeCount}. Actual reports: ${this.reportsStorage.getReportsCount()}`);
                    }
                }
                else {
                    if (this.debugConfiguration?.loggerError) {
                        this.debugConfiguration?.loggerError(`Failed to remove ${removeCount} reports. Existing reports: ${this.reportsStorage.getReportsCount()}`);
                    }
                }
            }
        };
        this.validateSequence = () => {
            // 9007199254740991 = (Math.pow(2, 53) - 1)
            if (this.sequence === 9007199254740991 - 1) {
                this.sequence = 0;
            }
        };
        this.clientPrincipal = clientPrincipal;
        this.configuration = Configuration_1.ConfigurationUtil.makeConfiguration(initialConfiguration);
        this.debugConfiguration = debugConfiguration;
        const storeNamespace = `ug-ic${apiKey}.${this.clientPrincipal.toText()}.reportsStorage`;
        this.reportsStorage = new ReportsStorage_1.ReportsStorage(KeyValueStoreFacade_1.KeyValueStoreFacade.createStore(storeNamespace));
        this.sequence = this.reportsStorage.getMaxSequence();
        this.validateSequence();
        if (this.debugConfiguration?.loggerLog) {
            this.debugConfiguration?.loggerLog("ReportStorage created", {
                storeNamespace,
                sequence: this.sequence,
                reportsCount: this.reportsStorage.getReportsCount()
            });
        }
        (0, utils_1.log)(`ReportStorage created with namespace "${storeNamespace}", sequence = ${this.sequence}, unsent reports in storage = ${this.reportsStorage.getReportsCount()}`);
    }
    hasUnsentPackets() {
        return this.reportsStorage.getReportsCount() > 0;
    }
    async upload(analyticsReceiverApiResult, sessionAlreadyTracked, apiParameters, force) {
        try {
            if (analyticsReceiverApiResult) {
                if (analyticsReceiverApiResult.analyticsStoreNotified && !sessionAlreadyTracked) {
                    //for the first time ever user is registered in clientRegistry - it means that there is one extra session report which must be removed
                    //implement it later...
                }
                if (!this.uploader) {
                    this.uploader = new Uploader_1.UploaderImpl(analyticsReceiverApiResult.analyticsReceiverApiView, apiParameters);
                }
                this.proceedToUpload(force);
                return (0, utils_1.createOkResult)("ok");
            }
            (0, utils_1.warn)("Tracker.upload: analyticsReceiverApiResult is undefined. upload skipped");
            return (0, utils_1.createErrResult)(new Error("AnalyticsStore unavailable."));
        }
        catch (e) {
            (0, utils_1.warn)("Tracker.upload", e);
            return (0, utils_1.createErrResult)(e);
        }
    }
    proceedToUpload(force) {
        const reportsCount = this.reportsStorage.getReportsCount();
        if (reportsCount > 0) {
            if (force) {
                window.clearTimeout(this.scheduleUploadTimer);
                this.scheduleUpload = false;
            }
            if (force || reportsCount >= this.configuration.uploadReportsCount) {
                // noinspection JSIgnoredPromiseFromCall
                this.uploadReports();
            }
            else {
                this.scheduleUploadReports();
            }
        }
    }
    async uploadReports() {
        if (this.destroyed) {
            (0, utils_1.warn)("Tracker: uploadReports skipped - destroyed");
            return;
        }
        if (this.uploading) {
            return;
        }
        this.uploading = true;
        try {
            const limit = this.configuration.uploadReportsCount;
            const reports = this.reportsStorage.getReports(limit);
            const uploadReportsData = this.buildUploadEventPacket(reports);
            if (uploadReportsData) {
                if (this.debugConfiguration?.loggerLog) {
                    this.debugConfiguration?.loggerLog(`Will send packet`, utils_1.UsergeekUtils.jsonStringifyWithBigInt({ packet: uploadReportsData }));
                }
                const uploadEventPacketResult = await this.uploader.uploadEventPacket(uploadReportsData.packet);
                this.handleUploadReportsResult(uploadEventPacketResult, uploadReportsData.maxSequence);
            }
            else {
                this.uploading = false;
            }
        }
        catch (e) {
            this.uploading = false;
            this.scheduleUploadReports();
        }
    }
    handleUploadReportsResult(uploadEventPacketResult, maxSequence) {
        this.uploading = false;
        if ((0, utils_1.isOk)(uploadEventPacketResult)) {
            this.reportsStorage.removeEarlyReports(maxSequence);
            if (this.debugConfiguration?.loggerLog) {
                this.debugConfiguration?.loggerLog(`Packet sent`);
            }
            // noinspection JSIgnoredPromiseFromCall
            this.uploadReports();
        }
        else {
            if (this.debugConfiguration?.loggerWarn) {
                this.debugConfiguration?.loggerWarn(`Packet send failed`, utils_1.UsergeekUtils.jsonStringifyWithBigInt({ result: uploadEventPacketResult }));
            }
            this.scheduleUploadReports();
        }
    }
    scheduleUploadReports() {
        if (this.destroyed) {
            (0, utils_1.warn)("Tracker: scheduleUploadReports skipped - destroyed");
            return;
        }
        if (this.scheduleUpload) {
            return;
        }
        else {
            this.scheduleUpload = true;
        }
        window.clearTimeout(this.scheduleUploadTimer);
        const delay = this.configuration.uploadReportsPeriod;
        this.scheduleUploadTimer = window.setTimeout(this.uploadReportsDelayed.bind(this), delay);
    }
    uploadReportsDelayed() {
        this.scheduleUpload = false;
        // noinspection JSIgnoredPromiseFromCall
        this.uploadReports();
    }
    buildUploadEventPacket(reports) {
        if (reports.length > 0) {
            let maxSequence = 0;
            const items = reports.map((report) => {
                maxSequence = Math.max(report.sequence, maxSequence);
                if ((0, utils_1.hasOwnProperty)(report.content, "event")) {
                    const event = {
                        name: report.content.event.name,
                        sequence: BigInt(report.sequence),
                        timeMillis: BigInt(report.timeMillis)
                    };
                    const packetItem = {
                        event: event
                    };
                    return packetItem;
                }
                else if ((0, utils_1.hasOwnProperty)(report.content, "session")) {
                    const session = {
                        sequence: BigInt(report.sequence),
                        timeMillis: BigInt(report.timeMillis)
                    };
                    const packetItem = {
                        session: session
                    };
                    return packetItem;
                }
            });
            const packet = {
                items: items
            };
            return {
                packet: packet,
                maxSequence: maxSequence
            };
        }
        return undefined;
    }
    validateReport(report) {
        if ((0, utils_1.hasOwnProperty)(report, "event")) {
            let error = null;
            const eventName = report.event.name;
            if (utils_1.UsergeekUtils.isStringEmpty(eventName)) {
                error = "empty";
            }
            else if (utils_1.UsergeekUtils.getSize(eventName) > EVENT_NAME_MAX_SIZE) {
                error = "tooLong";
            }
            if (error) {
                if (this.debugConfiguration?.loggerError) {
                    this.debugConfiguration?.loggerError(`Failed to send event!`, { event: report.event, error: error });
                }
                return false;
            }
        }
        return true;
    }
}
exports.Tracker = Tracker;
//# sourceMappingURL=Tracker.js.map