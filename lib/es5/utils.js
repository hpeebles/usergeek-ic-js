var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var okResultKey = "ok";
var errResultKey = "err";
var proceedResultKey = "proceed";
/**
 * We want to check if prop is a property key of obj
 * @param obj - object
 * @param prop - property
 */
export function hasOwnProperty(obj, prop) {
    return obj && obj.hasOwnProperty(prop);
}
export var isOk = function (obj) {
    return hasOwnProperty(obj, okResultKey);
};
export var isErr = function (obj) {
    return hasOwnProperty(obj, errResultKey);
};
export var isProceed = function (obj) {
    return hasOwnProperty(obj, proceedResultKey);
};
export var createOkResult = function (value) {
    var _a;
    return _a = {}, _a[okResultKey] = value, _a;
};
export var createErrResult = function (value) {
    var _a;
    return _a = {}, _a[errResultKey] = value, _a;
};
export var createProceedResult = function (value) {
    var _a;
    return _a = {}, _a[proceedResultKey] = value, _a;
};
export var createErrFatal = function () {
    return createErrResult("fatal");
};
export var createErrRetry = function () {
    return createErrResult("retry");
};
export var createErrRestart = function () {
    return createErrResult("restart");
};
export var isErrTemporarilyUnavailable = function (obj) {
    return hasOwnProperty(obj, "temporarilyUnavailable");
};
export var isErrApi = function (obj) {
    return hasOwnProperty(obj, "api");
};
export var isErrWrongTopology = function (obj) {
    return hasOwnProperty(obj, "wrongTopology");
};
export var getSharedFunctionData = function (value) {
    try {
        if (Array.isArray(value)) {
            var newCoordinator = value;
            if (newCoordinator.length === 2) {
                var principal = newCoordinator[0];
                if (typeof principal["toText"] != "function") {
                    warn("util.getSharedFunctionData: bad principal object", principal);
                }
                var methodName = newCoordinator[1];
                return [principal, methodName];
            }
        }
    }
    catch (e) {
        warn("util.getSharedFunctionData", e);
    }
    return undefined;
};
export var getSharedFunctionDataPrincipal = function (value) {
    try {
        if (Array.isArray(value)) {
            var newCoordinator = value;
            if (newCoordinator.length === 2) {
                var principal = newCoordinator[0];
                if (typeof principal["toText"] != "function") {
                    warn("util.getSharedFunctionDataPrincipal: bad principal object", principal);
                }
                return principal;
            }
        }
    }
    catch (e) {
        warn("util.getSharedFunctionDataPrincipal", e);
    }
    return undefined;
};
export var delayPromise = function (duration) {
    return new Promise(function (resolve) { return setTimeout(resolve, duration); });
};
export function log() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    dumpToWindow("log", args);
    // if (process.env.NODE_ENV === "development") {
    //     console.log.apply(null, ["DEV LOG", ...args])
    // }
}
export var warn = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    dumpToWindow("warn", args);
    // if (process.env.NODE_ENV === "development") {
    //     console.warn.apply(null, ["DEV WARN", ...args])
    // }
};
var usergeekLogName = "UsergeekLog";
var debugSequenceId = 0;
function dumpToWindow(ctx, value) {
    window[usergeekLogName] = window[usergeekLogName] || {};
    window[usergeekLogName][ctx] = window[usergeekLogName][ctx] || [];
    window[usergeekLogName][ctx].push(__spreadArray([debugSequenceId++, new Date().getTime()], value, true));
    if (window[usergeekLogName][ctx].length >= 1000) {
        window[usergeekLogName][ctx].splice(0, 100);
    }
}
var UsergeekUtils = /** @class */ (function () {
    function UsergeekUtils() {
    }
    UsergeekUtils.getCurrentTime = function () {
        return new Date().getTime();
    };
    UsergeekUtils.isString = function (value) {
        return typeof value === "string" || value instanceof String;
    };
    UsergeekUtils.isStringEmpty = function (value) {
        if (!UsergeekUtils.isString(value)) {
            return true;
        }
        var stringValue = value;
        return stringValue.length === 0;
    };
    UsergeekUtils.isNil = function (value) {
        return value == null;
    };
    UsergeekUtils.isNumber = function (value) {
        return typeof value === 'number' ||
            (UsergeekUtils.isObjectLike(value) && UsergeekUtils.getTag(value) === '[object Number]');
    };
    UsergeekUtils.isMap = function (value) {
        return value instanceof Map;
    };
    UsergeekUtils.isArray = function (value) {
        return value instanceof Array || Array.isArray(value);
    };
    UsergeekUtils.isObjectLike = function (value) {
        return typeof value === 'object' && value !== null;
    };
    UsergeekUtils.getTag = function (value) {
        if (value == null) {
            return value === undefined ? '[object Undefined]' : '[object Null]';
        }
        return toString.call(value);
    };
    UsergeekUtils.parseJSONSafe = function (value) {
        try {
            return JSON.parse(value);
        }
        catch (e) {
        }
        return undefined;
    };
    UsergeekUtils.getSize = function (value) {
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
    };
    UsergeekUtils.jsonStringifyWithBigInt = function (value) {
        return JSON.stringify(value, function (key, value) {
            return typeof value === "bigint" ? value.toString() + "n" : value;
        });
    };
    UsergeekUtils.jsonParseWithBigInt = function (value) {
        return JSON.parse(value, function (key, value) {
            if (typeof value === "string" && /^\d+n$/.test(value)) {
                return BigInt(value.substr(0, value.length - 1));
            }
            return value;
        });
    };
    return UsergeekUtils;
}());
export { UsergeekUtils };
//# sourceMappingURL=utils.js.map