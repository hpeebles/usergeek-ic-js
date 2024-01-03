"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationUtil = void 0;
exports.ConfigurationUtil = {
    makeConfiguration: (initialConfiguration) => {
        return {
            uploadReportsCount: 50,
            uploadReportsPeriod: 5 * 1000,
            maxReportsCountInStorage: 1000,
            removeReportsPercentWhenFull: 2,
            dryRunEnabled: false,
            ...initialConfiguration
        };
    }
};
//# sourceMappingURL=Configuration.js.map