define([
  "dojo/_base/declare",
  "dojo/_base/lang",

  "dojo/on",
  "dojo/Deferred"
],
function(
  declare, lang,
  on, Deferred
) {

  // TODO
  // Emit events
  // Add support for timeout for map update event
  // Expose delay between slides as a property
  // Stop/pause presentation when the user starts interacting with the map

  var Presentation = declare(null, {

    extents: null,
    current : 0,
    paused: false,
    stopped: true,
    loop: false,
    stepCallback: null,

    constructor: function(params) {
      lang.mixin(this, params);

      this.goToNextExtent = lang.hitch(this, this.goToNextExtent);
      this._waitForUpdateEnd = lang.hitch(this, this._waitForUpdateEnd);
      this._waitFor2Secs = lang.hitch(this, this._waitFor2Secs);
    },

    start: function() {
      // TODO
      // Wait for map to load before starting presentation.
      this.map.disableMapNavigation();
      // this.map.hideZoomSlider();

      this.current = 0;
      this.stopped = false;
      this.paused = false;
      this.goToNextExtent();
    },

    stop: function() {
      this.stopped = true;
      this.paused = false;
      this.current = 0;
      // TODO
      // Destroy timer and dfd

      this.map.enableMapNavigation();
      // this.map.showZoomSlider();
    },

    pause: function() {
      this.paused = true;
      // TODO
      // Destroy timer and dfd
    },

    resume: function() {
      this.paused = false;
      this.goToNextExtent();
    },

    goToNextExtent: function() {
      if (this.paused || this.stopped) {
        return;
      }

      var extent = this.extents[this.current++];
      if (!extent) {
        console.log("[ End of presentation ]");
        if (this.loop) {
          this.start();
        }
        else {
          this.stop();
        }
        return;
      }

      console.log("Extent: " + this.current + " of " + (this.extents.length));

      if (this.stepCallback) {
        this.stepCallback({
          current: this.current,
          total: this.extents.length
        });
      }

      this.map.setExtent(extent)
         .then(this._waitForUpdateEnd)
         .then(this._waitFor2Secs)
         .then(this.goToNextExtent);
    },

    _waitForUpdateEnd: function() {
      var dfd = new Deferred();

      dfd.then(function() {
        // console.log(" ...update complete");
      });

      if (this.map.updating) {
        on.once(this.map, "update-end", function() {
          // console.log(" ...map update end");
          dfd.resolve();
        });
      }
      else {
        // No pending updates. Resolve immediately
        dfd.resolve();
      }

      return dfd;
    },

    _waitFor2Secs: function() {
      var dfd = new Deferred(),
          seconds = 1;

      dfd.then(function() {
        // console.log(" ...time's up");
      });

      setTimeout(function() {
        dfd.resolve();
      }, (seconds * 1000));

      return dfd;
    }

  });

  return Presentation;
});
