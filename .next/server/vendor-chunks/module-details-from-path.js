"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/module-details-from-path";
exports.ids = ["vendor-chunks/module-details-from-path"];
exports.modules = {

/***/ "(action-browser)/./node_modules/module-details-from-path/index.js":
/*!********************************************************!*\
  !*** ./node_modules/module-details-from-path/index.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar sep = (__webpack_require__(/*! path */ \"path\").sep)\n\nmodule.exports = function (file) {\n  var segments = file.split(sep)\n  var index = segments.lastIndexOf('node_modules')\n\n  if (index === -1) return\n  if (!segments[index + 1]) return\n\n  var scoped = segments[index + 1][0] === '@'\n  var name = scoped ? segments[index + 1] + '/' + segments[index + 2] : segments[index + 1]\n  var offset = scoped ? 3 : 2\n\n  var basedir = ''\n  var lastBaseDirSegmentIndex = index + offset - 1\n  for (var i = 0; i <= lastBaseDirSegmentIndex; i++) {\n    if (i === lastBaseDirSegmentIndex) {\n      basedir += segments[i]\n    } else {\n      basedir += segments[i] + sep\n    }\n  }\n\n  var path = ''\n  var lastSegmentIndex = segments.length - 1\n  for (var i2 = index + offset; i2 <= lastSegmentIndex; i2++) {\n    if (i2 === lastSegmentIndex) {\n      path += segments[i2]\n    } else {\n      path += segments[i2] + sep\n    }\n  }\n\n  return {\n    name: name,\n    basedir: basedir,\n    path: path\n  }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFjdGlvbi1icm93c2VyKS8uL25vZGVfbW9kdWxlcy9tb2R1bGUtZGV0YWlscy1mcm9tLXBhdGgvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQVk7O0FBRVosVUFBVSw2Q0FBbUI7O0FBRTdCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esa0JBQWtCLDhCQUE4QjtBQUNoRDtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsZ0NBQWdDLHdCQUF3QjtBQUN4RDtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9nZW1pbmktZW1waXJlcy8uL25vZGVfbW9kdWxlcy9tb2R1bGUtZGV0YWlscy1mcm9tLXBhdGgvaW5kZXguanM/OGIzMyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxudmFyIHNlcCA9IHJlcXVpcmUoJ3BhdGgnKS5zZXBcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZmlsZSkge1xuICB2YXIgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHNlcClcbiAgdmFyIGluZGV4ID0gc2VnbWVudHMubGFzdEluZGV4T2YoJ25vZGVfbW9kdWxlcycpXG5cbiAgaWYgKGluZGV4ID09PSAtMSkgcmV0dXJuXG4gIGlmICghc2VnbWVudHNbaW5kZXggKyAxXSkgcmV0dXJuXG5cbiAgdmFyIHNjb3BlZCA9IHNlZ21lbnRzW2luZGV4ICsgMV1bMF0gPT09ICdAJ1xuICB2YXIgbmFtZSA9IHNjb3BlZCA/IHNlZ21lbnRzW2luZGV4ICsgMV0gKyAnLycgKyBzZWdtZW50c1tpbmRleCArIDJdIDogc2VnbWVudHNbaW5kZXggKyAxXVxuICB2YXIgb2Zmc2V0ID0gc2NvcGVkID8gMyA6IDJcblxuICB2YXIgYmFzZWRpciA9ICcnXG4gIHZhciBsYXN0QmFzZURpclNlZ21lbnRJbmRleCA9IGluZGV4ICsgb2Zmc2V0IC0gMVxuICBmb3IgKHZhciBpID0gMDsgaSA8PSBsYXN0QmFzZURpclNlZ21lbnRJbmRleDsgaSsrKSB7XG4gICAgaWYgKGkgPT09IGxhc3RCYXNlRGlyU2VnbWVudEluZGV4KSB7XG4gICAgICBiYXNlZGlyICs9IHNlZ21lbnRzW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIGJhc2VkaXIgKz0gc2VnbWVudHNbaV0gKyBzZXBcbiAgICB9XG4gIH1cblxuICB2YXIgcGF0aCA9ICcnXG4gIHZhciBsYXN0U2VnbWVudEluZGV4ID0gc2VnbWVudHMubGVuZ3RoIC0gMVxuICBmb3IgKHZhciBpMiA9IGluZGV4ICsgb2Zmc2V0OyBpMiA8PSBsYXN0U2VnbWVudEluZGV4OyBpMisrKSB7XG4gICAgaWYgKGkyID09PSBsYXN0U2VnbWVudEluZGV4KSB7XG4gICAgICBwYXRoICs9IHNlZ21lbnRzW2kyXVxuICAgIH0gZWxzZSB7XG4gICAgICBwYXRoICs9IHNlZ21lbnRzW2kyXSArIHNlcFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogbmFtZSxcbiAgICBiYXNlZGlyOiBiYXNlZGlyLFxuICAgIHBhdGg6IHBhdGhcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(action-browser)/./node_modules/module-details-from-path/index.js\n");

/***/ })

};
;