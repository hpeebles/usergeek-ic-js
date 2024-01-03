"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageVisibilityTracker = void 0;
const PageVisibilityApi_1 = require("./PageVisibilityApi");
const utils_1 = require("./../utils");
const ONE_DAY_MILLIS = 24 * 60 * 60 * 1000;
const LOG_KEY = "pageVisibility";
class PageVisibilityTracker {
    start(dayChangedCallback) {
        if (!this.started) {
            this.started = true;
            if (PageVisibilityApi_1.PageVisibilityApi.isSupported()) {
                this.lastTrackedSessionDayIndex = getCurrentDayIndex();
                PageVisibilityApi_1.PageVisibilityApi.addListener(() => {
                    if (PageVisibilityApi_1.PageVisibilityApi.state() == "visible") {
                        let currentDayIndex = getCurrentDayIndex();
                        const diff = currentDayIndex - this.lastTrackedSessionDayIndex;
                        if (diff > 0) {
                            this.lastTrackedSessionDayIndex = currentDayIndex;
                            (0, utils_1.log)(LOG_KEY, {
                                action: "trackSession",
                                currentDayIndex: this.lastTrackedSessionDayIndex
                            });
                            dayChangedCallback();
                        }
                    }
                });
            }
            else {
                (0, utils_1.warn)(LOG_KEY, "notSupported");
            }
        }
    }
}
exports.PageVisibilityTracker = PageVisibilityTracker;
const getCurrentDayIndex = () => Math.floor(new Date().getTime() / ONE_DAY_MILLIS);
//# sourceMappingURL=PageVisibilityTracker.js.map