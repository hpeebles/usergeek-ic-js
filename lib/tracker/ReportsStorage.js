"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsStorage = void 0;
const Report_1 = require("./Report");
const KEY_REPORTS = "reports";
class ReportsStorage {
    constructor(api) {
        this.api = api;
    }
    getMaxSequence() {
        let maxSequence = 0;
        this.getReports().forEach((report) => {
            maxSequence = Math.max(report.sequence, maxSequence);
        });
        return maxSequence;
    }
    getReportsCount() {
        return this._storage_getReportsSafe().length;
    }
    putReport(sequence, timeMillis, reportContent) {
        const reports = this._storage_getReportsSafe();
        const report = new Report_1.Report(sequence, timeMillis, reportContent);
        const reportSerialized = Report_1.Report.serialize(report);
        reports.push(reportSerialized);
        return this._storage_setReports(reports);
    }
    tryToFreeSpace(reportSequence, removeReportsPercentWhenFull) {
        const reportsCount = this.getReportsCount();
        const removeCount = Math.ceil((reportsCount * removeReportsPercentWhenFull) / 100);
        const sequenceForRemove = reportSequence - Math.max(1, reportsCount - removeCount);
        const removeSuccess = this.removeEarlyReports(sequenceForRemove);
        return [removeSuccess, removeCount];
    }
    removeEarlyReports(reportSequence) {
        let indexToDeleteTo = -1;
        this.getReports().forEach((report, idx) => {
            if (report.sequence <= reportSequence) {
                indexToDeleteTo = idx;
            }
        });
        if (indexToDeleteTo > -1) {
            const reports = this._storage_getReportsSafe();
            reports.splice(0, indexToDeleteTo + 1);
            return this._storage_setReports(reports);
        }
        return true;
    }
    getReports(limit) {
        const targetSize = limit !== undefined ? limit : -1;
        const result = [];
        const fetchAll = targetSize < 0;
        this._storage_getReportsSafe().some((reportJSONString, idx) => {
            const someResult = fetchAll ? false : idx >= targetSize;
            if (!someResult) {
                const report = Report_1.Report.deserialize(reportJSONString);
                if (report) {
                    result.push(report);
                }
            }
            return someResult;
        });
        return result;
    }
    clearAll() {
        this._storage_clearReports();
    }
    _storage_getReportsSafe() {
        return this.api.get(KEY_REPORTS) || Array();
    }
    _storage_setReports(reports) {
        try {
            this.api.set(KEY_REPORTS, reports);
            return true;
        }
        catch (e) {
            // maybe QuotaExceededError here
            return false;
        }
    }
    _storage_clearReports() {
        this.api.remove(KEY_REPORTS);
    }
}
exports.ReportsStorage = ReportsStorage;
//# sourceMappingURL=ReportsStorage.js.map