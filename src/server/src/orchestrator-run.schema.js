"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorRunSchema = exports.OrchestratorRun = void 0;
var mongoose_1 = require("@nestjs/mongoose");
var OrchestratorRun = function () {
    var _classDecorators = [(0, mongoose_1.Schema)({ collection: 'orchestrator_runs', timestamps: true })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _repository_decorators;
    var _repository_initializers = [];
    var _repository_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _orchestrator_summary_decorators;
    var _orchestrator_summary_initializers = [];
    var _orchestrator_summary_extraInitializers = [];
    var _spell_agent_details_decorators;
    var _spell_agent_details_initializers = [];
    var _spell_agent_details_extraInitializers = [];
    var _metadata_decorators;
    var _metadata_initializers = [];
    var _metadata_extraInitializers = [];
    var OrchestratorRun = _classThis = /** @class */ (function () {
        function OrchestratorRun_1() {
            this.repository = __runInitializers(this, _repository_initializers, void 0);
            this.status = (__runInitializers(this, _repository_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.orchestrator_summary = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _orchestrator_summary_initializers, void 0));
            this.spell_agent_details = (__runInitializers(this, _orchestrator_summary_extraInitializers), __runInitializers(this, _spell_agent_details_initializers, void 0));
            this.metadata = (__runInitializers(this, _spell_agent_details_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            __runInitializers(this, _metadata_extraInitializers);
        }
        return OrchestratorRun_1;
    }());
    __setFunctionName(_classThis, "OrchestratorRun");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _repository_decorators = [(0, mongoose_1.Prop)()];
        _status_decorators = [(0, mongoose_1.Prop)()];
        _orchestrator_summary_decorators = [(0, mongoose_1.Prop)({ type: Object })];
        _spell_agent_details_decorators = [(0, mongoose_1.Prop)({ type: Object })];
        _metadata_decorators = [(0, mongoose_1.Prop)({ type: Object })];
        __esDecorate(null, null, _repository_decorators, { kind: "field", name: "repository", static: false, private: false, access: { has: function (obj) { return "repository" in obj; }, get: function (obj) { return obj.repository; }, set: function (obj, value) { obj.repository = value; } }, metadata: _metadata }, _repository_initializers, _repository_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _orchestrator_summary_decorators, { kind: "field", name: "orchestrator_summary", static: false, private: false, access: { has: function (obj) { return "orchestrator_summary" in obj; }, get: function (obj) { return obj.orchestrator_summary; }, set: function (obj, value) { obj.orchestrator_summary = value; } }, metadata: _metadata }, _orchestrator_summary_initializers, _orchestrator_summary_extraInitializers);
        __esDecorate(null, null, _spell_agent_details_decorators, { kind: "field", name: "spell_agent_details", static: false, private: false, access: { has: function (obj) { return "spell_agent_details" in obj; }, get: function (obj) { return obj.spell_agent_details; }, set: function (obj, value) { obj.spell_agent_details = value; } }, metadata: _metadata }, _spell_agent_details_initializers, _spell_agent_details_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: function (obj) { return "metadata" in obj; }, get: function (obj) { return obj.metadata; }, set: function (obj, value) { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrchestratorRun = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrchestratorRun = _classThis;
}();
exports.OrchestratorRun = OrchestratorRun;
exports.OrchestratorRunSchema = mongoose_1.SchemaFactory.createForClass(OrchestratorRun);
