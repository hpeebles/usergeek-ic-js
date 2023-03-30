import { PageVisibilityApi } from "./PageVisibilityApi";
import { log, warn } from "./../utils";
var ONE_DAY_MILLIS = 24 * 60 * 60 * 1000;
var LOG_KEY = "pageVisibility";
var PageVisibilityTracker = /** @class */ (function () {
    function PageVisibilityTracker() {
    }
    PageVisibilityTracker.prototype.start = function (dayChangedCallback) {
        var _this = this;
        if (!this.started) {
            this.started = true;
            if (PageVisibilityApi.isSupported()) {
                this.lastTrackedSessionDayIndex = getCurrentDayIndex();
                PageVisibilityApi.addListener(function () {
                    if (PageVisibilityApi.state() == "visible") {
                        var currentDayIndex = getCurrentDayIndex();
                        var diff = currentDayIndex - _this.lastTrackedSessionDayIndex;
                        if (diff > 0) {
                            _this.lastTrackedSessionDayIndex = currentDayIndex;
                            log(LOG_KEY, {
                                action: "trackSession",
                                currentDayIndex: _this.lastTrackedSessionDayIndex
                            });
                            dayChangedCallback();
                        }
                    }
                });
            }
            else {
                warn(LOG_KEY, "notSupported");
            }
        }
    };
    return PageVisibilityTracker;
}());
export { PageVisibilityTracker };
var getCurrentDayIndex = function () { return Math.floor(new Date().getTime() / ONE_DAY_MILLIS); };
//# sourceMappingURL=PageVisibilityTracker.js.map