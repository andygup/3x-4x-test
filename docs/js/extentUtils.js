define([], function() {
  function getExtentsForLevelSize(extent, size) {
    var width = extent.getWidth() / size,
      height = extent.getHeight() / size,
      xmin = extent.xmin,
      ymin = extent.ymin,
      sr = extent.spatialReference,
      Extent = extent.constructor,
      extents = [];

    width = width - (width * 1/100);
    height = height - (height * 1/100);

    for (var i = 0; i < size; i++) {
      var x = xmin + (i * width);

      for (var j = 0; j < size; j++) {
        var y = ymin + (j * height);
        extents.push(new Extent(x, y, x + width, y + height, sr));
      }
    }

    return extents;
  }

  return {
    createExtents: function(initialExtent) {
      if (!initialExtent) {
        return [];
      }

      initialExtent = new initialExtent.constructor(initialExtent.toJson());

      var numLevels = 4;
      console.log("#levels:", numLevels);

      var levelSizes = [], i;
      for (i = 1; i <= numLevels; i++) {
        levelSizes.push(Math.pow(2, i));
      }
      console.log("Level sizes:", levelSizes);

      var extentArrays = levelSizes.map((tileSize) => {
        return getExtentsForLevelSize(initialExtent, tileSize);
      });

      var flatExtents = [ initialExtent ];

      for (i = 0; i < extentArrays.length; i++) {
        var array = extentArrays[i];
        flatExtents = flatExtents.concat(array);
      }

      var extents = [];

      for (i = 0; i < flatExtents.length; i++) {
        extents.push(flatExtents[i]);

        // Insert initialExtent after every 4th extent
        if ((i !== 0) && (i !== flatExtents.length-1) && (i % 4 === 0)) {
          extents.push(initialExtent);
        }
      }

      // var extents2 = extentArrays[0];
      // var extents4 = extentArrays[1];
      // var extents8 = extentArrays[2];
      // var extents16 = extentArrays[3];
      //
      // var extents = [ initialExtent ];
      //
      // for (var i = 0; i < extents16.length; i++) {
      //   extents.push(extents16[i]);
      //   extents.push(extents8[i % 8]);
      //   extents.push(extents4[i % 4]);
      //   extents.push(extents2[i % 2]);
      // }

      console.log("#extents:", extents.length);
      return extents;
    }
  };
});