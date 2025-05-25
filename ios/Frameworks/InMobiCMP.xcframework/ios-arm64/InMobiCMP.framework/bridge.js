// MARK: - Native Bridge

/** Utility - check if an object is valid */
var isObjValid = function(obj) {
    if ((typeof(obj) != "undefined") && (obj != null)) return true;
    return false;
};

var isFunction = (obj) => {
    return typeof(obj) === 'function'
}

var isString = (obj) => {
    return typeof(obj) === 'string'
}

class NativeCommandQueue {
    
    constructor() {
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeMessageHandler) {
            this.nativeMessageHandler = window.webkit.messageHandlers.nativeMessageHandler;
        }
        /** A Queue of Calls to the Native SDK that still need execution */
        this.nativeCallInFlight = false;
        /** Identifies if a native call is currently in progress */
        this.nativeCallQueue = [];
    }
    
    add(bridgeCall) {
        // add call to queue
        if (this.nativeCallInFlight) {
            // call pending, queue up request
            this.nativeCallQueue.push(bridgeCall);
        } else {
            // no call currently in process, execute it directly
            this.nativeCallInFlight = true;
            if (!isObjValid(this.nativeMessageHandler)) {
                window.location = bridgeCall;
            }
            else {
                this.nativeMessageHandler.postMessage(bridgeCall);
            }
        }
    }
    
    complete(cmd) {
        if (this.nativeCallQueue.length == 0) {
            this.nativeCallInFlight = false;
            return;
        }
        // still have something to do
        var bridgeCall = this.nativeCallQueue.shift();
        if (!isObjValid(this.nativeMessageHandler)) {
            window.location = bridgeCall;
        }
        else {
            this.nativeMessageHandler.postMessage(bridgeCall);
        }
    }
}

class NativeBridge {
    constructor(scheme) {
        this.urlScheme = isString(scheme) ? scheme : "InMobiCMPGPP";
        this.nativeCommandQueue = new NativeCommandQueue();
    }
    
    executeNativeCall (cmd) {
        
        if (!isString(cmd)) { return }
        
        if (!isObjValid(this.nativeCommandQueue.nativeMessageHandler)) {
            var bridgeCall = this.urlScheme + "://" + cmd;
            var value;
            var firstArg = true;
            for (var i = 1; i < arguments.length; i += 2) {
                value = arguments[i + 1];
                if (value == null) {
                    // no value, ignore the property
                    continue;
                }
                // add the correct separator to the name/value pairs
                if (firstArg) {
                    bridgeCall += "?";
                    firstArg = false;
                }
                else {
                    bridgeCall += "&";
                }
                bridgeCall += arguments[i] + "=" + escape(value);
            }
            this.nativeCommandQueue.add(bridgeCall);
        }
        else {
            var bridgeCall = {};
            bridgeCall["command"] = cmd;
            bridgeCall["scheme"] = this.urlScheme;
            var params = {};
            for (var i = 1; i < arguments.length; i += 2) {
                value = arguments[i + 1];
                if (value == null) {
                    // no value, ignore the property
                    continue;
                }
                params[arguments[i]] = "" + value;
            }
            bridgeCall["params"] = params;
            
            this.nativeCommandQueue.add(bridgeCall);
        }
        return "OK";
    };
    
    nativeCallComplete (cmd) {
        // anything left to do?
        this.nativeCommandQueue.complete(cmd);
        return "OK";
    };
};

// MARK: - Utility functions

function objectToArray(object) {
    let args = [];
    for (const property in object) {
        args.push(...[property, object[property]]);
    }
    return args;
}

function jsonToBase64(jsonObject) {
    try {
        // Step 1: Convert JSON object to a JSON string
        var jsonString = JSON.stringify(jsonObject);
        // Step 2: Convert JSON string to Base64
        var base64String = btoa(jsonString);
        return base64String;
    } catch (error) {
        console.error("Error converting JSON to Base64: " + error);
        return null;
    }
}

// MARK: - CMP JS

// MARK: CMP Initialization
const cmpApi = new iabgpp.CmpApi(10, 50); // CMP ID, CMP Version

//cmpApi.setFieldValue("uspv1", "OptOutSale", 2);
//cmpApi.setFieldValue("usnatv1", "SharingNotice", 2);
//cmpApi.setFieldValue("usnatv1", "SensitiveDataProcessing", [1,2,1,2,2,2,2,2,1,1,2,1]);
//cmpApi.setFieldValue("tcfeuv2", "PurposeOneTreatment", true);
//cmpApi.setFieldValue("tcfeuv2", "PublisherCountryCode", "GB");
//cmpApi.setFieldValue("tcfeuv2", "VendorLegitimateInterests", [1,2,3,4,5]);

//console.log(cmpApi.getGppString());

// MARK: Ping
function ping() {
    __gpp("ping", function (data, success) {
        console.log(data);
        nativeBridge = new NativeBridge("InMobiCMPGPP");
        nativeBridge.executeNativeCall('ping', 'pingReturn', jsonToBase64(data));
    });
}

// MARK: Get GPP String
function getGppString() {
    return cmpApi.getGppString();
}

// MARK: Set GPP String
function setGppString(string) {
    cmpApi.setGppString(string);
}

// MARK: Set Field
function setField(section, field, value) {
    console.log("Field: "+field + " Value: "+value);
    
    cmpApi.setFieldValue(section, field, value);
}

//MARK: Get Field
function getField(section, field) {
    return cmpApi.getFieldValue(section, field);
}

// MARK: Check if section is present
function hasSection(section) {
    nativeBridge = new NativeBridge("InMobiCMPGPP");
    nativeBridge.executeNativeCall('hasSection', 'value', cmpApi.hasSection(section));
    return cmpApi.hasSection(section);
}

// MARK: Get Section
function getSection(section) {
    return cmpApi.getSection(section);
}

// MARK: Get Section String
function getSectionString(section) {
    return cmpApi.getSectionString(section);
}

// MARK: Set Section String
function setSectionString(section, value) {
    return cmpApi.setSectionString(section, value);
}

// MARK: Delete Section
function deleteSectionById(sectionId) {
    cmpApi.deleteSectionById(sectionId)
}

// MARK: Set Applicable sections
function setApplicableSections(applicableSections) {
    console.log("Applicable sections: "+ applicableSections);
    cmpApi.setApplicableSections(applicableSections);
}

//
//nativeBridge = new NativeBridge("InMobiCMPGPP");
//nativeBridge.executeNativeCall('getField', 'data',cmpApi.getFieldValue("usnatv1", "SensitiveDataProcessing"));

//__gpp("getField", function (data) {
//    nativeBridge = new NativeBridge("InMobiCMPGPP");
//    nativeBridge.executeNativeCall('getField', 'data', jsonToBase64(data));
//}, "usnatv1.SensitiveDataProcessing");

//__gpp("addEventListener", function (evt) {
//    nativeBridge = new NativeBridge("InMobiCMPGPP");
//
//    console.log("Add event listener called");
//    console.log(__gpp("getGPPString"));
//    nativeBridge.executeNativeCall('addEventListener', 'event', jsonToBase64(evt));
//},"uspv1");

//__gpp('addEventListener', (data) => {
//    nativeBridge = new NativeBridge("InMobiCMPGPP");
//    console.log("add event listener")
//    console.log("data", data);
//    nativeBridge.executeNativeCall('addEventListener', 'event', jsonToBase64(data));
//}, "uspv1");
//
//
//function removeListener() {
//    __gpp("removeEventListener", (evt) => {
//        nativeBridge = new NativeBridge("InMobiCMPGPP");
//
//        console.log("Remove event listener");
//        nativeBridge.executeNativeCall('removeEventListener', 'event',jsonToBase64(evt));
//    }, "uspv1");
//}
//
//function updateValue() {
//    cmpApi.setFieldValue("uspv1", "OptOutSale", 1);
//    cmpApi.fireEvent("uspv1", cmpApi.getSection("uspv1"));
//}
