"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MPromise {
    constructor(executor) {
        this.then = (onFulfilled, onRejected) => new MPromise((resolve, reject) => {
            if (!onRejected) {
                onRejected = () => { };
            }
            const registerResolveTask = () => {
                if (typeof onFulfilled != "function")
                    resolve(this.value);
                try {
                    const res = onFulfilled(this.value);
                    if (res instanceof MPromise)
                        res.then(resolve, reject);
                    else
                        resolve(res);
                }
                catch (err) {
                    reject(err);
                }
            };
            const registerRejectTask = () => {
                if (typeof onRejected != "function")
                    reject(onRejected);
                try {
                    const res = onRejected(this.err);
                    if (res instanceof MPromise)
                        res.then(resolve, reject);
                    else
                        reject(res);
                }
                catch (err) {
                    reject(err);
                }
            };
            const _FactExecuteTask = {
                resolveTask: () => queueMicrotask(registerResolveTask),
                rejectTask: () => queueMicrotask(registerRejectTask),
            };
            switch (this.status) {
                case "PENDING":
                    this._FulfilledTaskQueue.push(_FactExecuteTask.resolveTask);
                    this._RejectedTaskQueue.push(_FactExecuteTask.rejectTask);
                    break;
                case "FULFILLED":
                    _FactExecuteTask.resolveTask();
                    break;
                case "REJECTED":
                    _FactExecuteTask.rejectTask();
                    break;
            }
        });
        this.catch = (onRejected) => this.then(null, onRejected);
        this._FulfilledTaskQueue = this._RejectedTaskQueue = [];
        this.status = "PENDING";
        this.value = this.err = null;
        const resolve = (value) => {
            const _resolveGeneralValue = (value) => {
                if (this.status == "PENDING") {
                    this.status = 'FULFILLED';
                    this.value = value;
                    this._FulfilledTaskQueue.forEach((thenFunc) => {
                        thenFunc(value);
                    });
                }
            };
            if (value instanceof MPromise) {
                value.then((val) => {
                    if (val instanceof MPromise)
                        resolve(val);
                    else
                        _resolveGeneralValue(val);
                }, err => reject(err));
            }
            else {
                _resolveGeneralValue(value);
            }
        };
        const reject = (err) => {
            if (this.status == "PENDING") {
                this.status = "REJECTED";
                this.err = err;
                this._RejectedTaskQueue.forEach((thenFunc) => {
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
    static resolve(v) {
        return new MPromise(resolve => resolve(v));
    }
    static reject(e) {
        return new MPromise((_, reject) => reject(e));
    }
    static all(waitExecute) {
        let executeCount = 0;
        let executeResult = [];
        let executeErr = null;
        let _continue = null;
        let _reject = null;
        waitExecute.forEach((curPromise, i) => {
            curPromise.then((val) => {
                executeResult[i] = val;
                executeCount += 1;
                if (executeCount == waitExecute.length)
                    _continue(executeResult);
            }).catch((err) => {
                executeErr = err;
                _reject(executeErr);
            });
        });
        return new MPromise((resolve, rejected) => {
            _continue = resolve;
            _reject = rejected;
        });
    }
    static race(waitExecute) {
        waitExecute = waitExecute.map(v => (v instanceof MPromise) ? v : MPromise.resolve(v));
        let _continue = null;
        let _reject = null;
        waitExecute.forEach(curPromise => {
            curPromise.then(val => {
                _continue(val);
            }).catch(err => {
                _reject(err);
            });
        });
        return new MPromise((resolve, rejected) => {
            _continue = resolve;
            _reject = rejected;
        });
    }
}
exports.default = MPromise;
