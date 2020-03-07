var MPromise = /** @class */ (function () {
    function MPromise(executor) {
        var _this = this;
        this.then = function (onFulfilled, onRejected) {
            return new MPromise(function (resolve, reject) {
                if (!onRejected) {
                    onRejected = function () { };
                }
                var registerResolveTask = function () {
                    if (typeof onFulfilled != "function")
                        resolve(_this.value);
                    try {
                        var res = onFulfilled(_this.value);
                        if (res instanceof MPromise)
                            res.then(resolve, reject);
                        else
                            resolve(res);
                    }
                    catch (err) {
                        reject(err);
                    }
                };
                var registerRejectTask = function () {
                    if (typeof onRejected != "function")
                        reject(onRejected);
                    try {
                        var res = onRejected(_this.err);
                        if (res instanceof MPromise)
                            res.then(resolve, reject);
                        else
                            reject(res);
                    }
                    catch (err) {
                        reject(err);
                    }
                };
                var _FactExecuteTask = {
                    resolveTask: function () { return queueMicrotask(registerResolveTask); },
                    rejectTask: function () { return queueMicrotask(registerRejectTask); }
                };
                switch (_this.status) {
                    case "PENDING":
                        _this._FulfilledTaskQueue.push(_FactExecuteTask.resolveTask);
                        _this._RejectedTaskQueue.push(_FactExecuteTask.rejectTask);
                        break;
                    case "FULFILLED":
                        _FactExecuteTask.resolveTask();
                        break;
                    case "REJECTED":
                        _FactExecuteTask.rejectTask();
                        break;
                }
            });
        };
        this["catch"] = function (onRejected) {
            return _this.then(null, onRejected);
        };
        this._FulfilledTaskQueue = this._RejectedTaskQueue = [];
        this.status = "PENDING";
        this.value = this.err = null;
        var resolve = function (value) {
            var _resolveGeneralValue = function (value) {
                if (_this.status == "PENDING") {
                    _this.status = 'FULFILLED';
                    _this.value = value;
                    _this._FulfilledTaskQueue.forEach(function (thenFunc) {
                        thenFunc(value);
                    });
                }
            };
            if (value instanceof MPromise) {
                value.then(function (val) {
                    if (val instanceof MPromise)
                        resolve(val);
                    else
                        _resolveGeneralValue(val);
                }, function (err) { return reject(err); });
            }
            else {
                _resolveGeneralValue(value);
            }
        };
        var reject = function (err) {
            if (_this.status == "PENDING") {
                _this.status = "REJECTED";
                _this.err = err;
                _this._RejectedTaskQueue.forEach(function (thenFunc) {
                    thenFunc();
                });
            }
        };
        try {
            executor(resolve, reject);
        }
        catch (err) {
            this.err = err;
            reject(err);
        }
    }
    MPromise.Resolve = function (v) {
        return new MPromise(function (resolve) { return resolve(v); });
    };
    MPromise.Reject = function (e) {
        return new MPromise(function (_, reject) { return reject(e); });
    };
    MPromise.All = function (waitExecute) {
        var executeCount = 0;
        var executeResult = [];
        var executeErr = null;
        var _continue = null;
        var _reject = null;
        waitExecute.forEach(function (curPromise, i) {
            curPromise.then(function (val) {
                executeResult[i] = val;
                executeCount += 1;
                if (executeCount == waitExecute.length)
                    _continue(executeResult);
            })["catch"](function (err) {
                executeErr = err;
                _reject(executeErr);
            });
        });
        return new MPromise(function (resolve, rejected) {
            _continue = resolve;
            _reject = rejected;
        });
    };
    MPromise.Race = function (waitExecute) {
        var _continue = null;
        var _reject = null;
        waitExecute.forEach(function (curPromise) {
            curPromise.then(function (val) {
                _continue(val);
            })["catch"](function (err) {
                _reject(err);
            });
        });
        return new MPromise(function (resolve, rejected) {
            _continue = resolve;
            _reject = rejected;
        });
    };
    return MPromise;
}());
