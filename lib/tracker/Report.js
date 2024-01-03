"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const utils_1 = require("../utils");
class Report {
    constructor(sequence, timeMillis, content) {
        this.sequence = sequence;
        this.timeMillis = timeMillis;
        this.content = content;
    }
    static serialize(report) {
        return JSON.stringify({
            sequence: report.sequence,
            timeMillis: report.timeMillis,
            content: JSON.stringify(report.content)
        });
    }
    static deserialize(serializedReport) {
        const reportJSONObject = utils_1.UsergeekUtils.parseJSONSafe(serializedReport);
        if (reportJSONObject) {
            const sequence = reportJSONObject.sequence;
            const timeMillis = reportJSONObject.timeMillis;
            const content = reportJSONObject.content;
            if (utils_1.UsergeekUtils.isNumber(sequence) && utils_1.UsergeekUtils.isNumber(timeMillis) && utils_1.UsergeekUtils.isString(content)) {
                const reportContentJSONObject = utils_1.UsergeekUtils.parseJSONSafe(content);
                if (reportContentJSONObject) {
                    if ((0, utils_1.hasOwnProperty)(reportContentJSONObject, "event")) {
                        return new Report(sequence, timeMillis, reportContentJSONObject);
                    }
                    else if ((0, utils_1.hasOwnProperty)(reportContentJSONObject, "session")) {
                        return new Report(sequence, timeMillis, reportContentJSONObject);
                    }
                }
            }
        }
        return undefined;
    }
}
exports.Report = Report;
//# sourceMappingURL=Report.js.map