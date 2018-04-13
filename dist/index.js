function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var loaderUtils = _interopDefault(require('loader-utils'));
var NodeTargetPlugin = _interopDefault(require('webpack/lib/node/NodeTargetPlugin'));
var SingleEntryPlugin = _interopDefault(require('webpack/lib/SingleEntryPlugin'));
var WebWorkerTemplatePlugin = _interopDefault(require('webpack/lib/webworker/WebWorkerTemplatePlugin'));

function loader() {}

var CACHE = {};
loader.pitch = function (request) {
    var this$1 = this;

    this.cacheable(false);
    var options = loaderUtils.getOptions(this) || {};
    var cb = this.async();
    var filename = loaderUtils.interpolateName(this, ((options.name || '[hash]') + ".worker.js"), {
        context: options.context || this.rootContext || this.options.context,
        regExp: options.regExp
    });
    var worker = {};
    worker.options = {
        filename: filename,
        chunkFilename: ("[id]." + filename),
        namedChunkFilename: null
    };
    worker.compiler = this._compilation.createChildCompiler('worker', worker.options);
    worker.compiler.apply(new WebWorkerTemplatePlugin(worker.options));
    if (this.target !== 'webworker' && this.target !== 'web') {
        worker.compiler.apply(new NodeTargetPlugin());
    }
    worker.compiler.apply(new SingleEntryPlugin(this.context, ("!!" + (path.resolve(__dirname, 'rpc-worker-loader.js')) + "!" + request), 'main'));
    var subCache = "subcache " + __dirname + " " + request;
    worker.compiler.plugin('compilation', function (compilation, data) {
        if (compilation.cache) {
            if (!compilation.cache[subCache]) 
                { compilation.cache[subCache] = {}; }
            compilation.cache = compilation.cache[subCache];
        }
        data.normalModuleFactory.plugin('parser', function (parser, options) {
            parser.plugin('export declaration', function (expr) {
                var decl = expr.declaration || expr;
                var ref = parser.state;
                var compilation = ref.compilation;
                var current = ref.current;
                var entry = compilation.entries[0].resource;
                if (current.resource !== entry) 
                    { return; }
                var exports = compilation.__workerizeExports || (compilation.__workerizeExports = {});
                if (decl.id) {
                    exports[decl.id.name] = true;
                } else if (decl.declarations) {
                    for (var i = 0;i < decl.declarations.length; i++) {
                        exports[decl.declarations[i].id.name] = true;
                    }
                } else {
                    console.warn('[workerize] unknown export declaration: ', expr);
                }
            });
        });
    });
    worker.compiler.runAsChild(function (err, entries, compilation) {
        if (err) 
            { return cb(err); }
        if (entries[0]) {
            worker.file = entries[0].files[0];
            var contents = compilation.assets[worker.file].source();
            var exports = Object.keys(CACHE[worker.file] = compilation.__workerizeExports || CACHE[worker.file] || {});
            if (options.inline) {
                worker.url = "URL.createObjectURL(new Blob([" + (JSON.stringify(contents)) + "]))";
            } else {
                worker.url = "__webpack_public_path__ + " + (JSON.stringify(worker.file));
            }
            if (options.fallback === false) {
                delete this$1._compilation.assets[worker.file];
            }
            return cb(null, ("\n\t\t\t\tvar addMethods = require(" + (loaderUtils.stringifyRequest(this$1, path.resolve(__dirname, 'rpc-wrapper.js'))) + ")\n\t\t\t\tvar methods = " + (JSON.stringify(exports)) + "\n\t\t\t\tmodule.exports = function() {\n\t\t\t\t\tvar w = new Worker(" + (worker.url) + ", { name: " + (JSON.stringify(filename)) + " })\n\t\t\t\t\taddMethods(w, methods)\n\t\t\t\t\t" + (options.ready ? 'w.ready = new Promise(function(r) { w.addEventListener("ready", function(){ r(w) }) })' : '') + "\n\t\t\t\t\treturn w\n\t\t\t\t}\n\t\t\t"));
        }
        return cb(null, null);
    });
};

module.exports = loader;
//# sourceMappingURL=index.js.map
