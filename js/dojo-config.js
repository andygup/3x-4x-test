(function() {
  //_____________________________________________________________________________

  // Make sure /js/app.js is loaded before this module is loaded.
  var currentState = window.app && window.app.currentState;

  window.dojoConfig = {
    async: true,

    has: {
      "extend-esri": 1
      ,"esri-profiler": 1
      ,"esri-featurelayer-pbf": currentState && currentState.pbf
      ,"esri-featurelayer-webgl": (currentState && currentState.webgl)
        ? {
          enablePBFQuery: currentState && currentState.pbf
        }
        : 0
    },

    locale: currentState && currentState.locale,

    packages: [
      { name: "app", location: window.location.pathname.replace(/\/[^/]+$/, "") },
      { name: "apps", location: "/jsapi/apps" }
    ]
  };

  if (currentState && currentState.canvas) {
    window.dojoConfig.gfxRenderer = "canvas";
  }

  //_____________________________________________________________________________
}());
