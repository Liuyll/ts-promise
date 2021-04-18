type resolve = (value?:unknown) => void 
type reject = (err?:unknown) => void

type thenFulfillExecutor = (data:any) => any | any
type thenRejectExecutor = (err:any) => any | any

type promiseExecutor = (onFulfilled:resolve,onRejected:reject) => any | null

interface IMPromiseConstructor {
    new (executor:promiseExecutor):MPromise;
    resolve(value?:any):MPromise;
    reject(err?:any):MPromise;
    race:Array<IMPromise>;
    all:Array<IMPromise>;
}

interface IMPromise {
    status:"PENDING" | "FULFILLED" | "REJECTED";
    value:any;
    err:any;
    _FulfilledTaskQueue:Array<Function>;
    _RejectedTaskQueue:Array<Function>;
    then:(onFulfilled:thenFulfillExecutor,onRejected:thenRejectExecutor) => MPromise;
    catch:(onRejected:thenRejectExecutor) => MPromise;
}

class MPromise implements IMPromise {
    status:"PENDING" | "FULFILLED" | "REJECTED"
    _FulfilledTaskQueue:Array<Function>
    _RejectedTaskQueue:Array<Function>
    value:any
    err:any

    constructor(executor:promiseExecutor){
        this._RejectedTaskQueue = []
        this._FulfilledTaskQueue = []
        this.status = "PENDING"
        this.value = this.err = null
        
        const resolve:resolve = (value:any) => {
            const _resolveGeneralValue = (value:any) => {
                if(this.status == "PENDING"){
                    this.status = 'FULFILLED'
                    this.value = value
                    this._FulfilledTaskQueue.forEach((thenFunc) => {
                        thenFunc(value)
                    })
                }
            }   

            if(value instanceof MPromise) {
                this.promiseResolveThenableJob(value).then((val) => {
                    if(val instanceof MPromise) resolve(val)
                    else _resolveGeneralValue(val)
                },err => reject(err))
            } else {
                _resolveGeneralValue(value)
            }
        }

        // chain error to catch
        const reject:reject = (err:any) => {
            if(this.status == "PENDING") {
                this.status = "REJECTED"
                this.err = err
                if(!this._RejectedTaskQueue.length) {
                    throw new Error('MPromise throw uncaught error.')
                }
                this._RejectedTaskQueue.forEach((thenFunc) => {
                    thenFunc(err)
                })
            }
        }

        try {
            executor(resolve,reject)
        } catch(err) {
            this.err = err
            reject(err)
        }
    }

    then = (onFulfilled:thenFulfillExecutor | any,onRejected ?:thenRejectExecutor):MPromise => 
        new MPromise((resolve:resolve,reject:reject) => {
            let shouldThrowChainError = false
            if(!onRejected) {
                onRejected = (err?:any) => err
                shouldThrowChainError = true
            }

            const registerResolveTask = () => {
                if(typeof onFulfilled != "function") resolve(this.value)
                try {
                    const res = onFulfilled(this.value)
                    if(res instanceof MPromise) res.then(resolve,reject)
                    else resolve(res)
                } catch(err) {
                    reject(err)
                }
            }

            const registerRejectTask = (err?:any) => {
                if(typeof onRejected != "function") reject(onRejected)
                let res: any
                try {
                    res = onRejected(err)       
                } catch(err) {
                    res = err
                }

                const handle: reject | resolve = shouldThrowChainError ? reject : resolve
                if(res instanceof MPromise) {
                    handle(res.then(resolve,reject))
                }
                else handle(res)
            }

            const _FactExecuteTask = {
                resolveTask : () => queueMicrotask(registerResolveTask),
                rejectTask : (err?:any) => queueMicrotask(() => registerRejectTask(err)),
            }

            switch(this.status) {
                case "PENDING" :
                    this._FulfilledTaskQueue.push(_FactExecuteTask.resolveTask)
                    this._RejectedTaskQueue.push(_FactExecuteTask.rejectTask)
                    break
                case "FULFILLED":
                    _FactExecuteTask.resolveTask()
                    break
                case "REJECTED":
                    _FactExecuteTask.rejectTask()
                    break
            }
        })

        catch = (onRejected:thenRejectExecutor):MPromise => 
            this.then(null,onRejected)

        static resolve(v ?: any):MPromise{
            return new MPromise(resolve => resolve(v))
        }

        static reject(e ?: any):MPromise{
            return new MPromise((_,reject) => reject(e))
        }

        static all(waitExecute:MPromise[]) {
            let executeCount = 0
            let executeResult:unknown = []
            let executeErr:Error = null
            let _continue : resolve = null
            let _reject : reject = null

            waitExecute.forEach((curPromise,i) => {
                curPromise.then((val) => {
                    executeResult[i] = val
                    executeCount += 1
                    if(executeCount == waitExecute.length) _continue(executeResult) 
                }).catch((err:Error) => {
                    executeErr = err
                    _reject(executeErr)
                })
            })


            return new MPromise((resolve,rejected) => {
                _continue = resolve
                _reject = rejected
            })
        }

        static race(waitExecute:MPromise[]) {
            waitExecute = waitExecute.map(v => (v instanceof MPromise) ? v : MPromise.resolve(v))
            let _continue : resolve = null
            let _reject : reject = null

            waitExecute.forEach(curPromise => {
                curPromise.then(val => {
                    _continue(val)
                }).catch(err => {
                    _reject(err)
                })
            })

            return new MPromise((resolve,rejected) => {
                _continue = resolve
                _reject = rejected
            })
        }

        private promiseResolveThenableJob = (instance) => {
            return new MPromise(r => {
                instance.then(ret => r(ret))
            })
        }
}

export default MPromise