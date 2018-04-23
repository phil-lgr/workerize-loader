function workerSetup() {
    addEventListener('message', function (e) {
        var ref = e.data;
        var type = ref.type;
        var method = ref.method;
        var id = ref.id;
        var params = ref.params;
        var f, p;
        if (type === 'RPC' && method) {
            if (f = __webpack_exports__[method]) {
                p = Promise.resolve().then(function () { return f.apply(__webpack_exports__, params); });
            } else {
                p = Promise.reject('No such method');
            }
            p.then(function (result) {
                postMessage({
                    type: 'RPC',
                    id: id,
                    result: result
                });
            }).catch(function (error) {
                if (error.stack) {
                    postMessage({
                        type: 'RPC',
                        id: id,
                        error: {
                            name: error.name,
                            message: error.message,
                            stack: error.stack
                        }
                    });
                    return;
                }
                postMessage({
                    type: 'RPC',
                    id: id,
                    error: error
                });
            });
        }
    });
    postMessage({
        type: 'RPC',
        method: 'ready'
    });
}

var workerScript = '\n' + Function.prototype.toString.call(workerSetup).replace(/(^.*\{|\}.*$|\n\s*)/g, '');
function rpcWorkerLoader(content) {
    return content + workerScript;
}

module.exports = rpcWorkerLoader;
//# sourceMappingURL=rpc-worker-loader.js.map
