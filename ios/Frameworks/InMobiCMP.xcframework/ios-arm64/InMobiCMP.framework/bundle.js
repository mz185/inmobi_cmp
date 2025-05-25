(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.iabgpp = {}));
})(this, (function (exports) { 'use strict';

    class EventData {
        constructor(eventName, listenerId, data, pingData) {
            this.eventName = eventName;
            this.listenerId = listenerId;
            this.data = data;
            this.pingData = pingData;
        }
    }

    class PingData {
        constructor(cmpApiContext) {
            this.gppVersion = cmpApiContext.gppVersion;
            this.cmpStatus = cmpApiContext.cmpStatus;
            this.cmpDisplayStatus = cmpApiContext.cmpDisplayStatus;
            this.signalStatus = cmpApiContext.signalStatus;
            this.supportedAPIs = cmpApiContext.supportedAPIs;
            this.cmpId = cmpApiContext.cmpId;
            this.sectionList = cmpApiContext.gppModel.getSectionIds();
            this.applicableSections = cmpApiContext.applicableSections;
            this.gppString = cmpApiContext.gppModel.encode();
            this.parsedSections = cmpApiContext.gppModel.toObject();
        }
    }

    class Command {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(cmpApiContext, callback, parameter) {
            this.success = true;
            this.cmpApiContext = cmpApiContext;
            Object.assign(this, {
                callback,
                parameter,
            });
        }
        execute() {
            try {
                return this.respond();
            }
            catch (error) {
                this.invokeCallback(null);
                return null;
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        invokeCallback(response) {
            const success = response !== null;
            if (this.callback) {
                this.callback(response, success);
            }
        }
    }

    class AddEventListenerCommand extends Command {
        respond() {
            let listenerId = this.cmpApiContext.eventQueue.add({
                callback: this.callback,
                parameter: this.parameter,
            });
            let eventData = new EventData("listenerRegistered", listenerId, true, new PingData(this.cmpApiContext));
            this.invokeCallback(eventData);
        }
    }

    class PingCommand extends Command {
        respond() {
            let pingReturn = new PingData(this.cmpApiContext);
            this.invokeCallback(pingReturn);
        }
    }

    class GetFieldCommand extends Command {
        respond() {
            if (!this.parameter || this.parameter.length === 0) {
                throw new Error("<section>.<field> parameter required");
            }
            let parts = this.parameter.split(".");
            if (parts.length != 2) {
                throw new Error("Field name must be in the format <section>.<fieldName>");
            }
            let sectionName = parts[0];
            let fieldName = parts[1];
            let fieldValue = this.cmpApiContext.gppModel.getFieldValue(sectionName, fieldName);
            this.invokeCallback(fieldValue);
        }
    }

    class GetSectionCommand extends Command {
        respond() {
            if (!this.parameter || this.parameter.length === 0) {
                throw new Error("<section> parameter required");
            }
            let section = null;
            if (this.cmpApiContext.gppModel.hasSection(this.parameter)) {
                section = this.cmpApiContext.gppModel.getSection(this.parameter);
            }
            this.invokeCallback(section);
        }
    }

    class HasSectionCommand extends Command {
        respond() {
            if (!this.parameter || this.parameter.length === 0) {
                throw new Error("<section>[.version] parameter required");
            }
            let hasSection = this.cmpApiContext.gppModel.hasSection(this.parameter);
            this.invokeCallback(hasSection);
        }
    }

    exports.GppCommand = void 0;
    (function (GppCommand) {
        GppCommand["ADD_EVENT_LISTENER"] = "addEventListener";
        GppCommand["GET_FIELD"] = "getField";
        GppCommand["GET_SECTION"] = "getSection";
        GppCommand["HAS_SECTION"] = "hasSection";
        GppCommand["PING"] = "ping";
        GppCommand["REMOVE_EVENT_LISTENER"] = "removeEventListener";
    })(exports.GppCommand || (exports.GppCommand = {}));

    class RemoveEventListenerCommand extends Command {
        respond() {
            let listenerId = this.parameter;
            let removed = this.cmpApiContext.eventQueue.remove(listenerId);
            let eventData = new EventData("listenerRemoved", listenerId, removed, new PingData(this.cmpApiContext));
            this.invokeCallback(eventData);
        }
    }

    var _a, _b, _c, _d, _e, _f;
    class CommandMap {
    }
    _a = exports.GppCommand.ADD_EVENT_LISTENER, _b = exports.GppCommand.GET_FIELD, _c = exports.GppCommand.GET_SECTION, _d = exports.GppCommand.HAS_SECTION, _e = exports.GppCommand.PING, _f = exports.GppCommand.REMOVE_EVENT_LISTENER;
    CommandMap[_a] = AddEventListenerCommand;
    CommandMap[_b] = GetFieldCommand;
    CommandMap[_c] = GetSectionCommand;
    CommandMap[_d] = HasSectionCommand;
    CommandMap[_e] = PingCommand;
    CommandMap[_f] = RemoveEventListenerCommand;

    exports.CmpStatus = void 0;
    (function (CmpStatus) {
        CmpStatus["STUB"] = "stub";
        CmpStatus["LOADING"] = "loading";
        CmpStatus["LOADED"] = "loaded";
        CmpStatus["ERROR"] = "error";
    })(exports.CmpStatus || (exports.CmpStatus = {}));

    exports.CmpDisplayStatus = void 0;
    (function (CmpDisplayStatus) {
        CmpDisplayStatus["VISIBLE"] = "visible";
        CmpDisplayStatus["HIDDEN"] = "hidden";
        CmpDisplayStatus["DISABLED"] = "disabled";
    })(exports.CmpDisplayStatus || (exports.CmpDisplayStatus = {}));

    exports.EventStatus = void 0;
    (function (EventStatus) {
        EventStatus["GPP_LOADED"] = "gpploaded";
        EventStatus["CMP_UI_SHOWN"] = "cmpuishown";
        EventStatus["USER_ACTION_COMPLETE"] = "useractioncomplete";
    })(exports.EventStatus || (exports.EventStatus = {}));

    exports.SignalStatus = void 0;
    (function (SignalStatus) {
        SignalStatus["NOT_READY"] = "not ready";
        SignalStatus["READY"] = "ready";
    })(exports.SignalStatus || (exports.SignalStatus = {}));

    class CallResponder {
        constructor(cmpApiContext, customCommands) {
            this.cmpApiContext = cmpApiContext;
            if (customCommands) {
                /**
                 * The addEventListener command and removeEventListener are the only ones
                 * that shouldn't be overwritten. The addEventListener command utilizes
                 * getTCData command, so overridding the TCData response should happen
                 * there.
                 */
                let command = exports.GppCommand.ADD_EVENT_LISTENER;
                if (customCommands === null || customCommands === void 0 ? void 0 : customCommands[command]) {
                    throw new Error(`Built-In Custom Commmand for ${command} not allowed`);
                }
                command = exports.GppCommand.REMOVE_EVENT_LISTENER;
                if (customCommands === null || customCommands === void 0 ? void 0 : customCommands[command]) {
                    throw new Error(`Built-In Custom Commmand for ${command} not allowed`);
                }
                this.customCommands = customCommands;
            }
            try {
                // get queued commands
                this.callQueue = window["__gpp"]() || [];
            }
            catch (err) {
                this.callQueue = [];
            }
            finally {
                window["__gpp"] = this.apiCall.bind(this);
                this.purgeQueuedCalls();
            }
        }
        /**
         * Handler for all page call commands
         * @param {string} command
         * @param {CommandCallback} callback
         * @param {any} param
         * @param {number} version
         */
        apiCall(command, callback, parameter, version) {
            if (typeof command !== "string") {
                callback(null, false);
            }
            else if (callback && typeof callback !== "function") {
                throw new Error("invalid callback function");
            }
            else if (this.isCustomCommand(command)) {
                this.customCommands[command](callback, parameter);
            }
            else if (this.isBuiltInCommand(command)) {
                new CommandMap[command](this.cmpApiContext, callback, parameter).execute();
            }
            else {
                if (callback) {
                    callback(null, false);
                }
            }
        }
        purgeQueuedCalls() {
            const queueCopy = this.callQueue;
            this.callQueue = [];
            queueCopy.forEach((args) => {
                window["__gpp"](...args);
            });
        }
        isCustomCommand(command) {
            return this.customCommands && typeof this.customCommands[command] === "function";
        }
        isBuiltInCommand(command) {
            return CommandMap[command] !== undefined;
        }
    }

    class EventListenerQueue {
        constructor(cmpApiContext) {
            this.eventQueue = new Map();
            this.queueNumber = 1000;
            this.cmpApiContext = cmpApiContext;
            try {
                // get queued commands
                let events = window["__gpp"]("events") || [];
                for (var i = 0; i < events.length; i++) {
                    let eventItem = events[i];
                    this.eventQueue.set(eventItem.id, {
                        callback: eventItem.callback,
                        parameter: eventItem.parameter,
                    });
                }
            }
            catch (err) {
                console.log(err);
            }
        }
        add(eventItem) {
            this.eventQueue.set(this.queueNumber, eventItem);
            return this.queueNumber++;
        }
        get(listenerId) {
            return this.eventQueue.get(listenerId);
        }
        remove(listenerId) {
            return this.eventQueue.delete(listenerId);
        }
        exec(eventName, data) {
            this.eventQueue.forEach((eventItem, listenerId) => {
                let eventData = new EventData(eventName, listenerId, data, new PingData(this.cmpApiContext));
                let success = true;
                eventItem.callback(eventData, success);
            });
        }
        clear() {
            this.queueNumber = 1000;
            this.eventQueue.clear();
        }
        get size() {
            return this.eventQueue.size;
        }
    }

    /**
     * class for decoding errors
     *
     * @extends {Error}
     */
    class InvalidFieldError extends Error {
        /**
         * constructor - constructs an DecodingError
         *
         * @param {string} msg - Decoding Error Message
         * @return {undefined}
         */
        constructor(msg) {
            super(msg);
            this.name = "InvalidFieldError";
        }
    }

    class AbstractLazilyEncodableSection {
        constructor() {
            this.encodedString = null;
            this.dirty = false;
            this.decoded = true;
            this.segments = this.initializeSegments();
        }
        hasField(fieldName) {
            if (!this.decoded) {
                this.segments = this.decodeSection(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            for (let i = 0; i < this.segments.length; i++) {
                let segment = this.segments[i];
                if (segment.getFieldNames().includes(fieldName)) {
                    return segment.hasField(fieldName);
                }
            }
            return false;
        }
        getFieldValue(fieldName) {
            if (!this.decoded) {
                this.segments = this.decodeSection(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            for (let i = 0; i < this.segments.length; i++) {
                let segment = this.segments[i];
                if (segment.hasField(fieldName)) {
                    return segment.getFieldValue(fieldName);
                }
            }
            throw new InvalidFieldError("Invalid field: '" + fieldName + "'");
        }
        setFieldValue(fieldName, value) {
            if (!this.decoded) {
                this.segments = this.decodeSection(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            for (let i = 0; i < this.segments.length; i++) {
                let segment = this.segments[i];
                if (segment.hasField(fieldName)) {
                    segment.setFieldValue(fieldName, value);
                    return;
                }
            }
            throw new InvalidFieldError("Invalid field: '" + fieldName + "'");
        }
        //Overriden
        toObj() {
            let obj = {};
            for (let i = 0; i < this.segments.length; i++) {
                let segmentObject = this.segments[i].toObj();
                for (const [fieldName, value] of Object.entries(segmentObject)) {
                    obj[fieldName] = value;
                }
            }
            return obj;
        }
        encode() {
            if (this.encodedString == null || this.encodedString.length === 0 || this.dirty) {
                this.encodedString = this.encodeSection(this.segments);
                this.dirty = false;
                this.decoded = true;
            }
            return this.encodedString;
        }
        decode(encodedString) {
            this.encodedString = encodedString;
            this.segments = this.decodeSection(this.encodedString);
            this.dirty = false;
            this.decoded = false;
        }
        setIsDirty(status) {
            this.dirty = status;
        }
    }

    /**
     * class for decoding errors
     *
     * @extends {Error}
     */
    class DecodingError extends Error {
        /**
         * constructor - constructs an DecodingError
         *
         * @param {string} msg - Decoding Error Message
         * @return {undefined}
         */
        constructor(msg) {
            super(msg);
            this.name = "DecodingError";
        }
    }

    /**
     * class for encoding errors
     *
     * @extends {Error}
     */
    class EncodingError extends Error {
        /**
         * constructor - constructs an EncodingError
         *
         * @param {string} msg - Encoding Error Message
         * @return {undefined}
         */
        constructor(msg) {
            super(msg);
            this.name = "EncodingError";
        }
    }

    class FixedIntegerEncoder {
        static encode(value, bitStringLength) {
            //let bitString = value.toString(2);
            let bin = [];
            if (value >= 1) {
                bin.push(1);
                while (value >= bin[0] * 2) {
                    bin.unshift(bin[0] * 2);
                }
            }
            let bitString = "";
            for (let i = 0; i < bin.length; i++) {
                let b = bin[i];
                if (value >= b) {
                    bitString += "1";
                    value -= b;
                }
                else {
                    bitString += "0";
                }
            }
            if (bitString.length > bitStringLength) {
                throw new EncodingError("Numeric value '" + value + "' is too large for a bit string length of '" + bitStringLength + "'");
            }
            while (bitString.length < bitStringLength) {
                bitString = "0" + bitString;
            }
            return bitString;
        }
        static decode(bitString) {
            if (!/^[0-1]*$/.test(bitString)) {
                throw new DecodingError("Undecodable FixedInteger '" + bitString + "'");
            }
            //return parseInt(bitString, 2);
            let value = 0;
            let bin = [];
            for (let i = 0; i < bitString.length; i++) {
                if (i === 0) {
                    bin[bitString.length - (i + 1)] = 1;
                }
                else {
                    bin[bitString.length - (i + 1)] = bin[bitString.length - i] * 2;
                }
            }
            for (let i = 0; i < bitString.length; i++) {
                if (bitString.charAt(i) === "1") {
                    value += bin[i];
                }
            }
            return value;
        }
    }

    class AbstractBase64UrlEncoder {
        encode(bitString) {
            // should only be 0 or 1
            if (!/^[0-1]*$/.test(bitString)) {
                throw new EncodingError("Unencodable Base64Url '" + bitString + "'");
            }
            bitString = this.pad(bitString);
            let str = "";
            let index = 0;
            while (index <= bitString.length - 6) {
                let s = bitString.substring(index, index + 6);
                try {
                    let n = FixedIntegerEncoder.decode(s);
                    let c = AbstractBase64UrlEncoder.DICT.charAt(n);
                    str += c;
                    index += 6;
                }
                catch (e) {
                    throw new EncodingError("Unencodable Base64Url '" + bitString + "'");
                }
            }
            return str;
        }
        decode(str) {
            // should contain only characters from the base64url set
            if (!/^[A-Za-z0-9\-_]*$/.test(str)) {
                throw new DecodingError("Undecodable Base64URL string '" + str + "'");
            }
            let bitString = "";
            for (let i = 0; i < str.length; i++) {
                let c = str.charAt(i);
                let n = AbstractBase64UrlEncoder.REVERSE_DICT.get(c);
                let s = FixedIntegerEncoder.encode(n, 6);
                bitString += s;
            }
            return bitString;
        }
    }
    /**
     * Base 64 URL character set.  Different from standard Base64 char set
     * in that '+' and '/' are replaced with '-' and '_'.
     */
    AbstractBase64UrlEncoder.DICT = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    // prettier-ignore
    AbstractBase64UrlEncoder.REVERSE_DICT = new Map([
        ['A', 0], ['B', 1], ['C', 2], ['D', 3], ['E', 4], ['F', 5], ['G', 6], ['H', 7],
        ['I', 8], ['J', 9], ['K', 10], ['L', 11], ['M', 12], ['N', 13], ['O', 14], ['P', 15],
        ['Q', 16], ['R', 17], ['S', 18], ['T', 19], ['U', 20], ['V', 21], ['W', 22], ['X', 23],
        ['Y', 24], ['Z', 25], ['a', 26], ['b', 27], ['c', 28], ['d', 29], ['e', 30], ['f', 31],
        ['g', 32], ['h', 33], ['i', 34], ['j', 35], ['k', 36], ['l', 37], ['m', 38], ['n', 39],
        ['o', 40], ['p', 41], ['q', 42], ['r', 43], ['s', 44], ['t', 45], ['u', 46], ['v', 47],
        ['w', 48], ['x', 49], ['y', 50], ['z', 51], ['0', 52], ['1', 53], ['2', 54], ['3', 55],
        ['4', 56], ['5', 57], ['6', 58], ['7', 59], ['8', 60], ['9', 61], ['-', 62], ['_', 63]
    ]);

    class CompressedBase64UrlEncoder extends AbstractBase64UrlEncoder {
        constructor() {
            super();
        }
        static getInstance() {
            return this.instance;
        }
        // Overriden
        pad(bitString) {
            while (bitString.length % 8 > 0) {
                bitString += "0";
            }
            while (bitString.length % 6 > 0) {
                bitString += "0";
            }
            return bitString;
        }
    }
    CompressedBase64UrlEncoder.instance = new CompressedBase64UrlEncoder();

    class BitStringEncoder {
        constructor() { }
        static getInstance() {
            return this.instance;
        }
        encode(fields, fieldNames) {
            let bitString = "";
            for (let i = 0; i < fieldNames.length; i++) {
                let fieldName = fieldNames[i];
                if (fields.containsKey(fieldName)) {
                    let field = fields.get(fieldName);
                    bitString += field.encode();
                }
                else {
                    throw new Error("Field not found: '" + fieldName + "'");
                }
            }
            return bitString;
        }
        decode(bitString, fieldNames, fields) {
            let index = 0;
            for (let i = 0; i < fieldNames.length; i++) {
                let fieldName = fieldNames[i];
                if (fields.containsKey(fieldName)) {
                    let field = fields.get(fieldName);
                    try {
                        let substring = field.substring(bitString, index);
                        field.decode(substring);
                        index += substring.length;
                    }
                    catch (e) {
                        if (e.name === "SubstringError" && !field.getHardFailIfMissing()) {
                            return;
                        }
                        else {
                            throw new DecodingError("Unable to decode field '" + fieldName + "'");
                        }
                    }
                }
                else {
                    throw new Error("Field not found: '" + fieldName + "'");
                }
            }
        }
    }
    BitStringEncoder.instance = new BitStringEncoder();

    class FibonacciIntegerEncoder {
        static encode(value) {
            let fib = [];
            if (value >= 1) {
                fib.push(1);
                if (value >= 2) {
                    fib.push(2);
                    let i = 2;
                    while (value >= fib[i - 1] + fib[i - 2]) {
                        fib.push(fib[i - 1] + fib[i - 2]);
                        i++;
                    }
                }
            }
            let bitString = "1";
            for (let i = fib.length - 1; i >= 0; i--) {
                let f = fib[i];
                if (value >= f) {
                    bitString = "1" + bitString;
                    value -= f;
                }
                else {
                    bitString = "0" + bitString;
                }
            }
            return bitString;
        }
        static decode(bitString) {
            if (!/^[0-1]*$/.test(bitString) || bitString.length < 2 || bitString.indexOf("11") !== bitString.length - 2) {
                throw new DecodingError("Undecodable FibonacciInteger '" + bitString + "'");
            }
            let value = 0;
            let fib = [];
            for (let i = 0; i < bitString.length - 1; i++) {
                if (i === 0) {
                    fib.push(1);
                }
                else if (i === 1) {
                    fib.push(2);
                }
                else {
                    fib.push(fib[i - 1] + fib[i - 2]);
                }
            }
            for (let i = 0; i < bitString.length - 1; i++) {
                if (bitString.charAt(i) === "1") {
                    value += fib[i];
                }
            }
            return value;
        }
    }

    class BooleanEncoder {
        static encode(value) {
            if (value === true) {
                return "1";
            }
            else if (value === false) {
                return "0";
            }
            else {
                throw new EncodingError("Unencodable Boolean '" + value + "'");
            }
        }
        static decode(bitString) {
            if (bitString === "1") {
                return true;
            }
            else if (bitString === "0") {
                return false;
            }
            else {
                throw new DecodingError("Undecodable Boolean '" + bitString + "'");
            }
        }
    }

    class FibonacciIntegerRangeEncoder {
        static encode(value) {
            value = value.sort((n1, n2) => n1 - n2);
            let groups = [];
            let offset = 0;
            let groupStartIndex = 0;
            while (groupStartIndex < value.length) {
                let groupEndIndex = groupStartIndex;
                while (groupEndIndex < value.length - 1 && value[groupEndIndex] + 1 === value[groupEndIndex + 1]) {
                    groupEndIndex++;
                }
                groups.push(value.slice(groupStartIndex, groupEndIndex + 1));
                groupStartIndex = groupEndIndex + 1;
            }
            let bitString = FixedIntegerEncoder.encode(groups.length, 12);
            for (let i = 0; i < groups.length; i++) {
                if (groups[i].length == 1) {
                    let v = groups[i][0] - offset;
                    offset = groups[i][0];
                    bitString += "0" + FibonacciIntegerEncoder.encode(v);
                }
                else {
                    let startVal = groups[i][0] - offset;
                    offset = groups[i][0];
                    let endVal = groups[i][groups[i].length - 1] - offset;
                    offset = groups[i][groups[i].length - 1];
                    bitString += "1" + FibonacciIntegerEncoder.encode(startVal) + FibonacciIntegerEncoder.encode(endVal);
                }
            }
            return bitString;
        }
        static decode(bitString) {
            if (!/^[0-1]*$/.test(bitString) || bitString.length < 12) {
                throw new DecodingError("Undecodable FibonacciIntegerRange '" + bitString + "'");
            }
            let value = [];
            let count = FixedIntegerEncoder.decode(bitString.substring(0, 12));
            let offset = 0;
            let startIndex = 12;
            for (let i = 0; i < count; i++) {
                let group = BooleanEncoder.decode(bitString.substring(startIndex, startIndex + 1));
                startIndex++;
                if (group === true) {
                    let index = bitString.indexOf("11", startIndex);
                    let start = FibonacciIntegerEncoder.decode(bitString.substring(startIndex, index + 2)) + offset;
                    offset = start;
                    startIndex = index + 2;
                    index = bitString.indexOf("11", startIndex);
                    let end = FibonacciIntegerEncoder.decode(bitString.substring(startIndex, index + 2)) + offset;
                    offset = end;
                    startIndex = index + 2;
                    for (let j = start; j <= end; j++) {
                        value.push(j);
                    }
                }
                else {
                    let index = bitString.indexOf("11", startIndex);
                    let val = FibonacciIntegerEncoder.decode(bitString.substring(startIndex, index + 2)) + offset;
                    offset = val;
                    value.push(val);
                    startIndex = index + 2;
                }
            }
            return value;
        }
    }

    /**
     * class for decoding errors
     *
     * @extends {Error}
     */
    class ValidationError extends Error {
        /**
         * constructor - constructs an DecodingError
         *
         * @param {string} msg - Decoding Error Message
         * @return {undefined}
         */
        constructor(msg) {
            super(msg);
            this.name = "ValidationError";
        }
    }

    class AbstractEncodableBitStringDataType {
        constructor(hardFailIfMising = true) {
            this.hardFailIfMissing = hardFailIfMising;
        }
        withValidator(validator) {
            this.validator = validator;
            return this;
        }
        hasValue() {
            return this.value !== undefined && this.value !== null;
        }
        getValue() {
            return this.value;
        }
        setValue(value) {
            if (!this.validator || this.validator.test(value)) {
                this.value = value;
            }
            else {
                throw new ValidationError("Invalid value '" + value + "'");
            }
        }
        getHardFailIfMissing() {
            return this.hardFailIfMissing;
        }
    }

    /**
     * class for decoding errors
     *
     * @extends {DecodingError}
     */
    class SubstringError extends DecodingError {
        /**
         * constructor - constructs an DecodingError
         *
         * @param {string} msg - Decoding Error Message
         * @return {undefined}
         */
        constructor(msg) {
            super(msg);
            this.name = "SubstringError";
        }
    }

    class StringUtil {
        /**
         * Throws a SubstringError if the indexes aren't within the length of the string
         */
        static substring(s, start, end) {
            if (end > s.length || start < 0 || start > end) {
                throw new SubstringError("Invalid substring indexes " + start + ":" + end + " for string of length " + s.length);
            }
            return s.substring(start, end);
        }
    }

    class EncodableFibonacciIntegerRange extends AbstractEncodableBitStringDataType {
        constructor(value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.setValue(value);
        }
        encode() {
            try {
                return FibonacciIntegerRangeEncoder.encode(this.value);
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                this.value = FibonacciIntegerRangeEncoder.decode(bitString);
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                //TODO: add some validation
                let count = FixedIntegerEncoder.decode(StringUtil.substring(bitString, fromIndex, fromIndex + 12));
                let index = fromIndex + 12;
                for (let i = 0; i < count; i++) {
                    if (bitString.charAt(index) === "1") {
                        index = bitString.indexOf("11", bitString.indexOf("11", index + 1) + 2) + 2;
                    }
                    else {
                        index = bitString.indexOf("11", index + 1) + 2;
                    }
                }
                return StringUtil.substring(bitString, fromIndex, index);
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
        // Overriden
        getValue() {
            return [...super.getValue()];
        }
        // Overriden
        setValue(value) {
            super.setValue(Array.from(new Set(value)).sort((n1, n2) => n1 - n2));
        }
    }

    class EncodableFixedInteger extends AbstractEncodableBitStringDataType {
        constructor(bitStringLength, value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.bitStringLength = bitStringLength;
            this.setValue(value);
        }
        encode() {
            try {
                return FixedIntegerEncoder.encode(this.value, this.bitStringLength);
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                this.value = FixedIntegerEncoder.decode(bitString);
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                return StringUtil.substring(bitString, fromIndex, fromIndex + this.bitStringLength);
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
    }

    class EncodableBitStringFields {
        constructor() {
            this.fields = new Map();
        }
        containsKey(key) {
            return this.fields.has(key);
        }
        put(key, value) {
            this.fields.set(key, value);
        }
        get(key) {
            return this.fields.get(key);
        }
        getAll() {
            return new Map(this.fields);
        }
        reset(fields) {
            this.fields.clear();
            fields.getAll().forEach((value, key) => {
                this.fields.set(key, value);
            });
        }
    }

    exports.HeaderV1Field = void 0;
    (function (HeaderV1Field) {
        HeaderV1Field["ID"] = "Id";
        HeaderV1Field["VERSION"] = "Version";
        HeaderV1Field["SECTION_IDS"] = "SectionIds";
    })(exports.HeaderV1Field || (exports.HeaderV1Field = {}));
    const HEADER_CORE_SEGMENT_FIELD_NAMES = [exports.HeaderV1Field.ID, exports.HeaderV1Field.VERSION, exports.HeaderV1Field.SECTION_IDS];

    class AbstractLazilyEncodableSegment {
        constructor() {
            this.encodedString = null;
            this.dirty = false;
            this.decoded = true;
            this.fields = this.initializeFields();
        }
        //Overriden
        validate() { }
        hasField(fieldName) {
            return this.fields.containsKey(fieldName);
        }
        getFieldValue(fieldName) {
            if (!this.decoded) {
                this.decodeSegment(this.encodedString, this.fields);
                this.dirty = false;
                this.decoded = true;
            }
            if (this.fields.containsKey(fieldName)) {
                return this.fields.get(fieldName).getValue();
            }
            else {
                throw new InvalidFieldError("Invalid field: '" + fieldName + "'");
            }
        }
        setFieldValue(fieldName, value) {
            if (!this.decoded) {
                this.decodeSegment(this.encodedString, this.fields);
                this.dirty = false;
                this.decoded = true;
            }
            if (this.fields.containsKey(fieldName)) {
                this.fields.get(fieldName).setValue(value);
                this.dirty = true;
            }
            else {
                throw new InvalidFieldError(fieldName + " not found");
            }
        }
        //Overriden
        toObj() {
            let obj = {};
            let fieldNames = this.getFieldNames();
            for (let i = 0; i < fieldNames.length; i++) {
                let fieldName = fieldNames[i];
                let value = this.getFieldValue(fieldName);
                obj[fieldName] = value;
            }
            return obj;
        }
        encode() {
            if (this.encodedString == null || this.encodedString.length === 0 || this.dirty) {
                this.validate();
                this.encodedString = this.encodeSegment(this.fields);
                this.dirty = false;
                this.decoded = true;
            }
            return this.encodedString;
        }
        decode(encodedString) {
            this.encodedString = encodedString;
            this.dirty = false;
            this.decoded = false;
        }
    }

    class HeaderV1CoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return HEADER_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.HeaderV1Field.ID.toString(), new EncodableFixedInteger(6, HeaderV1.ID));
            fields.put(exports.HeaderV1Field.VERSION.toString(), new EncodableFixedInteger(6, HeaderV1.VERSION));
            fields.put(exports.HeaderV1Field.SECTION_IDS.toString(), new EncodableFibonacciIntegerRange([]));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode HeaderV1CoreSegment '" + encodedString + "'");
            }
        }
    }

    class HeaderV1 extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return HeaderV1.ID;
        }
        //Overriden
        getName() {
            return HeaderV1.NAME;
        }
        //Override
        getVersion() {
            return HeaderV1.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new HeaderV1CoreSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                for (let i = 0; i < segments.length; i++) {
                    if (encodedSegments.length > i) {
                        segments[i].decode(encodedSegments[i]);
                    }
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            for (let i = 0; i < segments.length; i++) {
                let segment = segments[i];
                encodedSegments.push(segment.encode());
            }
            return encodedSegments.join(".");
        }
    }
    HeaderV1.ID = 3;
    HeaderV1.VERSION = 1;
    HeaderV1.NAME = "header";

    exports.TcfEuV2Field = void 0;
    (function (TcfEuV2Field) {
        TcfEuV2Field["VERSION"] = "Version";
        TcfEuV2Field["CREATED"] = "Created";
        TcfEuV2Field["LAST_UPDATED"] = "LastUpdated";
        TcfEuV2Field["CMP_ID"] = "CmpId";
        TcfEuV2Field["CMP_VERSION"] = "CmpVersion";
        TcfEuV2Field["CONSENT_SCREEN"] = "ConsentScreen";
        TcfEuV2Field["CONSENT_LANGUAGE"] = "ConsentLanguage";
        TcfEuV2Field["VENDOR_LIST_VERSION"] = "VendorListVersion";
        TcfEuV2Field["POLICY_VERSION"] = "PolicyVersion";
        TcfEuV2Field["IS_SERVICE_SPECIFIC"] = "IsServiceSpecific";
        TcfEuV2Field["USE_NON_STANDARD_STACKS"] = "UseNonStandardStacks";
        TcfEuV2Field["SPECIAL_FEATURE_OPTINS"] = "SpecialFeatureOptins";
        TcfEuV2Field["PURPOSE_CONSENTS"] = "PurposeConsents";
        TcfEuV2Field["PURPOSE_LEGITIMATE_INTERESTS"] = "PurposeLegitimateInterests";
        TcfEuV2Field["PURPOSE_ONE_TREATMENT"] = "PurposeOneTreatment";
        TcfEuV2Field["PUBLISHER_COUNTRY_CODE"] = "PublisherCountryCode";
        TcfEuV2Field["VENDOR_CONSENTS"] = "VendorConsents";
        TcfEuV2Field["VENDOR_LEGITIMATE_INTERESTS"] = "VendorLegitimateInterests";
        TcfEuV2Field["PUBLISHER_RESTRICTIONS"] = "PublisherRestrictions";
        TcfEuV2Field["PUBLISHER_PURPOSES_SEGMENT_TYPE"] = "PublisherPurposesSegmentType";
        TcfEuV2Field["PUBLISHER_CONSENTS"] = "PublisherConsents";
        TcfEuV2Field["PUBLISHER_LEGITIMATE_INTERESTS"] = "PublisherLegitimateInterests";
        TcfEuV2Field["NUM_CUSTOM_PURPOSES"] = "NumCustomPurposes";
        TcfEuV2Field["PUBLISHER_CUSTOM_CONSENTS"] = "PublisherCustomConsents";
        TcfEuV2Field["PUBLISHER_CUSTOM_LEGITIMATE_INTERESTS"] = "PublisherCustomLegitimateInterests";
        TcfEuV2Field["VENDORS_ALLOWED_SEGMENT_TYPE"] = "VendorsAllowedSegmentType";
        TcfEuV2Field["VENDORS_ALLOWED"] = "VendorsAllowed";
        TcfEuV2Field["VENDORS_DISCLOSED_SEGMENT_TYPE"] = "VendorsDisclosedSegmentType";
        TcfEuV2Field["VENDORS_DISCLOSED"] = "VendorsDisclosed";
    })(exports.TcfEuV2Field || (exports.TcfEuV2Field = {}));
    const TCFEUV2_CORE_SEGMENT_FIELD_NAMES = [
        exports.TcfEuV2Field.VERSION,
        exports.TcfEuV2Field.CREATED,
        exports.TcfEuV2Field.LAST_UPDATED,
        exports.TcfEuV2Field.CMP_ID,
        exports.TcfEuV2Field.CMP_VERSION,
        exports.TcfEuV2Field.CONSENT_SCREEN,
        exports.TcfEuV2Field.CONSENT_LANGUAGE,
        exports.TcfEuV2Field.VENDOR_LIST_VERSION,
        exports.TcfEuV2Field.POLICY_VERSION,
        exports.TcfEuV2Field.IS_SERVICE_SPECIFIC,
        exports.TcfEuV2Field.USE_NON_STANDARD_STACKS,
        exports.TcfEuV2Field.SPECIAL_FEATURE_OPTINS,
        exports.TcfEuV2Field.PURPOSE_CONSENTS,
        exports.TcfEuV2Field.PURPOSE_LEGITIMATE_INTERESTS,
        exports.TcfEuV2Field.PURPOSE_ONE_TREATMENT,
        exports.TcfEuV2Field.PUBLISHER_COUNTRY_CODE,
        exports.TcfEuV2Field.VENDOR_CONSENTS,
        exports.TcfEuV2Field.VENDOR_LEGITIMATE_INTERESTS,
        exports.TcfEuV2Field.PUBLISHER_RESTRICTIONS,
    ];
    const TCFEUV2_PUBLISHER_PURPOSES_SEGMENT_FIELD_NAMES = [
        exports.TcfEuV2Field.PUBLISHER_PURPOSES_SEGMENT_TYPE,
        exports.TcfEuV2Field.PUBLISHER_CONSENTS,
        exports.TcfEuV2Field.PUBLISHER_LEGITIMATE_INTERESTS,
        exports.TcfEuV2Field.NUM_CUSTOM_PURPOSES,
        exports.TcfEuV2Field.PUBLISHER_CUSTOM_CONSENTS,
        exports.TcfEuV2Field.PUBLISHER_CUSTOM_LEGITIMATE_INTERESTS,
    ];
    const TCFEUV2_VENDORS_ALLOWED_SEGMENT_FIELD_NAMES = [
        exports.TcfEuV2Field.VENDORS_ALLOWED_SEGMENT_TYPE,
        exports.TcfEuV2Field.VENDORS_ALLOWED,
    ];
    const TCFEUV2_VENDORS_DISCLOSED_SEGMENT_FIELD_NAMES = [
        exports.TcfEuV2Field.VENDORS_DISCLOSED_SEGMENT_TYPE,
        exports.TcfEuV2Field.VENDORS_DISCLOSED,
    ];

    class TraditionalBase64UrlEncoder extends AbstractBase64UrlEncoder {
        constructor() {
            super();
        }
        static getInstance() {
            return this.instance;
        }
        // Overriden
        pad(bitString) {
            while (bitString.length % 24 > 0) {
                bitString += "0";
            }
            return bitString;
        }
    }
    TraditionalBase64UrlEncoder.instance = new TraditionalBase64UrlEncoder();

    class FixedIntegerRangeEncoder {
        static encode(value) {
            value.sort((n1, n2) => n1 - n2);
            let groups = [];
            let groupStartIndex = 0;
            while (groupStartIndex < value.length) {
                let groupEndIndex = groupStartIndex;
                while (groupEndIndex < value.length - 1 && value[groupEndIndex] + 1 === value[groupEndIndex + 1]) {
                    groupEndIndex++;
                }
                groups.push(value.slice(groupStartIndex, groupEndIndex + 1));
                groupStartIndex = groupEndIndex + 1;
            }
            let bitString = FixedIntegerEncoder.encode(groups.length, 12);
            for (let i = 0; i < groups.length; i++) {
                if (groups[i].length === 1) {
                    bitString += "0" + FixedIntegerEncoder.encode(groups[i][0], 16);
                }
                else {
                    bitString +=
                        "1" +
                            FixedIntegerEncoder.encode(groups[i][0], 16) +
                            FixedIntegerEncoder.encode(groups[i][groups[i].length - 1], 16);
                }
            }
            return bitString;
        }
        static decode(bitString) {
            if (!/^[0-1]*$/.test(bitString) || bitString.length < 12) {
                throw new DecodingError("Undecodable FixedIntegerRange '" + bitString + "'");
            }
            let value = [];
            let count = FixedIntegerEncoder.decode(bitString.substring(0, 12));
            let startIndex = 12;
            for (let i = 0; i < count; i++) {
                let group = BooleanEncoder.decode(bitString.substring(startIndex, startIndex + 1));
                startIndex++;
                if (group === true) {
                    let start = FixedIntegerEncoder.decode(bitString.substring(startIndex, startIndex + 16));
                    startIndex += 16;
                    let end = FixedIntegerEncoder.decode(bitString.substring(startIndex, startIndex + 16));
                    startIndex += 16;
                    for (let j = start; j <= end; j++) {
                        value.push(j);
                    }
                }
                else {
                    let val = FixedIntegerEncoder.decode(bitString.substring(startIndex, startIndex + 16));
                    value.push(val);
                    startIndex += 16;
                }
            }
            return value;
        }
    }

    class EncodableFixedIntegerRange extends AbstractEncodableBitStringDataType {
        constructor(value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.setValue(value);
        }
        encode() {
            try {
                return FixedIntegerRangeEncoder.encode(this.value);
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                this.value = FixedIntegerRangeEncoder.decode(bitString);
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                let count = FixedIntegerEncoder.decode(StringUtil.substring(bitString, fromIndex, fromIndex + 12));
                let index = fromIndex + 12;
                for (let i = 0; i < count; i++) {
                    if (bitString.charAt(index) === "1") {
                        index += 33;
                    }
                    else {
                        index += 17;
                    }
                }
                return StringUtil.substring(bitString, fromIndex, index);
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
        // Overriden
        getValue() {
            return [...super.getValue()];
        }
        // Overriden
        setValue(value) {
            super.setValue(Array.from(new Set(value)).sort((n1, n2) => n1 - n2));
        }
    }

    class RangeEntry {
        constructor(key, type, ids) {
            this.key = key;
            this.type = type;
            this.ids = ids;
        }
        getKey() {
            return this.key;
        }
        setKey(key) {
            this.key = key;
        }
        getType() {
            return this.type;
        }
        setType(type) {
            this.type = type;
        }
        getIds() {
            return this.ids;
        }
        setIds(ids) {
            this.ids = ids;
        }
    }

    class EncodableArrayOfFixedIntegerRanges extends AbstractEncodableBitStringDataType {
        constructor(keyBitStringLength, typeBitStringLength, value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.keyBitStringLength = keyBitStringLength;
            this.typeBitStringLength = typeBitStringLength;
            this.setValue(value);
        }
        encode() {
            try {
                let entries = this.value;
                let sb = "";
                sb += FixedIntegerEncoder.encode(entries.length, 12);
                for (let i = 0; i < entries.length; i++) {
                    let entry = entries[i];
                    sb += FixedIntegerEncoder.encode(entry.getKey(), this.keyBitStringLength);
                    sb += FixedIntegerEncoder.encode(entry.getType(), this.typeBitStringLength);
                    sb += FixedIntegerRangeEncoder.encode(entry.getIds());
                }
                return sb;
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                let entries = [];
                let size = FixedIntegerEncoder.decode(StringUtil.substring(bitString, 0, 12));
                let index = 12;
                for (let i = 0; i < size; i++) {
                    let key = FixedIntegerEncoder.decode(StringUtil.substring(bitString, index, index + this.keyBitStringLength));
                    index += this.keyBitStringLength;
                    let type = FixedIntegerEncoder.decode(StringUtil.substring(bitString, index, index + this.typeBitStringLength));
                    index += this.typeBitStringLength;
                    let substring = new EncodableFixedIntegerRange([]).substring(bitString, index);
                    let ids = FixedIntegerRangeEncoder.decode(substring);
                    index += substring.length;
                    entries.push(new RangeEntry(key, type, ids));
                }
                this.value = entries;
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                let sb = "";
                sb += StringUtil.substring(bitString, fromIndex, fromIndex + 12);
                let size = FixedIntegerEncoder.decode(sb.toString());
                let index = fromIndex + sb.length;
                for (let i = 0; i < size; i++) {
                    let keySubstring = StringUtil.substring(bitString, index, index + this.keyBitStringLength);
                    index += keySubstring.length;
                    sb += keySubstring;
                    let typeSubstring = StringUtil.substring(bitString, index, index + this.typeBitStringLength);
                    index += typeSubstring.length;
                    sb += typeSubstring;
                    let rangeSubstring = new EncodableFixedIntegerRange([]).substring(bitString, index);
                    index += rangeSubstring.length;
                    sb += rangeSubstring;
                }
                return sb;
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
    }

    class EncodableBoolean extends AbstractEncodableBitStringDataType {
        constructor(value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.setValue(value);
        }
        encode() {
            try {
                return BooleanEncoder.encode(this.value);
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                this.value = BooleanEncoder.decode(bitString);
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                return StringUtil.substring(bitString, fromIndex, fromIndex + 1);
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
    }

    class DatetimeEncoder {
        static encode(value) {
            if (value) {
                return FixedIntegerEncoder.encode(Math.round(value.getTime() / 100), 36);
            }
            else {
                return FixedIntegerEncoder.encode(0, 36);
            }
        }
        static decode(bitString) {
            if (!/^[0-1]*$/.test(bitString) || bitString.length !== 36) {
                throw new DecodingError("Undecodable Datetime '" + bitString + "'");
            }
            return new Date(FixedIntegerEncoder.decode(bitString) * 100);
        }
    }

    class EncodableDatetime extends AbstractEncodableBitStringDataType {
        constructor(value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.setValue(value);
        }
        encode() {
            try {
                return DatetimeEncoder.encode(this.value);
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                this.value = DatetimeEncoder.decode(bitString);
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                return StringUtil.substring(bitString, fromIndex, fromIndex + 36);
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
    }

    class FixedBitfieldEncoder {
        static encode(value, bitStringLength) {
            if (value.length > bitStringLength) {
                throw new EncodingError("Too many values '" + value.length + "'");
            }
            let bitString = "";
            for (let i = 0; i < value.length; i++) {
                bitString += BooleanEncoder.encode(value[i]);
            }
            while (bitString.length < bitStringLength) {
                bitString += "0";
            }
            return bitString;
        }
        static decode(bitString) {
            if (!/^[0-1]*$/.test(bitString)) {
                throw new DecodingError("Undecodable FixedBitfield '" + bitString + "'");
            }
            let value = [];
            for (let i = 0; i < bitString.length; i++) {
                value.push(BooleanEncoder.decode(bitString.substring(i, i + 1)));
            }
            return value;
        }
    }

    class EncodableFixedBitfield extends AbstractEncodableBitStringDataType {
        constructor(value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.numElements = value.length;
            this.setValue(value);
        }
        encode() {
            try {
                return FixedBitfieldEncoder.encode(this.value, this.numElements);
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                this.value = FixedBitfieldEncoder.decode(bitString);
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                return StringUtil.substring(bitString, fromIndex, fromIndex + this.numElements);
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
        // Overriden
        getValue() {
            return [...super.getValue()];
        }
        // Overriden
        setValue(value) {
            let v = [...value];
            for (let i = v.length; i < this.numElements; i++) {
                v.push(false);
            }
            if (v.length > this.numElements) {
                v = v.slice(0, this.numElements);
            }
            super.setValue(v);
        }
    }

    class FixedStringEncoder {
        static encode(value, stringLength) {
            while (value.length < stringLength) {
                value += " ";
            }
            let bitString = "";
            for (let i = 0; i < value.length; i++) {
                let code = value.charCodeAt(i);
                if (code === 32) {
                    // space
                    bitString += FixedIntegerEncoder.encode(63, 6);
                }
                else if (code >= 65) {
                    bitString += FixedIntegerEncoder.encode(value.charCodeAt(i) - 65, 6);
                }
                else {
                    throw new EncodingError("Unencodable FixedString '" + value + "'");
                }
            }
            return bitString;
        }
        static decode(bitString) {
            if (!/^[0-1]*$/.test(bitString) || bitString.length % 6 !== 0) {
                throw new DecodingError("Undecodable FixedString '" + bitString + "'");
            }
            let value = "";
            for (let i = 0; i < bitString.length; i += 6) {
                let code = FixedIntegerEncoder.decode(bitString.substring(i, i + 6));
                if (code === 63) {
                    value += " ";
                }
                else {
                    value += String.fromCharCode(code + 65);
                }
            }
            return value.trim();
        }
    }

    class EncodableFixedString extends AbstractEncodableBitStringDataType {
        constructor(stringLength, value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.stringLength = stringLength;
            this.setValue(value);
        }
        encode() {
            try {
                return FixedStringEncoder.encode(this.value, this.stringLength);
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                this.value = FixedStringEncoder.decode(bitString);
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                return StringUtil.substring(bitString, fromIndex, fromIndex + this.stringLength * 6);
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
    }

    class EncodableOptimizedFixedRange extends AbstractEncodableBitStringDataType {
        constructor(value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.setValue(value);
        }
        encode() {
            try {
                //TODO: encoding the range before choosing the shortest is inefficient. There is probably a way
                //to identify in advance which will be shorter based on the array length and values
                let max = this.value.length > 0 ? this.value[this.value.length - 1] : 0;
                let rangeBitString = FixedIntegerRangeEncoder.encode(this.value);
                let rangeLength = rangeBitString.length;
                let bitFieldLength = max;
                if (rangeLength <= bitFieldLength) {
                    return FixedIntegerEncoder.encode(max, 16) + "1" + rangeBitString;
                }
                else {
                    let bits = [];
                    let index = 0;
                    for (let i = 0; i < max; i++) {
                        if (i === this.value[index] - 1) {
                            bits[i] = true;
                            index++;
                        }
                        else {
                            bits[i] = false;
                        }
                    }
                    return FixedIntegerEncoder.encode(max, 16) + "0" + FixedBitfieldEncoder.encode(bits, bitFieldLength);
                }
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                if (bitString.charAt(16) === "1") {
                    this.value = FixedIntegerRangeEncoder.decode(bitString.substring(17));
                }
                else {
                    let value = [];
                    let bits = FixedBitfieldEncoder.decode(bitString.substring(17));
                    for (let i = 0; i < bits.length; i++) {
                        if (bits[i] === true) {
                            value.push(i + 1);
                        }
                    }
                    this.value = value;
                }
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                let max = FixedIntegerEncoder.decode(StringUtil.substring(bitString, fromIndex, fromIndex + 16));
                if (bitString.charAt(fromIndex + 16) === "1") {
                    return (StringUtil.substring(bitString, fromIndex, fromIndex + 17) +
                        new EncodableFixedIntegerRange([]).substring(bitString, fromIndex + 17));
                }
                else {
                    return StringUtil.substring(bitString, fromIndex, fromIndex + 17 + max);
                }
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
        // Overriden
        getValue() {
            return [...super.getValue()];
        }
        // Overriden
        setValue(value) {
            super.setValue(Array.from(new Set(value)).sort((n1, n2) => n1 - n2));
        }
    }

    class TcfEuV2CoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = TraditionalBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return TCFEUV2_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let date = new Date();
            let fields = new EncodableBitStringFields();
            fields.put(exports.TcfEuV2Field.VERSION.toString(), new EncodableFixedInteger(6, TcfEuV2.VERSION));
            fields.put(exports.TcfEuV2Field.CREATED.toString(), new EncodableDatetime(date));
            fields.put(exports.TcfEuV2Field.LAST_UPDATED.toString(), new EncodableDatetime(date));
            fields.put(exports.TcfEuV2Field.CMP_ID.toString(), new EncodableFixedInteger(12, 0));
            fields.put(exports.TcfEuV2Field.CMP_VERSION.toString(), new EncodableFixedInteger(12, 0));
            fields.put(exports.TcfEuV2Field.CONSENT_SCREEN.toString(), new EncodableFixedInteger(6, 0));
            fields.put(exports.TcfEuV2Field.CONSENT_LANGUAGE.toString(), new EncodableFixedString(2, "EN"));
            fields.put(exports.TcfEuV2Field.VENDOR_LIST_VERSION.toString(), new EncodableFixedInteger(12, 0));
            fields.put(exports.TcfEuV2Field.POLICY_VERSION.toString(), new EncodableFixedInteger(6, 2));
            fields.put(exports.TcfEuV2Field.IS_SERVICE_SPECIFIC.toString(), new EncodableBoolean(false));
            fields.put(exports.TcfEuV2Field.USE_NON_STANDARD_STACKS.toString(), new EncodableBoolean(false));
            fields.put(exports.TcfEuV2Field.SPECIAL_FEATURE_OPTINS.toString(), new EncodableFixedBitfield([false, false, false, false, false, false, false, false, false, false, false, false]));
            fields.put(exports.TcfEuV2Field.PURPOSE_CONSENTS.toString(), new EncodableFixedBitfield([
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ]));
            fields.put(exports.TcfEuV2Field.PURPOSE_LEGITIMATE_INTERESTS.toString(), new EncodableFixedBitfield([
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ]));
            fields.put(exports.TcfEuV2Field.PURPOSE_ONE_TREATMENT.toString(), new EncodableBoolean(false));
            fields.put(exports.TcfEuV2Field.PUBLISHER_COUNTRY_CODE.toString(), new EncodableFixedString(2, "AA"));
            fields.put(exports.TcfEuV2Field.VENDOR_CONSENTS.toString(), new EncodableOptimizedFixedRange([]));
            fields.put(exports.TcfEuV2Field.VENDOR_LEGITIMATE_INTERESTS.toString(), new EncodableOptimizedFixedRange([]));
            fields.put(exports.TcfEuV2Field.PUBLISHER_RESTRICTIONS.toString(), new EncodableArrayOfFixedIntegerRanges(6, 2, [], false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode TcfEuV2CoreSegment '" + encodedString + "'");
            }
        }
    }

    class EncodableFlexibleBitfield extends AbstractEncodableBitStringDataType {
        constructor(getLength, value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.getLength = getLength;
            this.setValue(value);
        }
        encode() {
            try {
                return FixedBitfieldEncoder.encode(this.value, this.getLength());
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                this.value = FixedBitfieldEncoder.decode(bitString);
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                return StringUtil.substring(bitString, fromIndex, fromIndex + this.getLength());
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
        // Overriden
        getValue() {
            return [...super.getValue()];
        }
        // Overriden
        setValue(value) {
            let numElements = this.getLength();
            let v = [...value];
            for (let i = v.length; i < numElements; i++) {
                v.push(false);
            }
            if (v.length > numElements) {
                v = v.slice(0, numElements);
            }
            super.setValue([...v]);
        }
    }

    class TcfEuV2PublisherPurposesSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = TraditionalBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return TCFEUV2_PUBLISHER_PURPOSES_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.TcfEuV2Field.PUBLISHER_PURPOSES_SEGMENT_TYPE.toString(), new EncodableFixedInteger(3, 3));
            fields.put(exports.TcfEuV2Field.PUBLISHER_CONSENTS.toString(), new EncodableFixedBitfield([
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ]));
            fields.put(exports.TcfEuV2Field.PUBLISHER_LEGITIMATE_INTERESTS.toString(), new EncodableFixedBitfield([
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ]));
            let numCustomPurposes = new EncodableFixedInteger(6, 0);
            fields.put(exports.TcfEuV2Field.NUM_CUSTOM_PURPOSES.toString(), numCustomPurposes);
            fields.put(exports.TcfEuV2Field.PUBLISHER_CUSTOM_CONSENTS.toString(), new EncodableFlexibleBitfield(() => {
                return numCustomPurposes.getValue();
            }, []));
            fields.put(exports.TcfEuV2Field.PUBLISHER_CUSTOM_LEGITIMATE_INTERESTS.toString(), new EncodableFlexibleBitfield(() => {
                return numCustomPurposes.getValue();
            }, []));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode TcfEuV2PublisherPurposesSegment '" + encodedString + "'");
            }
        }
    }

    class TcfEuV2VendorsAllowedSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = TraditionalBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return TCFEUV2_VENDORS_ALLOWED_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.TcfEuV2Field.VENDORS_ALLOWED_SEGMENT_TYPE.toString(), new EncodableFixedInteger(3, 2));
            fields.put(exports.TcfEuV2Field.VENDORS_ALLOWED.toString(), new EncodableOptimizedFixedRange([]));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode TcfEuV2VendorsAllowedSegment '" + encodedString + "'");
            }
        }
    }

    class TcfEuV2VendorsDisclosedSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = TraditionalBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return TCFEUV2_VENDORS_DISCLOSED_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.TcfEuV2Field.VENDORS_DISCLOSED_SEGMENT_TYPE.toString(), new EncodableFixedInteger(3, 1));
            fields.put(exports.TcfEuV2Field.VENDORS_DISCLOSED.toString(), new EncodableOptimizedFixedRange([]));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode TcfEuV2VendorsDisclosedSegment '" + encodedString + "'");
            }
        }
    }

    class TcfEuV2 extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return TcfEuV2.ID;
        }
        //Overriden
        getName() {
            return TcfEuV2.NAME;
        }
        //Override
        getVersion() {
            return TcfEuV2.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new TcfEuV2CoreSegment());
            segments.push(new TcfEuV2PublisherPurposesSegment());
            segments.push(new TcfEuV2VendorsAllowedSegment());
            segments.push(new TcfEuV2VendorsDisclosedSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                for (let i = 0; i < encodedSegments.length; i++) {
                    /**
                     * The first 3 bits contain the segment id. Rather than decode the entire string, just check the first character.
                     *
                     * A-H     = '000' = 0
                     * I-P     = '001' = 1
                     * Q-X     = '010' = 2
                     * Y-Z,a-f = '011' = 3
                     *
                     * Note that there is no segment id field for the core segment. Instead the first 6 bits are reserved
                     * for the encoding version which only coincidentally works here because the version value is less than 8.
                     */
                    let encodedSegment = encodedSegments[i];
                    if (encodedSegment.length !== 0) {
                        let firstChar = encodedSegment.charAt(0);
                        // unfortunately, the segment ordering doesn't match the segment ids
                        if (firstChar >= "A" && firstChar <= "H") {
                            segments[0].decode(encodedSegments[i]);
                        }
                        else if (firstChar >= "I" && firstChar <= "P") {
                            segments[3].decode(encodedSegments[i]);
                        }
                        else if (firstChar >= "Q" && firstChar <= "X") {
                            segments[2].decode(encodedSegments[i]);
                        }
                        else if ((firstChar >= "Y" && firstChar <= "Z") || (firstChar >= "a" && firstChar <= "f")) {
                            segments[1].decode(encodedSegments[i]);
                        }
                        else {
                            throw new DecodingError("Unable to decode TcfEuV2 segment '" + encodedSegment + "'");
                        }
                    }
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                let isServiceSpecific = this.getFieldValue(exports.TcfEuV2Field.IS_SERVICE_SPECIFIC);
                if (isServiceSpecific) {
                    if (segments.length >= 2) {
                        encodedSegments.push(segments[1].encode());
                    }
                }
                else {
                    if (segments.length >= 2) {
                        encodedSegments.push(segments[2].encode());
                        if (segments.length >= 3) {
                            encodedSegments.push(segments[3].encode());
                        }
                    }
                }
            }
            return encodedSegments.join(".");
        }
        //Overriden
        setFieldValue(fieldName, value) {
            super.setFieldValue(fieldName, value);
            if (fieldName !== exports.TcfEuV2Field.CREATED && fieldName !== exports.TcfEuV2Field.LAST_UPDATED) {
                let date = new Date();
                super.setFieldValue(exports.TcfEuV2Field.CREATED, date);
                super.setFieldValue(exports.TcfEuV2Field.LAST_UPDATED, date);
            }
        }
    }
    TcfEuV2.ID = 2;
    TcfEuV2.VERSION = 2;
    TcfEuV2.NAME = "tcfeuv2";

    exports.TcfCaV1Field = void 0;
    (function (TcfCaV1Field) {
        TcfCaV1Field["VERSION"] = "Version";
        TcfCaV1Field["CREATED"] = "Created";
        TcfCaV1Field["LAST_UPDATED"] = "LastUpdated";
        TcfCaV1Field["CMP_ID"] = "CmpId";
        TcfCaV1Field["CMP_VERSION"] = "CmpVersion";
        TcfCaV1Field["CONSENT_SCREEN"] = "ConsentScreen";
        TcfCaV1Field["CONSENT_LANGUAGE"] = "ConsentLanguage";
        TcfCaV1Field["VENDOR_LIST_VERSION"] = "VendorListVersion";
        TcfCaV1Field["TCF_POLICY_VERSION"] = "TcfPolicyVersion";
        TcfCaV1Field["USE_NON_STANDARD_STACKS"] = "UseNonStandardStacks";
        TcfCaV1Field["SPECIAL_FEATURE_EXPRESS_CONSENT"] = "SpecialFeatureExpressConsent";
        TcfCaV1Field["PUB_PURPOSES_SEGMENT_TYPE"] = "PubPurposesSegmentType";
        TcfCaV1Field["PURPOSES_EXPRESS_CONSENT"] = "PurposesExpressConsent";
        TcfCaV1Field["PURPOSES_IMPLIED_CONSENT"] = "PurposesImpliedConsent";
        TcfCaV1Field["VENDOR_EXPRESS_CONSENT"] = "VendorExpressConsent";
        TcfCaV1Field["VENDOR_IMPLIED_CONSENT"] = "VendorImpliedConsent";
        TcfCaV1Field["PUB_RESTRICTIONS"] = "PubRestrictions";
        TcfCaV1Field["PUB_PURPOSES_EXPRESS_CONSENT"] = "PubPurposesExpressConsent";
        TcfCaV1Field["PUB_PURPOSES_IMPLIED_CONSENT"] = "PubPurposesImpliedConsent";
        TcfCaV1Field["NUM_CUSTOM_PURPOSES"] = "NumCustomPurposes";
        TcfCaV1Field["CUSTOM_PURPOSES_EXPRESS_CONSENT"] = "CustomPurposesExpressConsent";
        TcfCaV1Field["CUSTOM_PURPOSES_IMPLIED_CONSENT"] = "CustomPurposesImpliedConsent";
        TcfCaV1Field["DISCLOSED_VENDORS_SEGMENT_TYPE"] = "DisclosedVendorsSegmentType";
        TcfCaV1Field["DISCLOSED_VENDORS"] = "DisclosedVendors";
    })(exports.TcfCaV1Field || (exports.TcfCaV1Field = {}));
    const TCFCAV1_CORE_SEGMENT_FIELD_NAMES = [
        exports.TcfCaV1Field.VERSION,
        exports.TcfCaV1Field.CREATED,
        exports.TcfCaV1Field.LAST_UPDATED,
        exports.TcfCaV1Field.CMP_ID,
        exports.TcfCaV1Field.CMP_VERSION,
        exports.TcfCaV1Field.CONSENT_SCREEN,
        exports.TcfCaV1Field.CONSENT_LANGUAGE,
        exports.TcfCaV1Field.VENDOR_LIST_VERSION,
        exports.TcfCaV1Field.TCF_POLICY_VERSION,
        exports.TcfCaV1Field.USE_NON_STANDARD_STACKS,
        exports.TcfCaV1Field.SPECIAL_FEATURE_EXPRESS_CONSENT,
        exports.TcfCaV1Field.PURPOSES_EXPRESS_CONSENT,
        exports.TcfCaV1Field.PURPOSES_IMPLIED_CONSENT,
        exports.TcfCaV1Field.VENDOR_EXPRESS_CONSENT,
        exports.TcfCaV1Field.VENDOR_IMPLIED_CONSENT,
        exports.TcfCaV1Field.PUB_RESTRICTIONS,
    ];
    const TCFCAV1_PUBLISHER_PURPOSES_SEGMENT_FIELD_NAMES = [
        exports.TcfCaV1Field.PUB_PURPOSES_SEGMENT_TYPE,
        exports.TcfCaV1Field.PUB_PURPOSES_EXPRESS_CONSENT,
        exports.TcfCaV1Field.PUB_PURPOSES_IMPLIED_CONSENT,
        exports.TcfCaV1Field.NUM_CUSTOM_PURPOSES,
        exports.TcfCaV1Field.CUSTOM_PURPOSES_EXPRESS_CONSENT,
        exports.TcfCaV1Field.CUSTOM_PURPOSES_IMPLIED_CONSENT,
    ];
    const TCFCAV1_DISCLOSED_VENDORS_SEGMENT_FIELD_NAMES = [
        exports.TcfCaV1Field.DISCLOSED_VENDORS_SEGMENT_TYPE,
        exports.TcfCaV1Field.DISCLOSED_VENDORS,
    ];

    class TcfCaV1CoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return TCFCAV1_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let date = new Date();
            let fields = new EncodableBitStringFields();
            fields.put(exports.TcfCaV1Field.VERSION.toString(), new EncodableFixedInteger(6, TcfCaV1.VERSION));
            fields.put(exports.TcfCaV1Field.CREATED.toString(), new EncodableDatetime(date));
            fields.put(exports.TcfCaV1Field.LAST_UPDATED.toString(), new EncodableDatetime(date));
            fields.put(exports.TcfCaV1Field.CMP_ID.toString(), new EncodableFixedInteger(12, 0));
            fields.put(exports.TcfCaV1Field.CMP_VERSION.toString(), new EncodableFixedInteger(12, 0));
            fields.put(exports.TcfCaV1Field.CONSENT_SCREEN.toString(), new EncodableFixedInteger(6, 0));
            fields.put(exports.TcfCaV1Field.CONSENT_LANGUAGE.toString(), new EncodableFixedString(2, "EN"));
            fields.put(exports.TcfCaV1Field.VENDOR_LIST_VERSION.toString(), new EncodableFixedInteger(12, 0));
            fields.put(exports.TcfCaV1Field.TCF_POLICY_VERSION.toString(), new EncodableFixedInteger(6, 2));
            fields.put(exports.TcfCaV1Field.USE_NON_STANDARD_STACKS.toString(), new EncodableBoolean(false));
            fields.put(exports.TcfCaV1Field.SPECIAL_FEATURE_EXPRESS_CONSENT.toString(), new EncodableFixedBitfield([false, false, false, false, false, false, false, false, false, false, false, false]));
            fields.put(exports.TcfCaV1Field.PURPOSES_EXPRESS_CONSENT.toString(), new EncodableFixedBitfield([
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ]));
            fields.put(exports.TcfCaV1Field.PURPOSES_IMPLIED_CONSENT.toString(), new EncodableFixedBitfield([
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ]));
            fields.put(exports.TcfCaV1Field.VENDOR_EXPRESS_CONSENT.toString(), new EncodableOptimizedFixedRange([]));
            fields.put(exports.TcfCaV1Field.VENDOR_IMPLIED_CONSENT.toString(), new EncodableOptimizedFixedRange([]));
            fields.put(exports.TcfCaV1Field.PUB_RESTRICTIONS.toString(), new EncodableArrayOfFixedIntegerRanges(6, 2, [], false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode TcfCaV1CoreSegment '" + encodedString + "'");
            }
        }
    }

    class TcfCaV1PublisherPurposesSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return TCFCAV1_PUBLISHER_PURPOSES_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.TcfCaV1Field.PUB_PURPOSES_SEGMENT_TYPE.toString(), new EncodableFixedInteger(3, 3));
            fields.put(exports.TcfCaV1Field.PUB_PURPOSES_EXPRESS_CONSENT.toString(), new EncodableFixedBitfield([
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ]));
            fields.put(exports.TcfCaV1Field.PUB_PURPOSES_IMPLIED_CONSENT.toString(), new EncodableFixedBitfield([
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ]));
            let numCustomPurposes = new EncodableFixedInteger(6, 0);
            fields.put(exports.TcfCaV1Field.NUM_CUSTOM_PURPOSES.toString(), numCustomPurposes);
            fields.put(exports.TcfCaV1Field.CUSTOM_PURPOSES_EXPRESS_CONSENT.toString(), new EncodableFlexibleBitfield(() => {
                return numCustomPurposes.getValue();
            }, []));
            fields.put(exports.TcfCaV1Field.CUSTOM_PURPOSES_IMPLIED_CONSENT.toString(), new EncodableFlexibleBitfield(() => {
                return numCustomPurposes.getValue();
            }, []));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode TcfCaV1PublisherPurposesSegment '" + encodedString + "'");
            }
        }
    }

    class TcfCaV1DisclosedVendorsSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = TraditionalBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return TCFCAV1_DISCLOSED_VENDORS_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.TcfCaV1Field.DISCLOSED_VENDORS_SEGMENT_TYPE.toString(), new EncodableFixedInteger(3, 1));
            fields.put(exports.TcfCaV1Field.DISCLOSED_VENDORS.toString(), new EncodableOptimizedFixedRange([]));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode HeaderV1CoreSegment '" + encodedString + "'");
            }
        }
    }

    class TcfCaV1 extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return TcfCaV1.ID;
        }
        //Overriden
        getName() {
            return TcfCaV1.NAME;
        }
        //Override
        getVersion() {
            return TcfCaV1.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new TcfCaV1CoreSegment());
            segments.push(new TcfCaV1PublisherPurposesSegment());
            segments.push(new TcfCaV1DisclosedVendorsSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                for (let i = 0; i < encodedSegments.length; i++) {
                    /**
                     * The first 3 bits contain the segment id. Rather than decode the entire string, just check the first character.
                     *
                     * A-H     = '000' = 0
                     * I-P     = '001' = 1
                     * Y-Z,a-f = '011' = 3
                     *
                     * Note that there is no segment id field for the core segment. Instead the first 6 bits are reserved
                     * for the encoding version which only coincidentally works here because the version value is less than 8.
                     */
                    let encodedSegment = encodedSegments[i];
                    if (encodedSegment.length !== 0) {
                        let firstChar = encodedSegment.charAt(0);
                        if (firstChar >= "A" && firstChar <= "H") {
                            segments[0].decode(encodedSegments[i]);
                        }
                        else if (firstChar >= "I" && firstChar <= "P") {
                            segments[2].decode(encodedSegments[i]);
                        }
                        else if ((firstChar >= "Y" && firstChar <= "Z") || (firstChar >= "a" && firstChar <= "f")) {
                            segments[1].decode(encodedSegments[i]);
                        }
                        else {
                            throw new DecodingError("Unable to decode TcfCaV1 segment '" + encodedSegment + "'");
                        }
                    }
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            encodedSegments.push(segments[0].encode());
            encodedSegments.push(segments[1].encode());
            if (this.getFieldValue(exports.TcfCaV1Field.DISCLOSED_VENDORS).length > 0) {
                encodedSegments.push(segments[2].encode());
            }
            return encodedSegments.join(".");
        }
        //Overriden
        setFieldValue(fieldName, value) {
            super.setFieldValue(fieldName, value);
            if (fieldName !== exports.TcfCaV1Field.CREATED && fieldName !== exports.TcfCaV1Field.LAST_UPDATED) {
                let date = new Date();
                super.setFieldValue(exports.TcfCaV1Field.CREATED, date);
                super.setFieldValue(exports.TcfCaV1Field.LAST_UPDATED, date);
            }
        }
    }
    TcfCaV1.ID = 5;
    TcfCaV1.VERSION = 1;
    TcfCaV1.NAME = "tcfcav1";

    class UnencodableCharacter {
        constructor(value, validator) {
            this.value = null;
            if (validator) {
                this.validator = validator;
            }
            else {
                this.validator = new (class {
                    test(v) {
                        return true;
                    }
                })();
            }
            this.setValue(value);
        }
        hasValue() {
            return this.value != null;
        }
        getValue() {
            return this.value;
        }
        setValue(value) {
            if (value) {
                this.value = value.charAt(0);
            }
            else {
                value = null;
            }
        }
    }

    class UnencodableInteger {
        constructor(value, validator) {
            this.value = null;
            if (validator) {
                this.validator = validator;
            }
            else {
                this.validator = new (class {
                    test(v) {
                        return true;
                    }
                })();
            }
            this.setValue(value);
        }
        hasValue() {
            return this.value != null;
        }
        getValue() {
            return this.value;
        }
        setValue(value) {
            this.value = value;
        }
    }

    class GenericFields {
        constructor() {
            this.fields = new Map();
        }
        containsKey(key) {
            return this.fields.has(key);
        }
        put(key, value) {
            this.fields.set(key, value);
        }
        get(key) {
            return this.fields.get(key);
        }
        getAll() {
            return new Map(this.fields);
        }
        reset(fields) {
            this.fields.clear();
            fields.getAll().forEach((value, key) => {
                this.fields.set(key, value);
            });
        }
    }

    exports.UspV1Field = void 0;
    (function (UspV1Field) {
        UspV1Field["VERSION"] = "Version";
        UspV1Field["NOTICE"] = "Notice";
        UspV1Field["OPT_OUT_SALE"] = "OptOutSale";
        UspV1Field["LSPA_COVERED"] = "LspaCovered";
    })(exports.UspV1Field || (exports.UspV1Field = {}));
    const USPV1_CORE_SEGMENT_FIELD_NAMES = [
        exports.UspV1Field.VERSION,
        exports.UspV1Field.NOTICE,
        exports.UspV1Field.OPT_OUT_SALE,
        exports.UspV1Field.LSPA_COVERED,
    ];

    class UspV1CoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USPV1_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const validator = new (class {
                test(s) {
                    return s === "-" || s === "Y" || s === "N";
                }
            })();
            let fields = new GenericFields();
            fields.put(exports.UspV1Field.VERSION, new UnencodableInteger(UspV1.VERSION));
            fields.put(exports.UspV1Field.NOTICE, new UnencodableCharacter("-", validator));
            fields.put(exports.UspV1Field.OPT_OUT_SALE, new UnencodableCharacter("-", validator));
            fields.put(exports.UspV1Field.LSPA_COVERED, new UnencodableCharacter("-", validator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let str = "";
            str += fields.get(exports.UspV1Field.VERSION).getValue();
            str += fields.get(exports.UspV1Field.NOTICE).getValue();
            str += fields.get(exports.UspV1Field.OPT_OUT_SALE).getValue();
            str += fields.get(exports.UspV1Field.LSPA_COVERED).getValue();
            return str;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length != 4) {
                throw new DecodingError("Unable to decode UspV1CoreSegment '" + encodedString + "'");
            }
            try {
                fields.get(exports.UspV1Field.VERSION).setValue(parseInt(encodedString.substring(0, 1)));
                fields.get(exports.UspV1Field.NOTICE).setValue(encodedString.charAt(1));
                fields.get(exports.UspV1Field.OPT_OUT_SALE).setValue(encodedString.charAt(2));
                fields.get(exports.UspV1Field.LSPA_COVERED).setValue(encodedString.charAt(3));
            }
            catch (e) {
                throw new DecodingError("Unable to decode UspV1CoreSegment '" + encodedString + "'");
            }
        }
    }

    // Deprecated
    class UspV1 extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UspV1.ID;
        }
        //Overriden
        getName() {
            return UspV1.NAME;
        }
        //Override
        getVersion() {
            return UspV1.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UspV1CoreSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                for (let i = 0; i < segments.length; i++) {
                    if (encodedSegments.length > i) {
                        segments[i].decode(encodedSegments[i]);
                    }
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            for (let i = 0; i < segments.length; i++) {
                let segment = segments[i];
                encodedSegments.push(segment.encode());
            }
            return encodedSegments.join(".");
        }
    }
    UspV1.ID = 6;
    UspV1.VERSION = 1;
    UspV1.NAME = "uspv1";

    exports.UsNatField = void 0;
    (function (UsNatField) {
        UsNatField["VERSION"] = "Version";
        UsNatField["SHARING_NOTICE"] = "SharingNotice";
        UsNatField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsNatField["SHARING_OPT_OUT_NOTICE"] = "SharingOptOutNotice";
        UsNatField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsNatField["SENSITIVE_DATA_PROCESSING_OPT_OUT_NOTICE"] = "SensitiveDataProcessingOptOutNotice";
        UsNatField["SENSITIVE_DATA_LIMIT_USE_NOTICE"] = "SensitiveDataLimitUseNotice";
        UsNatField["SALE_OPT_OUT"] = "SaleOptOut";
        UsNatField["SHARING_OPT_OUT"] = "SharingOptOut";
        UsNatField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsNatField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsNatField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsNatField["PERSONAL_DATA_CONSENTS"] = "PersonalDataConsents";
        UsNatField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsNatField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsNatField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsNatField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsNatField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsNatField["GPC"] = "Gpc";
    })(exports.UsNatField || (exports.UsNatField = {}));
    const USNAT_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsNatField.VERSION,
        exports.UsNatField.SHARING_NOTICE,
        exports.UsNatField.SALE_OPT_OUT_NOTICE,
        exports.UsNatField.SHARING_OPT_OUT_NOTICE,
        exports.UsNatField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsNatField.SENSITIVE_DATA_PROCESSING_OPT_OUT_NOTICE,
        exports.UsNatField.SENSITIVE_DATA_LIMIT_USE_NOTICE,
        exports.UsNatField.SALE_OPT_OUT,
        exports.UsNatField.SHARING_OPT_OUT,
        exports.UsNatField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsNatField.SENSITIVE_DATA_PROCESSING,
        exports.UsNatField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsNatField.PERSONAL_DATA_CONSENTS,
        exports.UsNatField.MSPA_COVERED_TRANSACTION,
        exports.UsNatField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsNatField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USNAT_GPC_SEGMENT_FIELD_NAMES = [exports.UsNatField.GPC_SEGMENT_TYPE, exports.UsNatField.GPC];

    class FixedIntegerListEncoder {
        static encode(value, elementBitStringLength, numElements) {
            if (value.length > numElements) {
                throw new EncodingError("Too many values '" + value.length + "'");
            }
            let bitString = "";
            for (let i = 0; i < value.length; i++) {
                bitString += FixedIntegerEncoder.encode(value[i], elementBitStringLength);
            }
            while (bitString.length < elementBitStringLength * numElements) {
                bitString += "0";
            }
            return bitString;
        }
        static decode(bitString, elementBitStringLength, numElements) {
            if (!/^[0-1]*$/.test(bitString)) {
                throw new DecodingError("Undecodable FixedInteger '" + bitString + "'");
            }
            if (bitString.length > elementBitStringLength * numElements) {
                throw new DecodingError("Undecodable FixedIntegerList '" + bitString + "'");
            }
            if (bitString.length % elementBitStringLength != 0) {
                throw new DecodingError("Undecodable FixedIntegerList '" + bitString + "'");
            }
            while (bitString.length < elementBitStringLength * numElements) {
                bitString += "0";
            }
            if (bitString.length > elementBitStringLength * numElements) {
                bitString = bitString.substring(0, elementBitStringLength * numElements);
            }
            let value = [];
            for (let i = 0; i < bitString.length; i += elementBitStringLength) {
                value.push(FixedIntegerEncoder.decode(bitString.substring(i, i + elementBitStringLength)));
            }
            while (value.length < numElements) {
                value.push(0);
            }
            return value;
        }
    }

    class EncodableFixedIntegerList extends AbstractEncodableBitStringDataType {
        constructor(elementBitStringLength, value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.elementBitStringLength = elementBitStringLength;
            this.numElements = value.length;
            this.setValue(value);
        }
        encode() {
            try {
                return FixedIntegerListEncoder.encode(this.value, this.elementBitStringLength, this.numElements);
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                this.value = FixedIntegerListEncoder.decode(bitString, this.elementBitStringLength, this.numElements);
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                return StringUtil.substring(bitString, fromIndex, fromIndex + this.elementBitStringLength * this.numElements);
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
        // Overriden
        getValue() {
            return [...super.getValue()];
        }
        // Overriden
        setValue(value) {
            let v = [...value];
            for (let i = v.length; i < this.numElements; i++) {
                v.push(0);
            }
            if (v.length > this.numElements) {
                v = v.slice(0, this.numElements);
            }
            super.setValue(v);
        }
    }

    class UsNatCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USNAT_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsNatField.VERSION.toString(), new EncodableFixedInteger(6, UsNat.VERSION));
            fields.put(exports.UsNatField.SHARING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.SHARING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.SENSITIVE_DATA_PROCESSING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.SENSITIVE_DATA_LIMIT_USE_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.SHARING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsNatField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedIntegerList(2, [0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsNatField.PERSONAL_DATA_CONSENTS.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNatField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                // Necessary to maintain backwards compatibility when sensitive data processing changed from a
                // length of 12 to 16 and known child sensitive data consents changed from a length of 2 to 3 in the
                // DE, IA, NE, NH, NJ, TN release
                if (bitString.length == 66) {
                    bitString =
                        bitString.substring(0, 48) + "00000000" + bitString.substring(48, 52) + "00" + bitString.substring(52, 62);
                }
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsNatCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsNatGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USNAT_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsNatField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsNatField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsNatField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsNatGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsNat extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsNat.ID;
        }
        //Overriden
        getName() {
            return UsNat.NAME;
        }
        //Override
        getVersion() {
            return UsNat.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsNatCoreSegment());
            segments.push(new UsNatGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsNatField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsNatField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsNatField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsNat.ID = 7;
    UsNat.VERSION = 1;
    UsNat.NAME = "usnat";

    exports.UsCaField = void 0;
    (function (UsCaField) {
        UsCaField["VERSION"] = "Version";
        UsCaField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsCaField["SHARING_OPT_OUT_NOTICE"] = "SharingOptOutNotice";
        UsCaField["SENSITIVE_DATA_LIMIT_USE_NOTICE"] = "SensitiveDataLimitUseNotice";
        UsCaField["SALE_OPT_OUT"] = "SaleOptOut";
        UsCaField["SHARING_OPT_OUT"] = "SharingOptOut";
        UsCaField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsCaField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsCaField["PERSONAL_DATA_CONSENTS"] = "PersonalDataConsents";
        UsCaField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsCaField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsCaField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsCaField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsCaField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsCaField["GPC"] = "Gpc";
    })(exports.UsCaField || (exports.UsCaField = {}));
    const USCA_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsCaField.VERSION,
        exports.UsCaField.SALE_OPT_OUT_NOTICE,
        exports.UsCaField.SHARING_OPT_OUT_NOTICE,
        exports.UsCaField.SENSITIVE_DATA_LIMIT_USE_NOTICE,
        exports.UsCaField.SALE_OPT_OUT,
        exports.UsCaField.SHARING_OPT_OUT,
        exports.UsCaField.SENSITIVE_DATA_PROCESSING,
        exports.UsCaField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsCaField.PERSONAL_DATA_CONSENTS,
        exports.UsCaField.MSPA_COVERED_TRANSACTION,
        exports.UsCaField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsCaField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USCA_GPC_SEGMENT_FIELD_NAMES = [exports.UsCaField.GPC_SEGMENT_TYPE, exports.UsCaField.GPC];

    class UsCaCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USCA_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsCaField.VERSION.toString(), new EncodableFixedInteger(6, UsCa.VERSION));
            fields.put(exports.UsCaField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCaField.SHARING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCaField.SENSITIVE_DATA_LIMIT_USE_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCaField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCaField.SHARING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCaField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsCaField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedIntegerList(2, [0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsCaField.PERSONAL_DATA_CONSENTS.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCaField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCaField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCaField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsCaCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsCaGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USCA_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsCaField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsCaField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsCaField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsCaGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsCa extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsCa.ID;
        }
        //Overriden
        getName() {
            return UsCa.NAME;
        }
        //Override
        getVersion() {
            return UsCa.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsCaCoreSegment());
            segments.push(new UsCaGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsCaField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsCaField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsCaField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsCa.ID = 8;
    UsCa.VERSION = 1;
    UsCa.NAME = "usca";

    exports.UsVaField = void 0;
    (function (UsVaField) {
        UsVaField["VERSION"] = "Version";
        UsVaField["SHARING_NOTICE"] = "SharingNotice";
        UsVaField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsVaField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsVaField["SALE_OPT_OUT"] = "SaleOptOut";
        UsVaField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsVaField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsVaField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsVaField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsVaField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsVaField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
    })(exports.UsVaField || (exports.UsVaField = {}));
    const USVA_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsVaField.VERSION,
        exports.UsVaField.SHARING_NOTICE,
        exports.UsVaField.SALE_OPT_OUT_NOTICE,
        exports.UsVaField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsVaField.SALE_OPT_OUT,
        exports.UsVaField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsVaField.SENSITIVE_DATA_PROCESSING,
        exports.UsVaField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsVaField.MSPA_COVERED_TRANSACTION,
        exports.UsVaField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsVaField.MSPA_SERVICE_PROVIDER_MODE,
    ];

    class UsVaCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USVA_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsVaField.VERSION.toString(), new EncodableFixedInteger(6, UsVa.VERSION));
            fields.put(exports.UsVaField.SHARING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsVaField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsVaField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsVaField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsVaField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsVaField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsVaField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsVaField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsVaField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsVaField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsVaCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsVa extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsVa.ID;
        }
        //Overriden
        getName() {
            return UsVa.NAME;
        }
        //Override
        getVersion() {
            return UsVa.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsVaCoreSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                for (let i = 0; i < segments.length; i++) {
                    if (encodedSegments.length > i) {
                        segments[i].decode(encodedSegments[i]);
                    }
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            for (let i = 0; i < segments.length; i++) {
                let segment = segments[i];
                encodedSegments.push(segment.encode());
            }
            return encodedSegments.join(".");
        }
    }
    UsVa.ID = 9;
    UsVa.VERSION = 1;
    UsVa.NAME = "usva";

    exports.UsCoField = void 0;
    (function (UsCoField) {
        UsCoField["VERSION"] = "Version";
        UsCoField["SHARING_NOTICE"] = "SharingNotice";
        UsCoField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsCoField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsCoField["SALE_OPT_OUT"] = "SaleOptOut";
        UsCoField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsCoField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsCoField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsCoField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsCoField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsCoField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsCoField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsCoField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsCoField["GPC"] = "Gpc";
    })(exports.UsCoField || (exports.UsCoField = {}));
    const USCO_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsCoField.VERSION,
        exports.UsCoField.SHARING_NOTICE,
        exports.UsCoField.SALE_OPT_OUT_NOTICE,
        exports.UsCoField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsCoField.SALE_OPT_OUT,
        exports.UsCoField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsCoField.SENSITIVE_DATA_PROCESSING,
        exports.UsCoField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsCoField.MSPA_COVERED_TRANSACTION,
        exports.UsCoField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsCoField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USCO_GPC_SEGMENT_FIELD_NAMES = [exports.UsCoField.GPC_SEGMENT_TYPE, exports.UsCoField.GPC];

    class UsCoCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USCO_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsCoField.VERSION.toString(), new EncodableFixedInteger(6, UsCo.VERSION));
            fields.put(exports.UsCoField.SHARING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCoField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCoField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCoField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCoField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCoField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsCoField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCoField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCoField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCoField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsCoCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsCoGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USCO_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsCoField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsCoField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsCoField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsCoGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsCo extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsCo.ID;
        }
        //Overriden
        getName() {
            return UsCo.NAME;
        }
        //Override
        getVersion() {
            return UsCo.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsCoCoreSegment());
            segments.push(new UsCoGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsCoField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsCoField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsCoField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsCo.ID = 10;
    UsCo.VERSION = 1;
    UsCo.NAME = "usco";

    exports.UsUtField = void 0;
    (function (UsUtField) {
        UsUtField["VERSION"] = "Version";
        UsUtField["SHARING_NOTICE"] = "SharingNotice";
        UsUtField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsUtField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsUtField["SENSITIVE_DATA_PROCESSING_OPT_OUT_NOTICE"] = "SensitiveDataProcessingOptOutNotice";
        UsUtField["SALE_OPT_OUT"] = "SaleOptOut";
        UsUtField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsUtField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsUtField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsUtField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsUtField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsUtField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
    })(exports.UsUtField || (exports.UsUtField = {}));
    const USUT_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsUtField.VERSION,
        exports.UsUtField.SHARING_NOTICE,
        exports.UsUtField.SALE_OPT_OUT_NOTICE,
        exports.UsUtField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsUtField.SENSITIVE_DATA_PROCESSING_OPT_OUT_NOTICE,
        exports.UsUtField.SALE_OPT_OUT,
        exports.UsUtField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsUtField.SENSITIVE_DATA_PROCESSING,
        exports.UsUtField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsUtField.MSPA_COVERED_TRANSACTION,
        exports.UsUtField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsUtField.MSPA_SERVICE_PROVIDER_MODE,
    ];

    class UsUtCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USUT_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsUtField.VERSION.toString(), new EncodableFixedInteger(6, UsUt.VERSION));
            fields.put(exports.UsUtField.SHARING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsUtField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsUtField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsUtField.SENSITIVE_DATA_PROCESSING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsUtField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsUtField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsUtField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsUtField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsUtField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsUtField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsUtField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsUtCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsUt extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsUt.ID;
        }
        //Overriden
        getName() {
            return UsUt.NAME;
        }
        //Override
        getVersion() {
            return UsUt.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsUtCoreSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                for (let i = 0; i < segments.length; i++) {
                    if (encodedSegments.length > i) {
                        segments[i].decode(encodedSegments[i]);
                    }
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            for (let i = 0; i < segments.length; i++) {
                let segment = segments[i];
                encodedSegments.push(segment.encode());
            }
            return encodedSegments.join(".");
        }
    }
    UsUt.ID = 11;
    UsUt.VERSION = 1;
    UsUt.NAME = "usut";

    exports.UsCtField = void 0;
    (function (UsCtField) {
        UsCtField["VERSION"] = "Version";
        UsCtField["SHARING_NOTICE"] = "SharingNotice";
        UsCtField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsCtField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsCtField["SALE_OPT_OUT"] = "SaleOptOut";
        UsCtField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsCtField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsCtField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsCtField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsCtField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsCtField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsCtField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsCtField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsCtField["GPC"] = "Gpc";
    })(exports.UsCtField || (exports.UsCtField = {}));
    const USCT_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsCtField.VERSION,
        exports.UsCtField.SHARING_NOTICE,
        exports.UsCtField.SALE_OPT_OUT_NOTICE,
        exports.UsCtField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsCtField.SALE_OPT_OUT,
        exports.UsCtField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsCtField.SENSITIVE_DATA_PROCESSING,
        exports.UsCtField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsCtField.MSPA_COVERED_TRANSACTION,
        exports.UsCtField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsCtField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USCT_GPC_SEGMENT_FIELD_NAMES = [exports.UsCtField.GPC_SEGMENT_TYPE, exports.UsCtField.GPC];

    class UsCtCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USCT_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsCtField.VERSION.toString(), new EncodableFixedInteger(6, UsCt.VERSION));
            fields.put(exports.UsCtField.SHARING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCtField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCtField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCtField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCtField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCtField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsCtField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedIntegerList(2, [0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsCtField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCtField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsCtField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsCtCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsCtGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USCT_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsCtField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsCtField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsCtField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsCtGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsCt extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsCt.ID;
        }
        //Overriden
        getName() {
            return UsCt.NAME;
        }
        //Override
        getVersion() {
            return UsCt.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsCtCoreSegment());
            segments.push(new UsCtGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsCtField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsCtField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsCtField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsCt.ID = 12;
    UsCt.VERSION = 1;
    UsCt.NAME = "usct";

    exports.UsFlField = void 0;
    (function (UsFlField) {
        UsFlField["VERSION"] = "Version";
        UsFlField["PROCESSING_NOTICE"] = "ProcessingNotice";
        UsFlField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsFlField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsFlField["SALE_OPT_OUT"] = "SaleOptOut";
        UsFlField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsFlField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsFlField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsFlField["ADDITIONAL_DATA_PROCESSING_CONSENT"] = "AdditionalDataProcessingConsent";
        UsFlField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsFlField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsFlField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
    })(exports.UsFlField || (exports.UsFlField = {}));
    const USFL_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsFlField.VERSION,
        exports.UsFlField.PROCESSING_NOTICE,
        exports.UsFlField.SALE_OPT_OUT_NOTICE,
        exports.UsFlField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsFlField.SALE_OPT_OUT,
        exports.UsFlField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsFlField.SENSITIVE_DATA_PROCESSING,
        exports.UsFlField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsFlField.ADDITIONAL_DATA_PROCESSING_CONSENT,
        exports.UsFlField.MSPA_COVERED_TRANSACTION,
        exports.UsFlField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsFlField.MSPA_SERVICE_PROVIDER_MODE,
    ];

    class UsFlCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USFL_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsFlField.VERSION.toString(), new EncodableFixedInteger(6, UsFl.VERSION));
            fields.put(exports.UsFlField.PROCESSING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsFlField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsFlField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsFlField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsFlField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsFlField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsFlField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedIntegerList(2, [0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsFlField.ADDITIONAL_DATA_PROCESSING_CONSENT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsFlField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsFlField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsFlField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsFlCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsFl extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsFl.ID;
        }
        //Overriden
        getName() {
            return UsFl.NAME;
        }
        //Override
        getVersion() {
            return UsFl.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsFlCoreSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                for (let i = 0; i < segments.length; i++) {
                    if (encodedSegments.length > i) {
                        segments[i].decode(encodedSegments[i]);
                    }
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            for (let i = 0; i < segments.length; i++) {
                let segment = segments[i];
                encodedSegments.push(segment.encode());
            }
            return encodedSegments.join(".");
        }
    }
    UsFl.ID = 13;
    UsFl.VERSION = 1;
    UsFl.NAME = "usfl";

    exports.UsMtField = void 0;
    (function (UsMtField) {
        UsMtField["VERSION"] = "Version";
        UsMtField["SHARING_NOTICE"] = "SharingNotice";
        UsMtField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsMtField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsMtField["SALE_OPT_OUT"] = "SaleOptOut";
        UsMtField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsMtField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsMtField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsMtField["ADDITIONAL_DATA_PROCESSING_CONSENT"] = "AdditionalDataProcessingConsent";
        UsMtField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsMtField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsMtField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsMtField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsMtField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsMtField["GPC"] = "Gpc";
    })(exports.UsMtField || (exports.UsMtField = {}));
    const USMT_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsMtField.VERSION,
        exports.UsMtField.SHARING_NOTICE,
        exports.UsMtField.SALE_OPT_OUT_NOTICE,
        exports.UsMtField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsMtField.SALE_OPT_OUT,
        exports.UsMtField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsMtField.SENSITIVE_DATA_PROCESSING,
        exports.UsMtField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsMtField.ADDITIONAL_DATA_PROCESSING_CONSENT,
        exports.UsMtField.MSPA_COVERED_TRANSACTION,
        exports.UsMtField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsMtField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USMT_GPC_SEGMENT_FIELD_NAMES = [exports.UsMtField.GPC_SEGMENT_TYPE, exports.UsMtField.GPC];

    class UsMtCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USMT_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsMtField.VERSION.toString(), new EncodableFixedInteger(6, UsMt.VERSION));
            fields.put(exports.UsMtField.SHARING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsMtField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsMtField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsMtField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsMtField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsMtField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsMtField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedIntegerList(2, [0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsMtField.ADDITIONAL_DATA_PROCESSING_CONSENT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsMtField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsMtField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsMtField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsMtCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsMtGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USMT_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsMtField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsMtField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsMtField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsMtGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsMt extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsMt.ID;
        }
        //Overriden
        getName() {
            return UsMt.NAME;
        }
        //Override
        getVersion() {
            return UsMt.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsMtCoreSegment());
            segments.push(new UsMtGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsMtField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsMtField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsMtField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsMt.ID = 14;
    UsMt.VERSION = 1;
    UsMt.NAME = "usmt";

    exports.UsOrField = void 0;
    (function (UsOrField) {
        UsOrField["VERSION"] = "Version";
        UsOrField["PROCESSING_NOTICE"] = "ProcessingNotice";
        UsOrField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsOrField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsOrField["SALE_OPT_OUT"] = "SaleOptOut";
        UsOrField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsOrField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsOrField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsOrField["ADDITIONAL_DATA_PROCESSING_CONSENT"] = "AdditionalDataProcessingConsent";
        UsOrField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsOrField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsOrField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsOrField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsOrField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsOrField["GPC"] = "Gpc";
    })(exports.UsOrField || (exports.UsOrField = {}));
    const USOR_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsOrField.VERSION,
        exports.UsOrField.PROCESSING_NOTICE,
        exports.UsOrField.SALE_OPT_OUT_NOTICE,
        exports.UsOrField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsOrField.SALE_OPT_OUT,
        exports.UsOrField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsOrField.SENSITIVE_DATA_PROCESSING,
        exports.UsOrField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsOrField.ADDITIONAL_DATA_PROCESSING_CONSENT,
        exports.UsOrField.MSPA_COVERED_TRANSACTION,
        exports.UsOrField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsOrField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USOR_GPC_SEGMENT_FIELD_NAMES = [exports.UsOrField.GPC_SEGMENT_TYPE, exports.UsOrField.GPC];

    class UsOrCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USOR_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsOrField.VERSION.toString(), new EncodableFixedInteger(6, UsOr.VERSION));
            fields.put(exports.UsOrField.PROCESSING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsOrField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsOrField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsOrField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsOrField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsOrField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsOrField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedIntegerList(2, [0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsOrField.ADDITIONAL_DATA_PROCESSING_CONSENT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsOrField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsOrField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsOrField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsOrCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsOrGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USOR_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsOrField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsOrField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsOrField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsOrGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsOr extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsOr.ID;
        }
        //Overriden
        getName() {
            return UsOr.NAME;
        }
        //Override
        getVersion() {
            return UsOr.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsOrCoreSegment());
            segments.push(new UsOrGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsOrField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsOrField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsOrField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsOr.ID = 15;
    UsOr.VERSION = 1;
    UsOr.NAME = "usor";

    exports.UsTxField = void 0;
    (function (UsTxField) {
        UsTxField["VERSION"] = "Version";
        UsTxField["PROCESSING_NOTICE"] = "ProcessingNotice";
        UsTxField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsTxField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsTxField["SALE_OPT_OUT"] = "SaleOptOut";
        UsTxField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsTxField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsTxField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsTxField["ADDITIONAL_DATA_PROCESSING_CONSENT"] = "AdditionalDataProcessingConsent";
        UsTxField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsTxField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsTxField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsTxField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsTxField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsTxField["GPC"] = "Gpc";
    })(exports.UsTxField || (exports.UsTxField = {}));
    const USTX_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsTxField.VERSION,
        exports.UsTxField.PROCESSING_NOTICE,
        exports.UsTxField.SALE_OPT_OUT_NOTICE,
        exports.UsTxField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsTxField.SALE_OPT_OUT,
        exports.UsTxField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsTxField.SENSITIVE_DATA_PROCESSING,
        exports.UsTxField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsTxField.ADDITIONAL_DATA_PROCESSING_CONSENT,
        exports.UsTxField.MSPA_COVERED_TRANSACTION,
        exports.UsTxField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsTxField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USTX_GPC_SEGMENT_FIELD_NAMES = [exports.UsTxField.GPC_SEGMENT_TYPE, exports.UsTxField.GPC];

    class UsTxCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USTX_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsTxField.VERSION.toString(), new EncodableFixedInteger(6, UsTx.VERSION));
            fields.put(exports.UsTxField.PROCESSING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTxField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTxField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTxField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTxField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTxField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsTxField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTxField.ADDITIONAL_DATA_PROCESSING_CONSENT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTxField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTxField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTxField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsTxCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsTxGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USTX_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsTxField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsTxField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsTxField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsTxGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsTx extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsTx.ID;
        }
        //Overriden
        getName() {
            return UsTx.NAME;
        }
        //Override
        getVersion() {
            return UsTx.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsTxCoreSegment());
            segments.push(new UsTxGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsTxField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsTxField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsTxField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsTx.ID = 16;
    UsTx.VERSION = 1;
    UsTx.NAME = "ustx";

    exports.UsDeField = void 0;
    (function (UsDeField) {
        UsDeField["VERSION"] = "Version";
        UsDeField["PROCESSING_NOTICE"] = "ProcessingNotice";
        UsDeField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsDeField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsDeField["SALE_OPT_OUT"] = "SaleOptOut";
        UsDeField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsDeField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsDeField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsDeField["ADDITIONAL_DATA_PROCESSING_CONSENT"] = "AdditionalDataProcessingConsent";
        UsDeField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsDeField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsDeField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsDeField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsDeField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsDeField["GPC"] = "Gpc";
    })(exports.UsDeField || (exports.UsDeField = {}));
    const USDE_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsDeField.VERSION,
        exports.UsDeField.PROCESSING_NOTICE,
        exports.UsDeField.SALE_OPT_OUT_NOTICE,
        exports.UsDeField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsDeField.SALE_OPT_OUT,
        exports.UsDeField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsDeField.SENSITIVE_DATA_PROCESSING,
        exports.UsDeField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsDeField.ADDITIONAL_DATA_PROCESSING_CONSENT,
        exports.UsDeField.MSPA_COVERED_TRANSACTION,
        exports.UsDeField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsDeField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USDE_GPC_SEGMENT_FIELD_NAMES = [exports.UsDeField.GPC_SEGMENT_TYPE, exports.UsDeField.GPC];

    class UsDeCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USDE_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsDeField.VERSION.toString(), new EncodableFixedInteger(6, UsDe.VERSION));
            fields.put(exports.UsDeField.PROCESSING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsDeField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsDeField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsDeField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsDeField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsDeField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsDeField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsDeField.ADDITIONAL_DATA_PROCESSING_CONSENT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsDeField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsDeField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsDeField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsDeCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsDeGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USDE_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsDeField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsDeField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsDeField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsDeGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsDe extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsDe.ID;
        }
        //Overriden
        getName() {
            return UsDe.NAME;
        }
        //Override
        getVersion() {
            return UsDe.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsDeCoreSegment());
            segments.push(new UsDeGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsDeField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsDeField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsDeField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsDe.ID = 17;
    UsDe.VERSION = 1;
    UsDe.NAME = "usde";

    exports.UsIaField = void 0;
    (function (UsIaField) {
        UsIaField["VERSION"] = "Version";
        UsIaField["PROCESSING_NOTICE"] = "ProcessingNotice";
        UsIaField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsIaField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsIaField["SENSITIVE_DATA_OPT_OUT_NOTICE"] = "SensitiveDataOptOutNotice";
        UsIaField["SALE_OPT_OUT"] = "SaleOptOut";
        UsIaField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsIaField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsIaField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsIaField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsIaField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsIaField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsIaField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsIaField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsIaField["GPC"] = "Gpc";
    })(exports.UsIaField || (exports.UsIaField = {}));
    const USIA_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsIaField.VERSION,
        exports.UsIaField.PROCESSING_NOTICE,
        exports.UsIaField.SALE_OPT_OUT_NOTICE,
        exports.UsIaField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsIaField.SENSITIVE_DATA_OPT_OUT_NOTICE,
        exports.UsIaField.SALE_OPT_OUT,
        exports.UsIaField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsIaField.SENSITIVE_DATA_PROCESSING,
        exports.UsIaField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsIaField.MSPA_COVERED_TRANSACTION,
        exports.UsIaField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsIaField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USIA_GPC_SEGMENT_FIELD_NAMES = [exports.UsIaField.GPC_SEGMENT_TYPE, exports.UsIaField.GPC];

    class UsIaCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USIA_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsIaField.VERSION.toString(), new EncodableFixedInteger(6, UsIa.VERSION));
            fields.put(exports.UsIaField.PROCESSING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsIaField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsIaField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsIaField.SENSITIVE_DATA_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsIaField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsIaField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsIaField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsIaField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsIaField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsIaField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsIaField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsIaCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsIaGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USIA_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsIaField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsIaField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsIaField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsIaGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsIa extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsIa.ID;
        }
        //Overriden
        getName() {
            return UsIa.NAME;
        }
        //Override
        getVersion() {
            return UsIa.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsIaCoreSegment());
            segments.push(new UsIaGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsIaField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsIaField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsIaField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsIa.ID = 18;
    UsIa.VERSION = 1;
    UsIa.NAME = "usia";

    exports.UsNeField = void 0;
    (function (UsNeField) {
        UsNeField["VERSION"] = "Version";
        UsNeField["PROCESSING_NOTICE"] = "ProcessingNotice";
        UsNeField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsNeField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsNeField["SALE_OPT_OUT"] = "SaleOptOut";
        UsNeField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsNeField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsNeField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsNeField["ADDITIONAL_DATA_PROCESSING_CONSENT"] = "AdditionalDataProcessingConsent";
        UsNeField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsNeField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsNeField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsNeField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsNeField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsNeField["GPC"] = "Gpc";
    })(exports.UsNeField || (exports.UsNeField = {}));
    const USNE_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsNeField.VERSION,
        exports.UsNeField.PROCESSING_NOTICE,
        exports.UsNeField.SALE_OPT_OUT_NOTICE,
        exports.UsNeField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsNeField.SALE_OPT_OUT,
        exports.UsNeField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsNeField.SENSITIVE_DATA_PROCESSING,
        exports.UsNeField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsNeField.ADDITIONAL_DATA_PROCESSING_CONSENT,
        exports.UsNeField.MSPA_COVERED_TRANSACTION,
        exports.UsNeField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsNeField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USNE_GPC_SEGMENT_FIELD_NAMES = [exports.UsNeField.GPC_SEGMENT_TYPE, exports.UsNeField.GPC];

    class UsNeCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USNE_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsNeField.VERSION.toString(), new EncodableFixedInteger(6, UsNe.VERSION));
            fields.put(exports.UsNeField.PROCESSING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNeField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNeField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNeField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNeField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNeField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsNeField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNeField.ADDITIONAL_DATA_PROCESSING_CONSENT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNeField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNeField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNeField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsNeCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsNeGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USNE_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsNeField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsNeField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsNeField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsNeGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsNe extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsNe.ID;
        }
        //Overriden
        getName() {
            return UsNe.NAME;
        }
        //Override
        getVersion() {
            return UsNe.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsNeCoreSegment());
            segments.push(new UsNeGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsNeField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsNeField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsNeField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsNe.ID = 19;
    UsNe.VERSION = 1;
    UsNe.NAME = "usne";

    exports.UsNhField = void 0;
    (function (UsNhField) {
        UsNhField["VERSION"] = "Version";
        UsNhField["PROCESSING_NOTICE"] = "ProcessingNotice";
        UsNhField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsNhField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsNhField["SALE_OPT_OUT"] = "SaleOptOut";
        UsNhField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsNhField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsNhField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsNhField["ADDITIONAL_DATA_PROCESSING_CONSENT"] = "AdditionalDataProcessingConsent";
        UsNhField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsNhField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsNhField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsNhField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsNhField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsNhField["GPC"] = "Gpc";
    })(exports.UsNhField || (exports.UsNhField = {}));
    const USNH_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsNhField.VERSION,
        exports.UsNhField.PROCESSING_NOTICE,
        exports.UsNhField.SALE_OPT_OUT_NOTICE,
        exports.UsNhField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsNhField.SALE_OPT_OUT,
        exports.UsNhField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsNhField.SENSITIVE_DATA_PROCESSING,
        exports.UsNhField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsNhField.ADDITIONAL_DATA_PROCESSING_CONSENT,
        exports.UsNhField.MSPA_COVERED_TRANSACTION,
        exports.UsNhField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsNhField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USNH_GPC_SEGMENT_FIELD_NAMES = [exports.UsNhField.GPC_SEGMENT_TYPE, exports.UsNhField.GPC];

    class UsNhCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USNH_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsNhField.VERSION.toString(), new EncodableFixedInteger(6, UsNh.VERSION));
            fields.put(exports.UsNhField.PROCESSING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNhField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNhField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNhField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNhField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNhField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsNhField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedIntegerList(2, [0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsNhField.ADDITIONAL_DATA_PROCESSING_CONSENT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNhField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNhField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNhField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsNhCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsNhGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USNH_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsNhField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsNhField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsNhField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsNhGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsNh extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsNh.ID;
        }
        //Overriden
        getName() {
            return UsNh.NAME;
        }
        //Override
        getVersion() {
            return UsNh.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsNhCoreSegment());
            segments.push(new UsNhGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsNhField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsNhField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsNhField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsNh.ID = 20;
    UsNh.VERSION = 1;
    UsNh.NAME = "usnh";

    exports.UsNjField = void 0;
    (function (UsNjField) {
        UsNjField["VERSION"] = "Version";
        UsNjField["PROCESSING_NOTICE"] = "ProcessingNotice";
        UsNjField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsNjField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsNjField["SALE_OPT_OUT"] = "SaleOptOut";
        UsNjField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsNjField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsNjField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsNjField["ADDITIONAL_DATA_PROCESSING_CONSENT"] = "AdditionalDataProcessingConsent";
        UsNjField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsNjField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsNjField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsNjField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsNjField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsNjField["GPC"] = "Gpc";
    })(exports.UsNjField || (exports.UsNjField = {}));
    const USNJ_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsNjField.VERSION,
        exports.UsNjField.PROCESSING_NOTICE,
        exports.UsNjField.SALE_OPT_OUT_NOTICE,
        exports.UsNjField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsNjField.SALE_OPT_OUT,
        exports.UsNjField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsNjField.SENSITIVE_DATA_PROCESSING,
        exports.UsNjField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsNjField.ADDITIONAL_DATA_PROCESSING_CONSENT,
        exports.UsNjField.MSPA_COVERED_TRANSACTION,
        exports.UsNjField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsNjField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USNJ_GPC_SEGMENT_FIELD_NAMES = [exports.UsNjField.GPC_SEGMENT_TYPE, exports.UsNjField.GPC];

    class UsNjCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USNJ_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsNjField.VERSION.toString(), new EncodableFixedInteger(6, UsNj.VERSION));
            fields.put(exports.UsNjField.PROCESSING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNjField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNjField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNjField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNjField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNjField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsNjField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsNjField.ADDITIONAL_DATA_PROCESSING_CONSENT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNjField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNjField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsNjField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsNjCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsNjGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USNJ_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsNjField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsNjField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsNjField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsNjGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsNj extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsNj.ID;
        }
        //Overriden
        getName() {
            return UsNj.NAME;
        }
        //Override
        getVersion() {
            return UsNj.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsNjCoreSegment());
            segments.push(new UsNjGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsNjField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsNjField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsNjField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsNj.ID = 21;
    UsNj.VERSION = 1;
    UsNj.NAME = "usnj";

    exports.UsTnField = void 0;
    (function (UsTnField) {
        UsTnField["VERSION"] = "Version";
        UsTnField["PROCESSING_NOTICE"] = "ProcessingNotice";
        UsTnField["SALE_OPT_OUT_NOTICE"] = "SaleOptOutNotice";
        UsTnField["TARGETED_ADVERTISING_OPT_OUT_NOTICE"] = "TargetedAdvertisingOptOutNotice";
        UsTnField["SALE_OPT_OUT"] = "SaleOptOut";
        UsTnField["TARGETED_ADVERTISING_OPT_OUT"] = "TargetedAdvertisingOptOut";
        UsTnField["SENSITIVE_DATA_PROCESSING"] = "SensitiveDataProcessing";
        UsTnField["KNOWN_CHILD_SENSITIVE_DATA_CONSENTS"] = "KnownChildSensitiveDataConsents";
        UsTnField["ADDITIONAL_DATA_PROCESSING_CONSENT"] = "AdditionalDataProcessingConsent";
        UsTnField["MSPA_COVERED_TRANSACTION"] = "MspaCoveredTransaction";
        UsTnField["MSPA_OPT_OUT_OPTION_MODE"] = "MspaOptOutOptionMode";
        UsTnField["MSPA_SERVICE_PROVIDER_MODE"] = "MspaServiceProviderMode";
        UsTnField["GPC_SEGMENT_TYPE"] = "GpcSegmentType";
        UsTnField["GPC_SEGMENT_INCLUDED"] = "GpcSegmentIncluded";
        UsTnField["GPC"] = "Gpc";
    })(exports.UsTnField || (exports.UsTnField = {}));
    const USTN_CORE_SEGMENT_FIELD_NAMES = [
        exports.UsTnField.VERSION,
        exports.UsTnField.PROCESSING_NOTICE,
        exports.UsTnField.SALE_OPT_OUT_NOTICE,
        exports.UsTnField.TARGETED_ADVERTISING_OPT_OUT_NOTICE,
        exports.UsTnField.SALE_OPT_OUT,
        exports.UsTnField.TARGETED_ADVERTISING_OPT_OUT,
        exports.UsTnField.SENSITIVE_DATA_PROCESSING,
        exports.UsTnField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS,
        exports.UsTnField.ADDITIONAL_DATA_PROCESSING_CONSENT,
        exports.UsTnField.MSPA_COVERED_TRANSACTION,
        exports.UsTnField.MSPA_OPT_OUT_OPTION_MODE,
        exports.UsTnField.MSPA_SERVICE_PROVIDER_MODE,
    ];
    const USTN_GPC_SEGMENT_FIELD_NAMES = [exports.UsTnField.GPC_SEGMENT_TYPE, exports.UsTnField.GPC];

    class UsTnCoreSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USTN_CORE_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            const nullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 0 && n <= 2;
                }
            })();
            const nonNullableBooleanAsTwoBitIntegerValidator = new (class {
                test(n) {
                    return n >= 1 && n <= 2;
                }
            })();
            const nullableBooleanAsTwoBitIntegerListValidator = new (class {
                test(l) {
                    for (let i = 0; i < l.length; i++) {
                        let n = l[i];
                        if (n < 0 || n > 2) {
                            return false;
                        }
                    }
                    return true;
                }
            })();
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsTnField.VERSION.toString(), new EncodableFixedInteger(6, UsTn.VERSION));
            fields.put(exports.UsTnField.PROCESSING_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTnField.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTnField.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTnField.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTnField.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTnField.SENSITIVE_DATA_PROCESSING.toString(), new EncodableFixedIntegerList(2, [0, 0, 0, 0, 0, 0, 0, 0]).withValidator(nullableBooleanAsTwoBitIntegerListValidator));
            fields.put(exports.UsTnField.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTnField.ADDITIONAL_DATA_PROCESSING_CONSENT.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTnField.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 1).withValidator(nonNullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTnField.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            fields.put(exports.UsTnField.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0).withValidator(nullableBooleanAsTwoBitIntegerValidator));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsTnCoreSegment '" + encodedString + "'");
            }
        }
    }

    class UsTnGpcSegment extends AbstractLazilyEncodableSegment {
        constructor(encodedString) {
            super();
            this.base64UrlEncoder = CompressedBase64UrlEncoder.getInstance();
            this.bitStringEncoder = BitStringEncoder.getInstance();
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        // overriden
        getFieldNames() {
            return USTN_GPC_SEGMENT_FIELD_NAMES;
        }
        // overriden
        initializeFields() {
            let fields = new EncodableBitStringFields();
            fields.put(exports.UsTnField.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
            fields.put(exports.UsTnField.GPC_SEGMENT_INCLUDED.toString(), new EncodableBoolean(true));
            fields.put(exports.UsTnField.GPC.toString(), new EncodableBoolean(false));
            return fields;
        }
        // overriden
        encodeSegment(fields) {
            let bitString = this.bitStringEncoder.encode(fields, this.getFieldNames());
            let encodedString = this.base64UrlEncoder.encode(bitString);
            return encodedString;
        }
        // overriden
        decodeSegment(encodedString, fields) {
            if (encodedString == null || encodedString.length === 0) {
                this.fields.reset(fields);
            }
            try {
                let bitString = this.base64UrlEncoder.decode(encodedString);
                this.bitStringEncoder.decode(bitString, this.getFieldNames(), fields);
            }
            catch (e) {
                throw new DecodingError("Unable to decode UsTnGpcSegment '" + encodedString + "'");
            }
        }
    }

    class UsTn extends AbstractLazilyEncodableSection {
        constructor(encodedString) {
            super();
            if (encodedString && encodedString.length > 0) {
                this.decode(encodedString);
            }
        }
        //Overriden
        getId() {
            return UsTn.ID;
        }
        //Overriden
        getName() {
            return UsTn.NAME;
        }
        //Override
        getVersion() {
            return UsTn.VERSION;
        }
        //Overriden
        initializeSegments() {
            let segments = [];
            segments.push(new UsTnCoreSegment());
            segments.push(new UsTnGpcSegment());
            return segments;
        }
        //Overriden
        decodeSection(encodedString) {
            let segments = this.initializeSegments();
            if (encodedString != null && encodedString.length !== 0) {
                let encodedSegments = encodedString.split(".");
                if (encodedSegments.length > 0) {
                    segments[0].decode(encodedSegments[0]);
                }
                if (encodedSegments.length > 1) {
                    segments[1].setFieldValue(exports.UsTnField.GPC_SEGMENT_INCLUDED, true);
                    segments[1].decode(encodedSegments[1]);
                }
                else {
                    segments[1].setFieldValue(exports.UsTnField.GPC_SEGMENT_INCLUDED, false);
                }
            }
            return segments;
        }
        // Overriden
        encodeSection(segments) {
            let encodedSegments = [];
            if (segments.length >= 1) {
                encodedSegments.push(segments[0].encode());
                if (segments.length >= 2 && segments[1].getFieldValue(exports.UsTnField.GPC_SEGMENT_INCLUDED) === true) {
                    encodedSegments.push(segments[1].encode());
                }
            }
            return encodedSegments.join(".");
        }
    }
    UsTn.ID = 22;
    UsTn.VERSION = 1;
    UsTn.NAME = "ustn";

    class Sections {
    }
    Sections.SECTION_ID_NAME_MAP = new Map([
        [TcfEuV2.ID, TcfEuV2.NAME],
        [TcfCaV1.ID, TcfCaV1.NAME],
        [UspV1.ID, UspV1.NAME],
        [UsNat.ID, UsNat.NAME],
        [UsCa.ID, UsCa.NAME],
        [UsVa.ID, UsVa.NAME],
        [UsCo.ID, UsCo.NAME],
        [UsUt.ID, UsUt.NAME],
        [UsCt.ID, UsCt.NAME],
        [UsFl.ID, UsFl.NAME],
        [UsMt.ID, UsMt.NAME],
        [UsOr.ID, UsOr.NAME],
        [UsTx.ID, UsTx.NAME],
        [UsDe.ID, UsDe.NAME],
        [UsIa.ID, UsIa.NAME],
        [UsNe.ID, UsNe.NAME],
        [UsNh.ID, UsNh.NAME],
        [UsNj.ID, UsNj.NAME],
        [UsTn.ID, UsTn.NAME],
    ]);
    Sections.SECTION_ORDER = [
        TcfEuV2.NAME,
        TcfCaV1.NAME,
        UspV1.NAME,
        UsNat.NAME,
        UsCa.NAME,
        UsVa.NAME,
        UsCo.NAME,
        UsUt.NAME,
        UsCt.NAME,
        UsFl.NAME,
        UsMt.NAME,
        UsOr.NAME,
        UsTx.NAME,
        UsDe.NAME,
        UsIa.NAME,
        UsNe.NAME,
        UsNh.NAME,
        UsNj.NAME,
        UsTn.NAME,
    ];

    class GppModel {
        constructor(encodedString) {
            this.sections = new Map();
            this.encodedString = null;
            this.decoded = true;
            this.dirty = false;
            if (encodedString) {
                this.decode(encodedString);
            }
        }
        setFieldValue(sectionName, fieldName, value) {
            if (!this.decoded) {
                this.sections = this.decodeModel(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            let section = null;
            if (!this.sections.has(sectionName)) {
                if (sectionName === TcfCaV1.NAME) {
                    section = new TcfCaV1();
                    this.sections.set(TcfCaV1.NAME, section);
                }
                else if (sectionName === TcfEuV2.NAME) {
                    section = new TcfEuV2();
                    this.sections.set(TcfEuV2.NAME, section);
                }
                else if (sectionName === UspV1.NAME) {
                    section = new UspV1();
                    this.sections.set(UspV1.NAME, section);
                }
                else if (sectionName === UsNat.NAME) {
                    section = new UsNat();
                    this.sections.set(UsNat.NAME, section);
                }
                else if (sectionName === UsCa.NAME) {
                    section = new UsCa();
                    this.sections.set(UsCa.NAME, section);
                }
                else if (sectionName === UsVa.NAME) {
                    section = new UsVa();
                    this.sections.set(UsVa.NAME, section);
                }
                else if (sectionName === UsCo.NAME) {
                    section = new UsCo();
                    this.sections.set(UsCo.NAME, section);
                }
                else if (sectionName === UsUt.NAME) {
                    section = new UsUt();
                    this.sections.set(UsUt.NAME, section);
                }
                else if (sectionName === UsCt.NAME) {
                    section = new UsCt();
                    this.sections.set(UsCt.NAME, section);
                }
                else if (sectionName === UsFl.NAME) {
                    section = new UsFl();
                    this.sections.set(UsFl.NAME, section);
                }
                else if (sectionName === UsMt.NAME) {
                    section = new UsMt();
                    this.sections.set(UsMt.NAME, section);
                }
                else if (sectionName === UsOr.NAME) {
                    section = new UsOr();
                    this.sections.set(UsOr.NAME, section);
                }
                else if (sectionName === UsTx.NAME) {
                    section = new UsTx();
                    this.sections.set(UsTx.NAME, section);
                }
                else if (sectionName === UsDe.NAME) {
                    section = new UsDe();
                    this.sections.set(UsDe.NAME, section);
                }
                else if (sectionName === UsIa.NAME) {
                    section = new UsIa();
                    this.sections.set(UsIa.NAME, section);
                }
                else if (sectionName === UsNe.NAME) {
                    section = new UsNe();
                    this.sections.set(UsNe.NAME, section);
                }
                else if (sectionName === UsNh.NAME) {
                    section = new UsNh();
                    this.sections.set(UsNh.NAME, section);
                }
                else if (sectionName === UsNj.NAME) {
                    section = new UsNj();
                    this.sections.set(UsNj.NAME, section);
                }
                else if (sectionName === UsTn.NAME) {
                    section = new UsTn();
                    this.sections.set(UsTn.NAME, section);
                }
            }
            else {
                section = this.sections.get(sectionName);
            }
            if (section) {
                section.setFieldValue(fieldName, value);
                this.dirty = true;
                section.setIsDirty(true);
            }
            else {
                throw new InvalidFieldError(sectionName + "." + fieldName + " not found");
            }
        }
        setFieldValueBySectionId(sectionId, fieldName, value) {
            this.setFieldValue(Sections.SECTION_ID_NAME_MAP.get(sectionId), fieldName, value);
        }
        getFieldValue(sectionName, fieldName) {
            if (!this.decoded) {
                this.sections = this.decodeModel(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            if (this.sections.has(sectionName)) {
                return this.sections.get(sectionName).getFieldValue(fieldName);
            }
            else {
                return null;
            }
        }
        getFieldValueBySectionId(sectionId, fieldName) {
            return this.getFieldValue(Sections.SECTION_ID_NAME_MAP.get(sectionId), fieldName);
        }
        hasField(sectionName, fieldName) {
            if (!this.decoded) {
                this.sections = this.decodeModel(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            if (this.sections.has(sectionName)) {
                return this.sections.get(sectionName).hasField(fieldName);
            }
            else {
                return false;
            }
        }
        hasFieldBySectionId(sectionId, fieldName) {
            return this.hasField(Sections.SECTION_ID_NAME_MAP.get(sectionId), fieldName);
        }
        hasSection(sectionName) {
            if (!this.decoded) {
                this.sections = this.decodeModel(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            return this.sections.has(sectionName);
        }
        hasSectionId(sectionId) {
            return this.hasSection(Sections.SECTION_ID_NAME_MAP.get(sectionId));
        }
        deleteSection(sectionName) {
            // lazily decode
            if (!this.decoded && this.encodedString != null && this.encodedString.length > 0) {
                this.decode(this.encodedString);
            }
            this.sections.delete(sectionName);
            this.dirty = true;
        }
        deleteSectionById(sectionId) {
            this.deleteSection(Sections.SECTION_ID_NAME_MAP.get(sectionId));
        }
        clear() {
            this.sections.clear();
            this.encodedString = "DBAA";
            this.decoded = false;
            this.dirty = false;
        }
        getHeader() {
            if (!this.decoded) {
                this.sections = this.decodeModel(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            let header = new HeaderV1();
            header.setFieldValue("SectionIds", this.getSectionIds());
            return header.toObj();
        }
        getSection(sectionName) {
            if (!this.decoded) {
                this.sections = this.decodeModel(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            if (this.sections.has(sectionName)) {
                return this.sections.get(sectionName).toObj();
            }
            else {
                return null;
            }
        }
        getSectionIds() {
            if (!this.decoded) {
                this.sections = this.decodeModel(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            let sectionIds = [];
            for (let i = 0; i < Sections.SECTION_ORDER.length; i++) {
                let sectionName = Sections.SECTION_ORDER[i];
                if (this.sections.has(sectionName)) {
                    let section = this.sections.get(sectionName);
                    sectionIds.push(section.getId());
                }
            }
            return sectionIds;
        }
        encodeModel(sections) {
            let encodedSections = [];
            let sectionIds = [];
            for (let i = 0; i < Sections.SECTION_ORDER.length; i++) {
                let sectionName = Sections.SECTION_ORDER[i];
                if (sections.has(sectionName)) {
                    let section = sections.get(sectionName);
                    section.setIsDirty(true);
                    encodedSections.push(section.encode());
                    sectionIds.push(section.getId());
                }
            }
            let header = new HeaderV1();
            header.setFieldValue("SectionIds", sectionIds);
            encodedSections.unshift(header.encode());
            return encodedSections.join("~");
        }
        decodeModel(str) {
            if (!str || str.length == 0 || str.startsWith("DB")) {
                let encodedSections = str.split("~");
                let sections = new Map();
                if (encodedSections[0].startsWith("D")) {
                    //GPP String
                    let header = new HeaderV1(encodedSections[0]);
                    let sectionIds = header.getFieldValue("SectionIds");
                    if (sectionIds.length !== encodedSections.length - 1) {
                        throw new DecodingError("Unable to decode '" +
                            str +
                            "'. The number of sections does not match the number of sections defined in the header.");
                    }
                    for (let i = 0; i < sectionIds.length; i++) {
                        let encodedSection = encodedSections[i + 1];
                        if (encodedSection.trim() === "") {
                            throw new DecodingError("Unable to decode '" + str + "'. Section " + (i + 1) + " is blank.");
                        }
                        if (sectionIds[i] === TcfCaV1.ID) {
                            let section = new TcfCaV1(encodedSections[i + 1]);
                            sections.set(TcfCaV1.NAME, section);
                        }
                        else if (sectionIds[i] === TcfEuV2.ID) {
                            let section = new TcfEuV2(encodedSections[i + 1]);
                            sections.set(TcfEuV2.NAME, section);
                        }
                        else if (sectionIds[i] === UspV1.ID) {
                            let section = new UspV1(encodedSections[i + 1]);
                            sections.set(UspV1.NAME, section);
                        }
                        else if (sectionIds[i] === UsNat.ID) {
                            let section = new UsNat(encodedSections[i + 1]);
                            sections.set(UsNat.NAME, section);
                        }
                        else if (sectionIds[i] === UsCa.ID) {
                            let section = new UsCa(encodedSections[i + 1]);
                            sections.set(UsCa.NAME, section);
                        }
                        else if (sectionIds[i] === UsVa.ID) {
                            let section = new UsVa(encodedSections[i + 1]);
                            sections.set(UsVa.NAME, section);
                        }
                        else if (sectionIds[i] === UsCo.ID) {
                            let section = new UsCo(encodedSections[i + 1]);
                            sections.set(UsCo.NAME, section);
                        }
                        else if (sectionIds[i] === UsUt.ID) {
                            let section = new UsUt(encodedSections[i + 1]);
                            sections.set(UsUt.NAME, section);
                        }
                        else if (sectionIds[i] === UsCt.ID) {
                            let section = new UsCt(encodedSections[i + 1]);
                            sections.set(UsCt.NAME, section);
                        }
                        else if (sectionIds[i] === UsFl.ID) {
                            let section = new UsFl(encodedSections[i + 1]);
                            sections.set(UsFl.NAME, section);
                        }
                        else if (sectionIds[i] === UsMt.ID) {
                            let section = new UsMt(encodedSections[i + 1]);
                            sections.set(UsMt.NAME, section);
                        }
                        else if (sectionIds[i] === UsOr.ID) {
                            let section = new UsOr(encodedSections[i + 1]);
                            sections.set(UsOr.NAME, section);
                        }
                        else if (sectionIds[i] === UsTx.ID) {
                            let section = new UsTx(encodedSections[i + 1]);
                            sections.set(UsTx.NAME, section);
                        }
                        else if (sectionIds[i] === UsDe.ID) {
                            let section = new UsDe(encodedSections[i + 1]);
                            sections.set(UsDe.NAME, section);
                        }
                        else if (sectionIds[i] === UsIa.ID) {
                            let section = new UsIa(encodedSections[i + 1]);
                            sections.set(UsIa.NAME, section);
                        }
                        else if (sectionIds[i] === UsNe.ID) {
                            let section = new UsNe(encodedSections[i + 1]);
                            sections.set(UsNe.NAME, section);
                        }
                        else if (sectionIds[i] === UsNh.ID) {
                            let section = new UsNh(encodedSections[i + 1]);
                            sections.set(UsNh.NAME, section);
                        }
                        else if (sectionIds[i] === UsNj.ID) {
                            let section = new UsNj(encodedSections[i + 1]);
                            sections.set(UsNj.NAME, section);
                        }
                        else if (sectionIds[i] === UsTn.ID) {
                            let section = new UsTn(encodedSections[i + 1]);
                            sections.set(UsTn.NAME, section);
                        }
                    }
                }
                return sections;
            }
            else if (str.startsWith("C")) {
                // old tcfeu only string
                let sections = new Map();
                let section = new TcfEuV2(str);
                sections.set(TcfEuV2.NAME, section);
                let header = new HeaderV1();
                header.setFieldValue(exports.HeaderV1Field.SECTION_IDS, [2]);
                sections.set(HeaderV1.NAME, section);
                return sections;
            }
            else {
                throw new DecodingError("Unable to decode '" + str + "'");
            }
        }
        encodeSection(sectionName) {
            if (!this.decoded) {
                this.sections = this.decodeModel(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            if (this.sections.has(sectionName)) {
                return this.sections.get(sectionName).encode();
            }
            else {
                return null;
            }
        }
        encodeSectionById(sectionId) {
            return this.encodeSection(Sections.SECTION_ID_NAME_MAP.get(sectionId));
        }
        decodeSection(sectionName, encodedString) {
            if (!this.decoded) {
                this.sections = this.decodeModel(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            let section = null;
            if (!this.sections.has(sectionName)) {
                if (sectionName === TcfCaV1.NAME) {
                    section = new TcfCaV1();
                    this.sections.set(TcfCaV1.NAME, section);
                }
                else if (sectionName === TcfEuV2.NAME) {
                    section = new TcfEuV2();
                    this.sections.set(TcfEuV2.NAME, section);
                }
                else if (sectionName === UspV1.NAME) {
                    section = new UspV1();
                    this.sections.set(UspV1.NAME, section);
                }
                else if (sectionName === UsNat.NAME) {
                    section = new UsNat();
                    this.sections.set(UsNat.NAME, section);
                }
                else if (sectionName === UsCa.NAME) {
                    section = new UsCa();
                    this.sections.set(UsCa.NAME, section);
                }
                else if (sectionName === UsVa.NAME) {
                    section = new UsVa();
                    this.sections.set(UsVa.NAME, section);
                }
                else if (sectionName === UsCo.NAME) {
                    section = new UsCo();
                    this.sections.set(UsCo.NAME, section);
                }
                else if (sectionName === UsUt.NAME) {
                    section = new UsUt();
                    this.sections.set(UsUt.NAME, section);
                }
                else if (sectionName === UsCt.NAME) {
                    section = new UsCt();
                    this.sections.set(UsCt.NAME, section);
                }
                else if (sectionName === UsFl.NAME) {
                    section = new UsFl();
                    this.sections.set(UsFl.NAME, section);
                }
                else if (sectionName === UsMt.NAME) {
                    section = new UsMt();
                    this.sections.set(UsMt.NAME, section);
                }
                else if (sectionName === UsOr.NAME) {
                    section = new UsOr();
                    this.sections.set(UsOr.NAME, section);
                }
                else if (sectionName === UsTx.NAME) {
                    section = new UsTx();
                    this.sections.set(UsTx.NAME, section);
                }
                else if (sectionName === UsDe.NAME) {
                    section = new UsDe();
                    this.sections.set(UsDe.NAME, section);
                }
                else if (sectionName === UsIa.NAME) {
                    section = new UsIa();
                    this.sections.set(UsIa.NAME, section);
                }
                else if (sectionName === UsNe.NAME) {
                    section = new UsNe();
                    this.sections.set(UsNe.NAME, section);
                }
                else if (sectionName === UsNh.NAME) {
                    section = new UsNh();
                    this.sections.set(UsNh.NAME, section);
                }
                else if (sectionName === UsNj.NAME) {
                    section = new UsNj();
                    this.sections.set(UsNj.NAME, section);
                }
                else if (sectionName === UsTn.NAME) {
                    section = new UsTn();
                    this.sections.set(UsTn.NAME, section);
                }
            }
            else {
                section = this.sections.get(sectionName);
            }
            if (section) {
                section.decode(encodedString);
                this.dirty = true;
            }
        }
        decodeSectionById(sectionId, encodedString) {
            this.decodeSection(Sections.SECTION_ID_NAME_MAP.get(sectionId), encodedString);
        }
        toObject() {
            if (!this.decoded) {
                this.sections = this.decodeModel(this.encodedString);
                this.dirty = false;
                this.decoded = true;
            }
            let obj = {};
            for (let i = 0; i < Sections.SECTION_ORDER.length; i++) {
                let sectionName = Sections.SECTION_ORDER[i];
                if (this.sections.has(sectionName)) {
                    obj[sectionName] = this.sections.get(sectionName).toObj();
                }
            }
            return obj;
        }
        encode() {
            if (this.encodedString == null || this.encodedString.length === 0 || this.dirty) {
                this.encodedString = this.encodeModel(this.sections);
                this.dirty = false;
                this.decoded = true;
            }
            return this.encodedString;
        }
        decode(encodedString) {
            this.encodedString = encodedString;
            this.dirty = false;
            this.decoded = false;
        }
    }

    /**
     * Class holds shareable data across cmp api and provides change event listener for GppModel.
     * Within the context of the CmpApi, this class acts much like a global state or database,
     * where CmpApi sets data and Commands read the data.
     */
    class CmpApiContext {
        constructor() {
            this.gppVersion = "1.1";
            this.supportedAPIs = [];
            this.eventQueue = new EventListenerQueue(this);
            this.cmpStatus = exports.CmpStatus.LOADING;
            this.cmpDisplayStatus = exports.CmpDisplayStatus.HIDDEN;
            this.signalStatus = exports.SignalStatus.NOT_READY;
            this.applicableSections = [];
            this.gppModel = new GppModel();
        }
        reset() {
            this.eventQueue.clear();
            this.cmpStatus = exports.CmpStatus.LOADING;
            this.cmpDisplayStatus = exports.CmpDisplayStatus.HIDDEN;
            this.signalStatus = exports.SignalStatus.NOT_READY;
            this.applicableSections = [];
            this.supportedAPIs = [];
            this.gppModel = new GppModel();
            delete this.cmpId;
            delete this.cmpVersion;
            delete this.eventStatus;
        }
    }

    class OptimizedFibonacciRangeEncoder {
        static encode(value) {
            //TODO: encoding the range before choosing the shortest is inefficient. There is probably a way
            //to identify in advance which will be shorter based on the array length and values
            let max = value.length > 0 ? value[value.length - 1] : 0;
            let rangeBitString = FibonacciIntegerRangeEncoder.encode(value);
            let rangeLength = rangeBitString.length;
            let bitFieldLength = max;
            if (rangeLength <= bitFieldLength) {
                return FixedIntegerEncoder.encode(max, 16) + "1" + rangeBitString;
            }
            else {
                let bits = [];
                let index = 0;
                for (let i = 0; i < max; i++) {
                    if (i == value[index] - 1) {
                        bits[i] = true;
                        index++;
                    }
                    else {
                        bits[i] = false;
                    }
                }
                return FixedIntegerEncoder.encode(max, 16) + "0" + FixedBitfieldEncoder.encode(bits, bitFieldLength);
            }
        }
        static decode(bitString) {
            if (!/^[0-1]*$/.test(bitString) || bitString.length < 2 || bitString.indexOf("11") !== bitString.length - 2) {
                throw new DecodingError("Undecodable FibonacciInteger '" + bitString + "'");
            }
            if (bitString.charAt(16) === "1") {
                return FibonacciIntegerRangeEncoder.decode(bitString.substring(17));
            }
            else {
                let value = [];
                let bits = FixedBitfieldEncoder.decode(bitString.substring(17));
                for (let i = 0; i < bits.length; i++) {
                    if (bits[i] === true) {
                        value.push(i + 1);
                    }
                }
                return value;
            }
        }
    }

    class OptimizedFixedRangeEncoder {
        static encode(value) {
            //TODO: encoding the range before choosing the shortest is inefficient. There is probably a way
            //to identify in advance which will be shorter based on the array length and values
            let max = value.length > 0 ? value[value.length - 1] : 0;
            let rangeBitString = FixedIntegerRangeEncoder.encode(value);
            let rangeLength = rangeBitString.length;
            let bitFieldLength = max;
            if (rangeLength <= bitFieldLength) {
                return FixedIntegerEncoder.encode(max, 16) + "1" + rangeBitString;
            }
            else {
                let bits = [];
                let index = 0;
                for (let i = 0; i < max; i++) {
                    if (i === value[index] - 1) {
                        bits[i] = true;
                        index++;
                    }
                    else {
                        bits[i] = false;
                    }
                }
                return FixedIntegerEncoder.encode(max, 16) + "0" + FixedBitfieldEncoder.encode(bits, bitFieldLength);
            }
        }
        static decode(bitString) {
            if (!/^[0-1]*$/.test(bitString) || bitString.length < 2 || bitString.indexOf("11") !== bitString.length - 2) {
                throw new DecodingError("Undecodable FibonacciInteger '" + bitString + "'");
            }
            if (bitString.charAt(16) === "1") {
                return FixedIntegerRangeEncoder.decode(bitString.substring(17));
            }
            else {
                let value = [];
                let bits = FixedBitfieldEncoder.decode(bitString.substring(17));
                for (let i = 0; i < bits.length; i++) {
                    if (bits[i] === true) {
                        value.push(i + 1);
                    }
                }
                return value;
            }
        }
    }

    class EncodableFibonacciInteger extends AbstractEncodableBitStringDataType {
        constructor(value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.setValue(value);
        }
        encode() {
            try {
                return FibonacciIntegerEncoder.encode(this.value);
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                this.value = FibonacciIntegerEncoder.decode(bitString);
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                let index = bitString.indexOf("11", fromIndex);
                if (index > 0) {
                    return StringUtil.substring(bitString, fromIndex, index + 2);
                }
                else {
                    return bitString;
                }
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
    }

    class EncodableOptimizedFibonacciRange extends AbstractEncodableBitStringDataType {
        constructor(value, hardFailIfMissing = true) {
            super(hardFailIfMissing);
            this.setValue(value);
        }
        encode() {
            try {
                //TODO: encoding the range before choosing the shortest is inefficient. There is probably a way
                //to identify in advance which will be shorter based on the array length and values
                let max = this.value.length > 0 ? this.value[this.value.length - 1] : 0;
                let rangeBitString = FibonacciIntegerRangeEncoder.encode(this.value);
                let rangeLength = rangeBitString.length;
                let bitFieldLength = max;
                if (rangeLength <= bitFieldLength) {
                    return FixedIntegerEncoder.encode(max, 16) + "1" + rangeBitString;
                }
                else {
                    let bits = [];
                    let index = 0;
                    for (let i = 0; i < max; i++) {
                        if (i == this.value[index] - 1) {
                            bits[i] = true;
                            index++;
                        }
                        else {
                            bits[i] = false;
                        }
                    }
                    return FixedIntegerEncoder.encode(max, 16) + "0" + FixedBitfieldEncoder.encode(bits, bitFieldLength);
                }
            }
            catch (e) {
                throw new EncodingError(e);
            }
        }
        decode(bitString) {
            try {
                if (bitString.charAt(16) === "1") {
                    this.value = FibonacciIntegerRangeEncoder.decode(bitString.substring(17));
                }
                else {
                    let value = [];
                    let bits = FixedBitfieldEncoder.decode(bitString.substring(17));
                    for (let i = 0; i < bits.length; i++) {
                        if (bits[i] === true) {
                            value.push(i + 1);
                        }
                    }
                    this.value = value;
                }
            }
            catch (e) {
                throw new DecodingError(e);
            }
        }
        substring(bitString, fromIndex) {
            try {
                let max = FixedIntegerEncoder.decode(StringUtil.substring(bitString, fromIndex, fromIndex + 16));
                if (bitString.charAt(fromIndex + 16) === "1") {
                    return (StringUtil.substring(bitString, fromIndex, fromIndex + 17) +
                        new EncodableFibonacciIntegerRange([]).substring(bitString, fromIndex + 17));
                }
                else {
                    return StringUtil.substring(bitString, fromIndex, fromIndex + 17 + max);
                }
            }
            catch (e) {
                throw new SubstringError(e);
            }
        }
        // Overriden
        getValue() {
            return [...super.getValue()];
        }
        // Overriden
        setValue(value) {
            super.setValue(Array.from(new Set(value)).sort((n1, n2) => n1 - n2));
        }
    }

    class JsonHttpClient {
        static absCall(url, body, sendCookies, timeout) {
            return new Promise((resolve, reject) => {
                const req = new XMLHttpRequest();
                const onLoad = () => {
                    // is the response done
                    if (req.readyState == XMLHttpRequest.DONE) {
                        /**
                         * For our purposes if it's not a 200 range response, then it's a
                         * failure.
                         */
                        if (req.status >= 200 && req.status < 300) {
                            let response = req.response;
                            if (typeof response === "string") {
                                try {
                                    response = JSON.parse(response);
                                }
                                catch (e) { }
                            }
                            resolve(response);
                        }
                        else {
                            reject(new Error(`HTTP Status: ${req.status} response type: ${req.responseType}`));
                        }
                    }
                };
                const onError = () => {
                    reject(new Error("error"));
                };
                const onAbort = () => {
                    reject(new Error("aborted"));
                };
                const onTimeout = () => {
                    reject(new Error("Timeout " + timeout + "ms " + url));
                };
                req.withCredentials = sendCookies;
                req.addEventListener("load", onLoad);
                req.addEventListener("error", onError);
                req.addEventListener("abort", onAbort);
                if (body === null) {
                    req.open("GET", url, true);
                }
                else {
                    req.open("POST", url, true);
                }
                req.responseType = "json";
                // IE has a problem if this is before the open
                req.timeout = timeout;
                req.ontimeout = onTimeout;
                req.send(body);
            });
        }
        /**
         * @static
         * @param {string} url - full path to POST to
         * @param {object} body - JSON object to post
         * @param {boolean} sendCookies - Whether or not to send the XMLHttpRequest with credentials or not
         * @param {number} [timeout] - optional timeout in milliseconds
         * @return {Promise<object>} - if the server responds the response will be returned here
         */
        static post(url, body, sendCookies = false, timeout = 0) {
            return this.absCall(url, JSON.stringify(body), sendCookies, timeout);
        }
        /**
         * @static
         * @param {string} url - full path to the json
         * @param {boolean} sendCookies - Whether or not to send the XMLHttpRequest with credentials or not
         * @param {number} [timeout] - optional timeout in milliseconds
         * @return {Promise<object>} - resolves with parsed JSON
         */
        static fetch(url, sendCookies = false, timeout = 0) {
            return this.absCall(url, null, sendCookies, timeout);
        }
    }

    /**
     * class for General GVL Errors
     *
     * @extends {Error}
     */
    class GVLError extends Error {
        /**
         * constructor - constructs a GVLError
         *
         * @param {string} msg - Error message to display
         * @return {undefined}
         */
        constructor(msg) {
            super(msg);
            this.name = "GVLError";
        }
    }

    class ConsentLanguages {
        has(key) {
            return ConsentLanguages.langSet.has(key);
        }
        forEach(callback) {
            ConsentLanguages.langSet.forEach(callback);
        }
        get size() {
            return ConsentLanguages.langSet.size;
        }
    }
    ConsentLanguages.langSet = new Set([
        'AR',
        'BG',
        'BS',
        'CA',
        'CS',
        'CY',
        'DA',
        'DE',
        'EL',
        'EN',
        'ES',
        'ET',
        'EU',
        'FI',
        'FR',
        'GL',
        'HE',
        'HR',
        'HU',
        'ID',
        'IT',
        'JA',
        'KA',
        'KO',
        'LT',
        'LV',
        'MK',
        'MS',
        'MT',
        'NL',
        'NO',
        'PL',
        'PT-BR',
        'PT-PT',
        'RO',
        'RU',
        'SK',
        'SL',
        'SQ',
        'SR-LATN',
        'SR-CYRL',
        'SV',
        'SW',
        'TH',
        'TL',
        'TR',
        'UK',
        'VI',
        'ZH',
    ]);

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    class GVLUrlConfig {
    }
    /**
     * class with utilities for managing the global vendor list.  Will use JSON to
     * fetch the vendor list from specified url and will serialize it into this
     * object and provide accessors.  Provides ways to group vendors on the list by
     * purpose and feature.
     */
    class GVL {
        constructor() {
            this.consentLanguages = new ConsentLanguages();
            this.language = GVL.DEFAULT_LANGUAGE;
            this.ready = false;
            this.languageFilename = "purposes-[LANG].json";
        }
        static fromVendorList(vendorList) {
            let gvl = new GVL();
            gvl.populate(vendorList);
            return gvl;
        }
        /**
         * **
         * @param {GVLConfig} - Configuration containing url configuration
         *
         * @throws {GVLError} - If the url is http[s]://vendorlist.consensu.org/...
         * this will throw an error.  IAB Europe requires that that CMPs and Vendors
         * cache their own copies of the GVL to minimize load on their
         * infrastructure.  For more information regarding caching of the
         * vendor-list.json, please see [the TCF documentation on 'Caching the Global
         * Vendor List'
         */
        static fromUrl(config) {
            return __awaiter(this, void 0, void 0, function* () {
                let baseUrl = config.baseUrl;
                if (!baseUrl || baseUrl.length === 0) {
                    throw new GVLError("Invalid baseUrl: '" + baseUrl + "'");
                }
                if (/^https?:\/\/vendorlist\.consensu\.org\//.test(baseUrl)) {
                    throw new GVLError("Invalid baseUrl!  You may not pull directly from vendorlist.consensu.org and must provide your own cache");
                }
                // if a trailing slash was forgotten
                if (baseUrl.length > 0 && baseUrl[baseUrl.length - 1] !== "/") {
                    baseUrl += "/";
                }
                let gvl = new GVL();
                gvl.baseUrl = baseUrl;
                if (config.languageFilename) {
                    gvl.languageFilename = config.languageFilename;
                }
                else {
                    gvl.languageFilename = "purposes-[LANG].json";
                }
                if (config.version > 0) {
                    let versionedFilename = config.versionedFilename;
                    if (!versionedFilename) {
                        versionedFilename = "archives/vendor-list-v[VERSION].json";
                    }
                    let url = baseUrl + versionedFilename.replace("[VERSION]", String(config.version));
                    gvl.populate((yield JsonHttpClient.fetch(url)));
                }
                else {
                    /**
                     * whatever it is (or isn't)... it doesn't matter we'll just get the latest.
                     */
                    let latestFilename = config.latestFilename;
                    if (!latestFilename) {
                        latestFilename = "vendor-list.json";
                    }
                    let url = baseUrl + latestFilename;
                    gvl.populate((yield JsonHttpClient.fetch(url)));
                }
                return gvl;
            });
        }
        /**
         * changeLanguage - retrieves the purpose language translation and sets the
         * internal language variable
         *
         * @param {string} lang - ISO 639-1 langauge code to change language to
         * @return {Promise<void | GVLError>} - returns the `readyPromise` and
         * resolves when this GVL is populated with the data from the language file.
         */
        changeLanguage(lang) {
            return __awaiter(this, void 0, void 0, function* () {
                const langUpper = lang.toUpperCase();
                if (this.consentLanguages.has(langUpper)) {
                    if (langUpper !== this.language) {
                        this.language = langUpper;
                        const url = this.baseUrl + this.languageFilename.replace("[LANG]", lang);
                        try {
                            this.populate((yield JsonHttpClient.fetch(url)));
                        }
                        catch (err) {
                            throw new GVLError("unable to load language: " + err.message);
                        }
                    }
                }
                else {
                    throw new GVLError(`unsupported language ${lang}`);
                }
            });
        }
        /**
         * getJson - Method for getting the JSON that was downloaded to created this
         * `GVL` object
         *
         * @return {VendorList} - The basic JSON structure without the extra
         * functionality and methods of this class.
         */
        getJson() {
            return JSON.parse(JSON.stringify({
                gvlSpecificationVersion: this.gvlSpecificationVersion,
                vendorListVersion: this.vendorListVersion,
                tcfPolicyVersion: this.tcfPolicyVersion,
                lastUpdated: this.lastUpdated,
                purposes: this.purposes,
                specialPurposes: this.specialPurposes,
                features: this.features,
                specialFeatures: this.specialFeatures,
                stacks: this.stacks,
                dataCategories: this.dataCategories,
                vendors: this.fullVendorList,
            }));
        }
        isVendorList(gvlObject) {
            return gvlObject !== undefined && gvlObject.vendors !== undefined;
        }
        populate(gvlObject) {
            /**
             * these are populated regardless of whether it's a Declarations file or
             * a VendorList
             */
            this.purposes = gvlObject.purposes;
            this.specialPurposes = gvlObject.specialPurposes;
            this.features = gvlObject.features;
            this.specialFeatures = gvlObject.specialFeatures;
            this.stacks = gvlObject.stacks;
            this.dataCategories = gvlObject.dataCategories;
            if (this.isVendorList(gvlObject)) {
                this.gvlSpecificationVersion = gvlObject.gvlSpecificationVersion;
                this.tcfPolicyVersion = gvlObject.tcfPolicyVersion;
                this.vendorListVersion = gvlObject.vendorListVersion;
                this.lastUpdated = gvlObject.lastUpdated;
                if (typeof this.lastUpdated === "string") {
                    this.lastUpdated = new Date(this.lastUpdated);
                }
                this.vendors = gvlObject.vendors;
                this.fullVendorList = gvlObject.vendors;
                this.mapVendors();
                this.ready = true;
            }
        }
        mapVendors(vendorIds) {
            // create new instances of the maps
            this.byPurposeVendorMap = {};
            this.bySpecialPurposeVendorMap = {};
            this.byFeatureVendorMap = {};
            this.bySpecialFeatureVendorMap = {};
            // initializes data structure for purpose map
            Object.keys(this.purposes).forEach((purposeId) => {
                this.byPurposeVendorMap[purposeId] = {
                    legInt: new Set(),
                    impCons: new Set(),
                    consent: new Set(),
                    flexible: new Set(),
                };
            });
            // initializes data structure for special purpose map
            Object.keys(this.specialPurposes).forEach((purposeId) => {
                this.bySpecialPurposeVendorMap[purposeId] = new Set();
            });
            // initializes data structure for feature map
            Object.keys(this.features).forEach((featureId) => {
                this.byFeatureVendorMap[featureId] = new Set();
            });
            // initializes data structure for feature map
            Object.keys(this.specialFeatures).forEach((featureId) => {
                this.bySpecialFeatureVendorMap[featureId] = new Set();
            });
            if (!Array.isArray(vendorIds)) {
                vendorIds = Object.keys(this.fullVendorList).map((vId) => +vId);
            }
            this.vendorIds = new Set(vendorIds);
            // assigns vendor ids to their respective maps
            this.vendors = vendorIds.reduce((vendors, vendorId) => {
                const vendor = this.vendors[String(vendorId)];
                if (vendor && vendor.deletedDate === undefined) {
                    vendor.purposes.forEach((purposeId) => {
                        const purpGroup = this.byPurposeVendorMap[String(purposeId)];
                        purpGroup.consent.add(vendorId);
                    });
                    vendor.specialPurposes.forEach((purposeId) => {
                        this.bySpecialPurposeVendorMap[String(purposeId)].add(vendorId);
                    });
                    if (vendor.legIntPurposes) {
                        vendor.legIntPurposes.forEach((purposeId) => {
                            this.byPurposeVendorMap[String(purposeId)].legInt.add(vendorId);
                        });
                    }
                    // canada has added impConsPurposes in lieu of europe's legIntPurposes
                    if (vendor.impConsPurposes) {
                        vendor.impConsPurposes.forEach((purposeId) => {
                            this.byPurposeVendorMap[String(purposeId)].impCons.add(vendorId);
                        });
                    }
                    // could not be there
                    if (vendor.flexiblePurposes) {
                        vendor.flexiblePurposes.forEach((purposeId) => {
                            this.byPurposeVendorMap[String(purposeId)].flexible.add(vendorId);
                        });
                    }
                    vendor.features.forEach((featureId) => {
                        this.byFeatureVendorMap[String(featureId)].add(vendorId);
                    });
                    vendor.specialFeatures.forEach((featureId) => {
                        this.bySpecialFeatureVendorMap[String(featureId)].add(vendorId);
                    });
                    vendors[vendorId] = vendor;
                }
                return vendors;
            }, {});
        }
        getFilteredVendors(purposeOrFeature, id, subType, special) {
            const properPurposeOrFeature = purposeOrFeature.charAt(0).toUpperCase() + purposeOrFeature.slice(1);
            let vendorSet;
            const retr = {};
            if (purposeOrFeature === "purpose" && subType) {
                vendorSet = this["by" + properPurposeOrFeature + "VendorMap"][String(id)][subType];
            }
            else {
                vendorSet = this["by" + (special ? "Special" : "") + properPurposeOrFeature + "VendorMap"][String(id)];
            }
            vendorSet.forEach((vendorId) => {
                retr[String(vendorId)] = this.vendors[String(vendorId)];
            });
            return retr;
        }
        /**
         * getVendorsWithConsentPurpose
         *
         * @param {number} purposeId
         * @return {IntMap<Vendor>} - list of vendors that have declared the consent purpose id
         */
        getVendorsWithConsentPurpose(purposeId) {
            return this.getFilteredVendors("purpose", purposeId, "consent");
        }
        /**
         * getVendorsWithLegIntPurpose
         *
         * @param {number} purposeId
         * @return {IntMap<Vendor>} - list of vendors that have declared the legInt (Legitimate Interest) purpose id
         */
        getVendorsWithLegIntPurpose(purposeId) {
            return this.getFilteredVendors("purpose", purposeId, "legInt");
        }
        /**
         * getVendorsWithFlexiblePurpose
         *
         * @param {number} purposeId
         * @return {IntMap<Vendor>} - list of vendors that have declared the flexible purpose id
         */
        getVendorsWithFlexiblePurpose(purposeId) {
            return this.getFilteredVendors("purpose", purposeId, "flexible");
        }
        /**
         * getVendorsWithSpecialPurpose
         *
         * @param {number} specialPurposeId
         * @return {IntMap<Vendor>} - list of vendors that have declared the special purpose id
         */
        getVendorsWithSpecialPurpose(specialPurposeId) {
            return this.getFilteredVendors("purpose", specialPurposeId, undefined, true);
        }
        /**
         * getVendorsWithFeature
         *
         * @param {number} featureId
         * @return {IntMap<Vendor>} - list of vendors that have declared the feature id
         */
        getVendorsWithFeature(featureId) {
            return this.getFilteredVendors("feature", featureId);
        }
        /**
         * getVendorsWithSpecialFeature
         *
         * @param {number} specialFeatureId
         * @return {IntMap<Vendor>} - list of vendors that have declared the special feature id
         */
        getVendorsWithSpecialFeature(specialFeatureId) {
            return this.getFilteredVendors("feature", specialFeatureId, undefined, true);
        }
        /**
         * narrowVendorsTo - narrows vendors represented in this GVL to the list of ids passed in
         *
         * @param {number[]} vendorIds - list of ids to narrow this GVL to
         * @return {void}
         */
        narrowVendorsTo(vendorIds) {
            this.mapVendors(vendorIds);
        }
        /**
         * isReady - Whether or not this instance is ready to be used.  This will be
         * immediately and synchronously true if a vendorlist object is passed into
         * the constructor or once the JSON vendorllist is retrieved.
         *
         * @return {boolean} whether or not the instance is ready to be interacted
         * with and all the data is populated
         */
        get isReady() {
            return this.ready;
        }
        static isInstanceOf(questionableInstance) {
            const isSo = typeof questionableInstance === "object";
            return isSo && typeof questionableInstance.narrowVendorsTo === "function";
        }
    }
    GVL.DEFAULT_LANGUAGE = "EN";

    class CmpApi {
        /**
         * @param {number} cmpId - IAB assigned CMP ID
         * @param {number} cmpVersion - integer version of the CMP
         * @param {CustomCommands} [customCommands] - custom commands from the cmp
         */
        constructor(cmpId, cmpVersion, customCommands) {
            this.cmpApiContext = new CmpApiContext();
            this.cmpApiContext.cmpId = cmpId;
            this.cmpApiContext.cmpVersion = cmpVersion;
            this.callResponder = new CallResponder(this.cmpApiContext, customCommands);
        }
        fireEvent(eventName, value) {
            this.cmpApiContext.eventQueue.exec(eventName, value);
        }
        fireErrorEvent(value) {
            this.cmpApiContext.eventQueue.exec("error", value);
        }
        fireSectionChange(value) {
            this.cmpApiContext.eventQueue.exec("sectionChange", value);
        }
        getEventStatus() {
            return this.cmpApiContext.eventStatus;
        }
        setEventStatus(eventStatus) {
            this.cmpApiContext.eventStatus = eventStatus;
        }
        getCmpStatus() {
            return this.cmpApiContext.cmpStatus;
        }
        setCmpStatus(cmpStatus) {
            this.cmpApiContext.cmpStatus = cmpStatus;
            this.cmpApiContext.eventQueue.exec("cmpStatus", cmpStatus);
        }
        getCmpDisplayStatus() {
            return this.cmpApiContext.cmpDisplayStatus;
        }
        setCmpDisplayStatus(cmpDisplayStatus) {
            this.cmpApiContext.cmpDisplayStatus = cmpDisplayStatus;
            this.cmpApiContext.eventQueue.exec("cmpDisplayStatus", cmpDisplayStatus);
        }
        getSignalStatus() {
            return this.cmpApiContext.signalStatus;
        }
        setSignalStatus(signalStatus) {
            this.cmpApiContext.signalStatus = signalStatus;
            this.cmpApiContext.eventQueue.exec("signalStatus", signalStatus);
        }
        getApplicableSections() {
            return this.cmpApiContext.applicableSections;
        }
        setApplicableSections(applicableSections) {
            this.cmpApiContext.applicableSections = applicableSections;
        }
        getSupportedAPIs() {
            return this.cmpApiContext.supportedAPIs;
        }
        setSupportedAPIs(supportedAPIs) {
            this.cmpApiContext.supportedAPIs = supportedAPIs;
        }
        setGppString(encodedGppString) {
            this.cmpApiContext.gppModel.decode(encodedGppString);
        }
        getGppString() {
            return this.cmpApiContext.gppModel.encode();
        }
        setSectionString(sectionName, encodedSectionString) {
            this.cmpApiContext.gppModel.decodeSection(sectionName, encodedSectionString);
        }
        setSectionStringById(sectionId, encodedSectionString) {
            this.setSectionString(Sections.SECTION_ID_NAME_MAP.get(sectionId), encodedSectionString);
        }
        getSectionString(sectionName) {
            return this.cmpApiContext.gppModel.encodeSection(sectionName);
        }
        getSectionStringById(sectionId) {
            return this.getSectionString(Sections.SECTION_ID_NAME_MAP.get(sectionId));
        }
        setFieldValue(sectionName, fieldName, value) {
            this.cmpApiContext.gppModel.setFieldValue(sectionName, fieldName, value);
        }
        setFieldValueBySectionId(sectionId, fieldName, value) {
            this.setFieldValue(Sections.SECTION_ID_NAME_MAP.get(sectionId), fieldName, value);
        }
        getFieldValue(sectionName, fieldName) {
            return this.cmpApiContext.gppModel.getFieldValue(sectionName, fieldName);
        }
        getFieldValueBySectionId(sectionId, fieldName) {
            return this.getFieldValue(Sections.SECTION_ID_NAME_MAP.get(sectionId), fieldName);
        }
        getSection(sectionName) {
            return this.cmpApiContext.gppModel.getSection(sectionName);
        }
        getSectionById(sectionId) {
            return this.getSection(Sections.SECTION_ID_NAME_MAP.get(sectionId));
        }
        hasSection(sectionName) {
            return this.cmpApiContext.gppModel.hasSection(sectionName);
        }
        hasSectionId(sectionId) {
            return this.hasSection(Sections.SECTION_ID_NAME_MAP.get(sectionId));
        }
        deleteSection(sectionName) {
            this.cmpApiContext.gppModel.deleteSection(sectionName);
        }
        deleteSectionById(sectionId) {
            this.deleteSection(Sections.SECTION_ID_NAME_MAP.get(sectionId));
        }
        clear() {
            this.cmpApiContext.gppModel.clear();
        }
        getObject() {
            return this.cmpApiContext.gppModel.toObject();
        }
        getGvlFromVendorList(vendorList) {
            return GVL.fromVendorList(vendorList);
        }
        getGvlFromUrl(gvlUrlConfig) {
            return __awaiter(this, void 0, void 0, function* () {
                return GVL.fromUrl(gvlUrlConfig);
            });
        }
    }

    exports.AbstractBase64UrlEncoder = AbstractBase64UrlEncoder;
    exports.AbstractEncodableBitStringDataType = AbstractEncodableBitStringDataType;
    exports.AbstractLazilyEncodableSection = AbstractLazilyEncodableSection;
    exports.AbstractLazilyEncodableSegment = AbstractLazilyEncodableSegment;
    exports.AddEventListenerCommand = AddEventListenerCommand;
    exports.BitStringEncoder = BitStringEncoder;
    exports.BooleanEncoder = BooleanEncoder;
    exports.CallResponder = CallResponder;
    exports.CmpApi = CmpApi;
    exports.CmpApiContext = CmpApiContext;
    exports.Command = Command;
    exports.CommandMap = CommandMap;
    exports.CompressedBase64UrlEncoder = CompressedBase64UrlEncoder;
    exports.ConsentLanguages = ConsentLanguages;
    exports.DatetimeEncoder = DatetimeEncoder;
    exports.DecodingError = DecodingError;
    exports.EncodableArrayOfFixedIntegerRanges = EncodableArrayOfFixedIntegerRanges;
    exports.EncodableBitStringFields = EncodableBitStringFields;
    exports.EncodableBoolean = EncodableBoolean;
    exports.EncodableDatetime = EncodableDatetime;
    exports.EncodableFibonacciInteger = EncodableFibonacciInteger;
    exports.EncodableFibonacciIntegerRange = EncodableFibonacciIntegerRange;
    exports.EncodableFixedBitfield = EncodableFixedBitfield;
    exports.EncodableFixedInteger = EncodableFixedInteger;
    exports.EncodableFixedIntegerList = EncodableFixedIntegerList;
    exports.EncodableFixedIntegerRange = EncodableFixedIntegerRange;
    exports.EncodableFixedString = EncodableFixedString;
    exports.EncodableFlexibleBitfield = EncodableFlexibleBitfield;
    exports.EncodableOptimizedFibonacciRange = EncodableOptimizedFibonacciRange;
    exports.EncodableOptimizedFixedRange = EncodableOptimizedFixedRange;
    exports.EncodingError = EncodingError;
    exports.EventData = EventData;
    exports.EventListenerQueue = EventListenerQueue;
    exports.FibonacciIntegerEncoder = FibonacciIntegerEncoder;
    exports.FibonacciIntegerRangeEncoder = FibonacciIntegerRangeEncoder;
    exports.FixedBitfieldEncoder = FixedBitfieldEncoder;
    exports.FixedIntegerEncoder = FixedIntegerEncoder;
    exports.FixedIntegerListEncoder = FixedIntegerListEncoder;
    exports.FixedIntegerRangeEncoder = FixedIntegerRangeEncoder;
    exports.FixedStringEncoder = FixedStringEncoder;
    exports.GVL = GVL;
    exports.GVLError = GVLError;
    exports.GVLUrlConfig = GVLUrlConfig;
    exports.GenericFields = GenericFields;
    exports.GetFieldCommand = GetFieldCommand;
    exports.GetSectionCommand = GetSectionCommand;
    exports.GppModel = GppModel;
    exports.HEADER_CORE_SEGMENT_FIELD_NAMES = HEADER_CORE_SEGMENT_FIELD_NAMES;
    exports.HasSectionCommand = HasSectionCommand;
    exports.HeaderV1 = HeaderV1;
    exports.HeaderV1CoreSegment = HeaderV1CoreSegment;
    exports.InvalidFieldError = InvalidFieldError;
    exports.JsonHttpClient = JsonHttpClient;
    exports.OptimizedFibonacciRangeEncoder = OptimizedFibonacciRangeEncoder;
    exports.OptimizedFixedRangeEncoder = OptimizedFixedRangeEncoder;
    exports.PingCommand = PingCommand;
    exports.PingData = PingData;
    exports.RangeEntry = RangeEntry;
    exports.RemoveEventListenerCommand = RemoveEventListenerCommand;
    exports.Sections = Sections;
    exports.StringUtil = StringUtil;
    exports.SubstringError = SubstringError;
    exports.TCFCAV1_CORE_SEGMENT_FIELD_NAMES = TCFCAV1_CORE_SEGMENT_FIELD_NAMES;
    exports.TCFCAV1_DISCLOSED_VENDORS_SEGMENT_FIELD_NAMES = TCFCAV1_DISCLOSED_VENDORS_SEGMENT_FIELD_NAMES;
    exports.TCFCAV1_PUBLISHER_PURPOSES_SEGMENT_FIELD_NAMES = TCFCAV1_PUBLISHER_PURPOSES_SEGMENT_FIELD_NAMES;
    exports.TCFEUV2_CORE_SEGMENT_FIELD_NAMES = TCFEUV2_CORE_SEGMENT_FIELD_NAMES;
    exports.TCFEUV2_PUBLISHER_PURPOSES_SEGMENT_FIELD_NAMES = TCFEUV2_PUBLISHER_PURPOSES_SEGMENT_FIELD_NAMES;
    exports.TCFEUV2_VENDORS_ALLOWED_SEGMENT_FIELD_NAMES = TCFEUV2_VENDORS_ALLOWED_SEGMENT_FIELD_NAMES;
    exports.TCFEUV2_VENDORS_DISCLOSED_SEGMENT_FIELD_NAMES = TCFEUV2_VENDORS_DISCLOSED_SEGMENT_FIELD_NAMES;
    exports.TcfCaV1 = TcfCaV1;
    exports.TcfCaV1CoreSegment = TcfCaV1CoreSegment;
    exports.TcfCaV1DisclosedVendorsSegment = TcfCaV1DisclosedVendorsSegment;
    exports.TcfCaV1PublisherPurposesSegment = TcfCaV1PublisherPurposesSegment;
    exports.TcfEuV2 = TcfEuV2;
    exports.TcfEuV2CoreSegment = TcfEuV2CoreSegment;
    exports.TcfEuV2PublisherPurposesSegment = TcfEuV2PublisherPurposesSegment;
    exports.TcfEuV2VendorsAllowedSegment = TcfEuV2VendorsAllowedSegment;
    exports.TraditionalBase64UrlEncoder = TraditionalBase64UrlEncoder;
    exports.USCA_CORE_SEGMENT_FIELD_NAMES = USCA_CORE_SEGMENT_FIELD_NAMES;
    exports.USCA_GPC_SEGMENT_FIELD_NAMES = USCA_GPC_SEGMENT_FIELD_NAMES;
    exports.USCO_CORE_SEGMENT_FIELD_NAMES = USCO_CORE_SEGMENT_FIELD_NAMES;
    exports.USCO_GPC_SEGMENT_FIELD_NAMES = USCO_GPC_SEGMENT_FIELD_NAMES;
    exports.USCT_CORE_SEGMENT_FIELD_NAMES = USCT_CORE_SEGMENT_FIELD_NAMES;
    exports.USCT_GPC_SEGMENT_FIELD_NAMES = USCT_GPC_SEGMENT_FIELD_NAMES;
    exports.USDE_CORE_SEGMENT_FIELD_NAMES = USDE_CORE_SEGMENT_FIELD_NAMES;
    exports.USDE_GPC_SEGMENT_FIELD_NAMES = USDE_GPC_SEGMENT_FIELD_NAMES;
    exports.USFL_CORE_SEGMENT_FIELD_NAMES = USFL_CORE_SEGMENT_FIELD_NAMES;
    exports.USIA_CORE_SEGMENT_FIELD_NAMES = USIA_CORE_SEGMENT_FIELD_NAMES;
    exports.USIA_GPC_SEGMENT_FIELD_NAMES = USIA_GPC_SEGMENT_FIELD_NAMES;
    exports.USMT_CORE_SEGMENT_FIELD_NAMES = USMT_CORE_SEGMENT_FIELD_NAMES;
    exports.USMT_GPC_SEGMENT_FIELD_NAMES = USMT_GPC_SEGMENT_FIELD_NAMES;
    exports.USNAT_CORE_SEGMENT_FIELD_NAMES = USNAT_CORE_SEGMENT_FIELD_NAMES;
    exports.USNAT_GPC_SEGMENT_FIELD_NAMES = USNAT_GPC_SEGMENT_FIELD_NAMES;
    exports.USNE_CORE_SEGMENT_FIELD_NAMES = USNE_CORE_SEGMENT_FIELD_NAMES;
    exports.USNE_GPC_SEGMENT_FIELD_NAMES = USNE_GPC_SEGMENT_FIELD_NAMES;
    exports.USNH_CORE_SEGMENT_FIELD_NAMES = USNH_CORE_SEGMENT_FIELD_NAMES;
    exports.USNH_GPC_SEGMENT_FIELD_NAMES = USNH_GPC_SEGMENT_FIELD_NAMES;
    exports.USNJ_CORE_SEGMENT_FIELD_NAMES = USNJ_CORE_SEGMENT_FIELD_NAMES;
    exports.USNJ_GPC_SEGMENT_FIELD_NAMES = USNJ_GPC_SEGMENT_FIELD_NAMES;
    exports.USOR_CORE_SEGMENT_FIELD_NAMES = USOR_CORE_SEGMENT_FIELD_NAMES;
    exports.USOR_GPC_SEGMENT_FIELD_NAMES = USOR_GPC_SEGMENT_FIELD_NAMES;
    exports.USPV1_CORE_SEGMENT_FIELD_NAMES = USPV1_CORE_SEGMENT_FIELD_NAMES;
    exports.USTN_CORE_SEGMENT_FIELD_NAMES = USTN_CORE_SEGMENT_FIELD_NAMES;
    exports.USTN_GPC_SEGMENT_FIELD_NAMES = USTN_GPC_SEGMENT_FIELD_NAMES;
    exports.USTX_CORE_SEGMENT_FIELD_NAMES = USTX_CORE_SEGMENT_FIELD_NAMES;
    exports.USTX_GPC_SEGMENT_FIELD_NAMES = USTX_GPC_SEGMENT_FIELD_NAMES;
    exports.USUT_CORE_SEGMENT_FIELD_NAMES = USUT_CORE_SEGMENT_FIELD_NAMES;
    exports.USVA_CORE_SEGMENT_FIELD_NAMES = USVA_CORE_SEGMENT_FIELD_NAMES;
    exports.UnencodableCharacter = UnencodableCharacter;
    exports.UnencodableInteger = UnencodableInteger;
    exports.UsCa = UsCa;
    exports.UsCaCoreSegment = UsCaCoreSegment;
    exports.UsCaGpcSegment = UsCaGpcSegment;
    exports.UsCo = UsCo;
    exports.UsCoCoreSegment = UsCoCoreSegment;
    exports.UsCoGpcSegment = UsCoGpcSegment;
    exports.UsCt = UsCt;
    exports.UsCtCoreSegment = UsCtCoreSegment;
    exports.UsCtGpcSegment = UsCtGpcSegment;
    exports.UsDe = UsDe;
    exports.UsDeCoreSegment = UsDeCoreSegment;
    exports.UsDeGpcSegment = UsDeGpcSegment;
    exports.UsFl = UsFl;
    exports.UsFlCoreSegment = UsFlCoreSegment;
    exports.UsIa = UsIa;
    exports.UsIaCoreSegment = UsIaCoreSegment;
    exports.UsIaGpcSegment = UsIaGpcSegment;
    exports.UsMt = UsMt;
    exports.UsMtCoreSegment = UsMtCoreSegment;
    exports.UsMtGpcSegment = UsMtGpcSegment;
    exports.UsNat = UsNat;
    exports.UsNatCoreSegment = UsNatCoreSegment;
    exports.UsNatGpcSegment = UsNatGpcSegment;
    exports.UsNe = UsNe;
    exports.UsNeCoreSegment = UsNeCoreSegment;
    exports.UsNeGpcSegment = UsNeGpcSegment;
    exports.UsNh = UsNh;
    exports.UsNhCoreSegment = UsNhCoreSegment;
    exports.UsNhGpcSegment = UsNhGpcSegment;
    exports.UsNj = UsNj;
    exports.UsNjCoreSegment = UsNjCoreSegment;
    exports.UsNjGpcSegment = UsNjGpcSegment;
    exports.UsOrCoreSegment = UsOrCoreSegment;
    exports.UsOrGpcSegment = UsOrGpcSegment;
    exports.UsTn = UsTn;
    exports.UsTnCoreSegment = UsTnCoreSegment;
    exports.UsTnGpcSegment = UsTnGpcSegment;
    exports.UsTx = UsTx;
    exports.UsTxCoreSegment = UsTxCoreSegment;
    exports.UsTxGpcSegment = UsTxGpcSegment;
    exports.UsUt = UsUt;
    exports.UsUtCoreSegment = UsUtCoreSegment;
    exports.UsVa = UsVa;
    exports.UsVaCoreSegment = UsVaCoreSegment;
    exports.UspV1 = UspV1;
    exports.UspV1CoreSegment = UspV1CoreSegment;
    exports.ValidationError = ValidationError;

}));
//# sourceMappingURL=iabgpp-es.js.map
