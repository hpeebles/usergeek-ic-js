import { hasOwnProperty, UsergeekUtils } from "../utils";
var Report = /** @class */ (function () {
    function Report(sequence, timeMillis, content) {
        this.sequence = sequence;
        this.timeMillis = timeMillis;
        this.content = content;
    }
    Report.serialize = function (report) {
        return JSON.stringify({
            sequence: report.sequence,
            timeMillis: report.timeMillis,
            content: JSON.stringify(report.content)
        });
    };
    Report.deserialize = function (serializedReport) {
        var reportJSONObject = UsergeekUtils.parseJSONSafe(serializedReport);
        if (reportJSONObject) {
            var sequence = reportJSONObject.sequence;
            var timeMillis = reportJSONObject.timeMillis;
            var content = reportJSONObject.content;
            if (UsergeekUtils.isNumber(sequence) && UsergeekUtils.isNumber(timeMillis) && UsergeekUtils.isString(content)) {
                var reportContentJSONObject = UsergeekUtils.parseJSONSafe(content);
                if (reportContentJSONObject) {
                    if (hasOwnProperty(reportContentJSONObject, "event")) {
                        return new Report(sequence, timeMillis, reportContentJSONObject);
                    }
                    else if (hasOwnProperty(reportContentJSONObject, "session")) {
                        return new Report(sequence, timeMillis, reportContentJSONObject);
                    }
                }
            }
        }
        return undefined;
    };
    return Report;
}());
export { Report };
//# sourceMappingURL=Report.js.map