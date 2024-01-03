"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageVisibilityApi = void 0;
exports.PageVisibilityApi = ((doc) => {
    const hasDocument = typeof document !== "undefined";
    const isSupported = hasDocument && Boolean(document.addEventListener);
    if (isSupported) {
        const vendorEvents = [
            {
                hidden: "hidden",
                event: "visibilitychange",
                state: "visibilityState",
            },
            {
                hidden: "webkitHidden",
                event: "webkitvisibilitychange",
                state: "webkitVisibilityState",
            },
        ];
        const getCurrentVendorEvent = () => {
            if (!isSupported) {
                return undefined;
            }
            for (const event of vendorEvents) {
                if (event.hidden in document) {
                    return event;
                }
            }
            return undefined;
        };
        const currentVendorEvent = getCurrentVendorEvent();
        if (currentVendorEvent) {
            return {
                isSupported: () => isSupported,
                state: () => doc[currentVendorEvent.state],
                addListener: function (listener) {
                    doc.addEventListener(currentVendorEvent.event, listener);
                },
                removeListener: function (listener) {
                    doc.removeEventListener(currentVendorEvent.event, listener);
                },
            };
        }
    }
    return {
        isSupported: () => isSupported,
        state: () => "visible",
        addListener: () => undefined,
        removeListener: () => undefined,
    };
})(document);
//# sourceMappingURL=PageVisibilityApi.js.map