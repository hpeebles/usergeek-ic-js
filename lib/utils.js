"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsergeekUtils = exports.warn = exports.log = exports.delayPromise = exports.getSharedFunctionDataPrincipal = exports.getSharedFunctionData = exports.isErrWrongTopology = exports.isErrApi = exports.isErrTemporarilyUnavailable = exports.createErrRestart = exports.createErrRetry = exports.createErrFatal = exports.createProceedResult = exports.createErrResult = exports.createOkResult = exports.isProceed = exports.isErr = exports.isOk = exports.hasOwnProperty = void 0;
const okResultKey = "ok";
const errResultKey = "err";
const proceedResultKey = "proceed";
/**
 * We want to check if prop is a property key of obj
 * @param obj - object
 * @param prop - property
 */
function hasOwnProperty(obj, prop) {
    return obj && obj.hasOwnProperty(prop);
}
exports.hasOwnProperty = hasOwnProperty;
const isOk = (obj) => {
    return hasOwnProperty(obj, okResultKey);
};
exports.isOk = isOk;
const isErr = (obj) => {
    return hasOwnProperty(obj, errResultKey);
};
exports.isErr = isErr;
const isProceed = (obj) => {
    return hasOwnProperty(obj, proceedResultKey);
};
exports.isProceed = isProceed;
const createOkResult = (value) => {
    return { [okResultKey]: value };
};
exports.createOkResult = createOkResult;
const createErrResult = (value) => {
    return { [errResultKey]: value };
};
exports.createErrResult = createErrResult;
const createProceedResult = (value) => {
    return { [proceedResultKey]: value };
};
exports.createProceedResult = createProceedResult;
const createErrFatal = () => {
    return (0, exports.createErrResult)("fatal");
};
exports.createErrFatal = createErrFatal;
const createErrRetry = () => {
    return (0, exports.createErrResult)("retry");
};
exports.createErrRetry = createErrRetry;
const createErrRestart = () => {
    return (0, exports.createErrResult)("restart");
};
exports.createErrRestart = createErrRestart;
const isErrTemporarilyUnavailable = (obj) => {
    return hasOwnProperty(obj, "temporarilyUnavailable");
};
exports.isErrTemporarilyUnavailable = isErrTemporarilyUnavailable;
const isErrApi = (obj) => {
    return hasOwnProperty(obj, "api");
};
exports.isErrApi = isErrApi;
const isErrWrongTopology = (obj) => {
    return hasOwnProperty(obj, "wrongTopology");
};
exports.isErrWrongTopology = isErrWrongTopology;
const getSharedFunctionData = (value) => {
    try {
        if (Array.isArray(value)) {
            const newCoordinator = value;
            if (newCoordinator.length === 2) {
                const principal = newCoordinator[0];
                if (typeof principal["toText"] != "function") {
                    (0, exports.warn)("util.getSharedFunctionData: bad principal object", principal);
                }
                const methodName = newCoordinator[1];
                return [principal, methodName];
            }
        }
    }
    catch (e) {
        (0, exports.warn)("util.getSharedFunctionData", e);
    }
    return undefined;
};
exports.getSharedFunctionData = getSharedFunctionData;
const getSharedFunctionDataPrincipal = (value) => {
    try {
        if (Array.isArray(value)) {
            const newCoordinator = value;
            if (newCoordinator.length === 2) {
                const principal = newCoordinator[0];
                if (typeof principal["toText"] != "function") {
                    (0, exports.warn)("util.getSharedFunctionDataPrincipal: bad principal object", principal);
                }
                return principal;
            }
        }
    }
    catch (e) {
        (0, exports.warn)("util.getSharedFunctionDataPrincipal", e);
    }
    return undefined;
};
exports.getSharedFunctionDataPrincipal = getSharedFunctionDataPrincipal;
const delayPromise = (duration) => {
    return new Promise(resolve => setTimeout(resolve, duration));
};
exports.delayPromise = delayPromise;
function log(...args) {
    dumpToWindow("log", args);
    // if (process.env.NODE_ENV === "development") {
    //     console.log.apply(null, ["DEV LOG", ...args])
    // }
}
exports.log = log;
const warn = (...args) => {
    dumpToWindow("warn", args);
    // if (process.env.NODE_ENV === "development") {
    //     console.warn.apply(null, ["DEV WARN", ...args])
    // }
};
exports.warn = warn;
const usergeekLogName = "UsergeekLog";
let debugSequenceId = 0;
function dumpToWindow(ctx, value) {
    window[usergeekLogName] = window[usergeekLogName] || {};
    window[usergeekLogName][ctx] = window[usergeekLogName][ctx] || [];
    window[usergeekLogName][ctx].push([debugSequenceId++, new Date().getTime(), ...value]);
    if (window[usergeekLogName][ctx].length >= 1000) {
        window[usergeekLogName][ctx].splice(0, 100);
    }
}
class UsergeekUtils {
    static getCurrentTime() {
        return new Date().getTime();
    }
    static isString(value) {
        return typeof value === "string" || value instanceof String;
    }
    static isStringEmpty(value) {
        if (!UsergeekUtils.isString(value)) {
            return true;
        }
        const stringValue = value;
        return stringValue.length === 0;
    }
    static isNil(value) {
        return value == null;
    }
    static isNumber(value) {
        return typeof value === 'number' ||
            (UsergeekUtils.isObjectLike(value) && UsergeekUtils.getTag(value) === '[object Number]');
    }
    static isMap(value) {
        return value instanceof Map;
    }
    static isArray(value) {
        return value instanceof Array || Array.isArray(value);
    }
    static isObjectLike(value) {
        return typeof value === 'object' && value !== null;
    }
    static getTag(value) {
        if (value == null) {
            return value === undefined ? '[object Undefined]' : '[object Null]';
        }
        return toString.call(value);
    }
    static parseJSONSafe(value) {
        try {
            return JSON.parse(value);
        }
        catch (e) {
        }
        return undefined;
    }
    static getSize(value) {
        if (UsergeekUtils.isNil(value)) {
            return 0;
        }
        if (UsergeekUtils.isMap(value)) {
            return value.size;
        }
        if (UsergeekUtils.isObjectLike(value)) {
            return Object.keys(value).length;
        }
        if (UsergeekUtils.isArray(value) || UsergeekUtils.isString(value)) {
            return value.length;
        }
        return 0;
    }
    static jsonStringifyWithBigInt(value) {
        return JSON.stringify(value, (key, value) => typeof value === "bigint" ? value.toString() + "n" : value);
    }
    static jsonParseWithBigInt(value) {
        return JSON.parse(value, (key, value) => {
            if (typeof value === "string" && /^\d+n$/.test(value)) {
                return BigInt(value.substr(0, value.length - 1));
            }
            return value;
        });
    }
}
exports.UsergeekUtils = UsergeekUtils;
//# sourceMappingURL=utils.js.map