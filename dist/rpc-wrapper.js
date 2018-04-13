function addMethods(worker, methods) {
    var c = 0;
    var callbacks = {};
    worker.addEventListener('message', function (e) {
        var d = e.data;
        if (d.type !== 'RPC') 
            { return; }
        if (d.id) {
            var f = callbacks[d.id];
            if (f) {
                delete callbacks[d.id];
                if (d.error) {
                    var workerError = Error(d.error && d.error.message ? d.error.message : 'Error in worker');
                    if (d.error && d.error.stack) 
                        { workerError.stack = d.error.stack; }
                    if (d.error && d.error.name) 
                        { workerError.name = d.error.name; }
                    f[1](workerError);
                } else 
                    { f[0](d.result); }
            }
        } else {
            var evt = document.createEvent('Event');
            evt.initEvent(d.method, false, false);
            evt.data = d.params;
            worker.dispatchEvent(evt);
        }
    });
    methods.forEach(function (method) {
        worker[method] = (function () {
            var params = [], len = arguments.length;
            while ( len-- ) params[ len ] = arguments[ len ];

            return new Promise(function (a, b) {
            var id = ++c;
            callbacks[id] = [a,b];
            worker.postMessage({
                type: 'RPC',
                id: id,
                method: method,
                params: params
            });
        });
        });
    });
}

module.exports = addMethods;
//# sourceMappingURL=rpc-wrapper.js.map
