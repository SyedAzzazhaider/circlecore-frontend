const path = require("path");

module.exports = function(request, options) {
  if (request.startsWith("@/")) {
    const absolute = path.resolve(options.rootDir, request.slice(2));
    return options.defaultResolver(absolute, options);
  }
  return options.defaultResolver(request, options);
};