(function() {
  //_____________________________________________________________________________

  var opts = Object.prototype.toString,
      backstop = {};

  // Copied from dojo/_base/lang.js
  var isArray = Array.isArray || function(it){
    // summary:
    //		Return true if it is an Array.
    // it: anything
    //		Item to test.
    return opts.call(it) == "[object Array]"; // Boolean
  };

  // Copied from dojo/io-query.js
  function objectToQuery(/*Object*/ map) {
    // summary:
    //		takes a name/value mapping object and returns a string representing
    //		a URL-encoded version of that object.
    // example:
    //		this object:
    //
    //	|	{
    //	|		blah: "blah",
    //	|		multi: [
    //	|			"thud",
    //	|			"thonk"
    //	|		]
    //	|	};
    //
    //		yields the following query string:
    //
    //	|	"blah=blah&multi=thud&multi=thonk"

    // FIXME: need to implement encodeAscii!!
    var enc = encodeURIComponent, pairs = [];
    for (var name in map) {
      var value = map[name];
      if(value != backstop[name]){
        var assign = enc(name) + "=";
        if(isArray(value)){
          for(var i = 0, l = value.length; i < l; ++i){
            pairs.push(assign + enc(value[i]));
          }
        }else{
          pairs.push(assign + enc(value));
        }
      }
    }
    return pairs.join("&"); // String
  }

  function kvToQuery(name, value) {
    var obj = {};
    obj[name] = value;

    return objectToQuery(obj);
  }

  function queryToObject(/*String*/ str) {
    // summary:
    //		Create an object representing a de-serialized query section of a
    //		URL. Query keys with multiple values are returned in an array.
    //
    // example:
    //		This string:
    //
    //	|		"foo=bar&foo=baz&thinger=%20spaces%20=blah&zonk=blarg&"
    //
    //		results in this object structure:
    //
    //	|		{
    //	|			foo: [ "bar", "baz" ],
    //	|			thinger: " spaces =blah",
    //	|			zonk: "blarg"
    //	|		}
    //
    //		Note that spaces and other urlencoded entities are correctly
    //		handled.

    var dec = decodeURIComponent, qp = str.split("&"), ret = {}, name, val;
    for(var i = 0, l = qp.length, item; i < l; ++i){
      item = qp[i];
      if(item.length){
        var s = item.indexOf("=");
        if(s < 0){
          name = dec(item);
          val = "";
        }else{
          name = dec(item.slice(0, s));
          val = dec(item.slice(s + 1));
        }
        if(typeof ret[name] == "string"){ // inline'd type check
          ret[name] = [ret[name]];
        }

        if(isArray(ret[name])){
          ret[name].push(val);
        }else{
          ret[name] = val;
        }
      }
    }
    return ret; // Object
  }

  function sanitizeString(value) {
    var valType = (typeof value);

    if (value == null || valType === "object") {
      return;
    }

    if (valType !== "string") {
      value = value + "";
    }

    return value;
  }

  function sanitizeInt(value) {
    value = parseInt(value);

    if (!isNaN(value)) {
      return value;
    }
  }

  function sanitizeFloat(value) {
    value = parseFloat(value);

    if (!isNaN(value)) {
      return value;
    }
  }

  function sanitizeBool(value) {
    if (typeof value === "string") {
      value = value.toLowerCase();
    }

    if (value === "true" || value === "") {
      value = true;
    }
    else if (value === "false") {
      value = false;
    }
    else {
      return;
    }

    return value;
  }

  function sanitizeArrayOfStrings(value) {
    if (isArray(value)) {
      var retVal = [];

      value.forEach(function(item) {
        item = sanitizeString(item);

        if (item != null) {
          retVal.push(item);
        }
      });

      return retVal.length ? retVal : null;
    }

    value = sanitizeString(value);

    if (value == null) {
      return;
    }

    return value.split(",");
  }

  //_____________________________________________________________________________

  function toURLParams(state) {
    var urlParams = [];

    for (var name in state) {
      // Object.keys(state).sort().forEach((name) => {
      var value = state[name];
      var paramInfo = getParamInfo(name);

      if (paramInfo) {
        if (value !== paramInfo.defaultValue) {
          switch (paramInfo.type) {
            case "string":
              urlParams.push(kvToQuery(name, value));
              break;

            case "int":
              urlParams.push(kvToQuery(name, value));
              break;

            case "float":
              urlParams.push(kvToQuery(name, value));
              break;

            case "bool":
              if (value) {
                urlParams.push(name);
              }
              else {
                urlParams.push(kvToQuery(name, value));
              }
              break;

            case "[string]":
              urlParams.push(kvToQuery(name, value.join(",")));
              break;
          }
        }
      }
      else {
        urlParams.push(kvToQuery(name, value));
      }
    }
    // });

    return urlParams.join("&");
  }

  function fromURLParams(queryString) {
    var rawParams = {};

    var query = queryString;
    if (query) {
      query = query.replace(/^\?/, "");

      if (query) {
        rawParams = queryToObject(query);
      }
    }

    var params = {};

    // Pre-populate params with default values as the app URL may not have some of
    // the parameters.
    paramInfos.forEach(function(paramInfo) {
      params[paramInfo.name] = paramInfo.defaultValue;
    });

    for (var name in rawParams) {
      var paramValue = rawParams[name];

      var paramInfo = getParamInfo(name);
      if (paramInfo) {
        var defaultValue = paramInfo.defaultValue;

        switch (paramInfo.type) {
          case "string":
            var strVal = sanitizeString(paramValue);
            paramValue = (strVal != null) ? strVal : defaultValue;
            break;

          case "int":
            var intVal = sanitizeInt(paramValue);
            paramValue = (intVal != null) ? intVal : defaultValue;
            break;

          case "float":
            var floatVal = sanitizeFloat(paramValue);
            paramValue = (floatVal != null) ? floatVal : defaultValue;
            break;

          case "bool":
            var boolVal = sanitizeBool(paramValue);
            paramValue = (boolVal != null) ? boolVal : defaultValue;
            break;

          case "[string]":
            var arrayOfStringsVal = sanitizeArrayOfStrings(paramValue);
            paramValue = (arrayOfStringsVal != null) ? arrayOfStringsVal : defaultValue;
            break;
        }
      }

      params[name] = paramValue;
    }

    return params;
  }

  //_____________________________________________________________________________

  var paramInfos = [
    /**
     * {
     *   name:         <String>,
     *   type:         <String["string" | "int" | "float" | "bool" | "[string]"] = "string">,
     *   defaultValue: <String | Number | Boolean | Array>
     * }
     */
  ];

  function getParamInfo(name) {
    var retVal;

    paramInfos.filter(function(info) {
      if (info.name === name) {
        retVal = info;
      }

      return !!retVal;
    });

    return retVal;
  }

  function registerParams(paramDefs) {
    paramDefs = paramDefs || [];

    var names = [];

    paramDefs.forEach(function(paramDef) {
      var paramName = paramDef.name;

      var paramInfo = getParamInfo(paramName);
      if (paramInfo) {
        console.warn("[ registerParams ] parameter already registered: ", paramName);
        return;
      }

      var type = paramDef.type || "string";
      var defaultValue = paramDef.defaultValue;

      if (defaultValue == null) {
        switch (type) {
          case "string":
            defaultValue = (typeof defaultValue === "string") ? defaultValue : "";
            break;

          case "int":
            defaultValue = (typeof defaultValue === "number") ? defaultValue : null;
            break;

          case "float":
            defaultValue = (typeof defaultValue === "number") ? defaultValue : null;
            break;

          case "bool":
            defaultValue = (typeof defaultValue === "boolean") ? defaultValue : false;
            break;

          case "[string]":
            defaultValue = isArray(defaultValue) ? defaultValue : [];
            break;
        }
      }

      names.push(paramName);

      paramInfos.push({
        name: paramName,
        type: type,
        defaultValue: defaultValue
      });
    });

    console.warn("[ Registered App Parameters ]", names.length ? names.join(", ") : "n/a");
  }

  function updateState(state, name, value) {
    var paramInfo = getParamInfo(name);

    if (paramInfo) {
      var defaultValue = paramInfo.defaultValue;

      switch (paramInfo.type) {
        case "string":
          var strVal = sanitizeString(value);
          value = (strVal != null) ? strVal : defaultValue;
          break;

        case "int":
          var intVal = sanitizeInt(value);
          value = (intVal != null) ? intVal : defaultValue;
          break;

        case "float":
          var floatVal = sanitizeFloat(value);
          value = (floatVal != null) ? floatVal : defaultValue;
          break;

        case "bool":
          value = !!value;
          break;

        case "[string]":
          var arrayOfStringsVal = sanitizeArrayOfStrings(value);
          value = (arrayOfStringsVal != null) ? arrayOfStringsVal : defaultValue;
          break;
      }
    }

    state[name] = value;
  }

  function writeParams() {
    var urlParams = toURLParams(currentState);
    window.history.replaceState(currentState, "", "?" + urlParams);

    // TODO
    // Add new state entry instead of replacing the existing entry?
  }

  function updateParam(name, value) {
    updateState(currentState, name, value);
    writeParams();
    return currentState[name];
  }

  function getInitialParams() {
    return fromURLParams(window.location.search);
  }

  function displayProps(currentState) {
    console.group("app.currentState");

    for (var paramName in currentState) {
      console.warn("[" + paramName + "]", currentState[paramName]);
    }

    console.groupEnd();
  }

  //_____________________________________________________________________________

  // Application should define "window.paramDefinitions" as early as possible,
  // preferrably before importing dojo-config.js.
  registerParams(window.paramDefinitions);

  var currentState = getInitialParams();
  displayProps(currentState);

  //_____________________________________________________________________________

  window.app = {
    currentState: currentState,
    updateParam: updateParam,

    registerParams: function(paramDefs) {
      // Application is expected to call this method before the app logic begins
      // i.e. registration cannot happen in the middle of app logic as there is
      // no mechanism to broadcast change in values.
      registerParams(paramDefs);

      if (currentState) {
        window.app.currentState = (currentState = getInitialParams());
        displayProps(currentState);
      }
    },

    _testing: {
      getParamInfo: getParamInfo,
      fromURLParams: fromURLParams,
      toURLParams: toURLParams,
      updateState: updateState
    }
  };

  //_____________________________________________________________________________
}());
