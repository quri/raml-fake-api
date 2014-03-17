var url = require('url');
var raml = require('raml-parser');
var fs = require('fs');
var _ = require('underscore');

function createFakeRamlApi(file, callback) {
  var api = null;
  var schemaGenerators = {};
  var fakeRamlApi = {
    navigate: function() {
      return api;
    },
    request: function (httpMethod, path) {
      // This searches an API's resources for a particular
      // part that's based on the relative URI. If we're dealing with a
      // number it's safe to assume the first object with URI parameters
      // is our API (need to double check this though)
      var findBaseApi = function(resources, part) {
        var baseApi =
          _.find(resources, function(resource) {
            if (typeof(part) == 'number') {
              if (resource.uriParameters) {
                return true;
              }
            } else {
              if(resource.relativeUri == part) {
                return true;
              }
            }
            return false;
          });

        return baseApi;
      };

      var findApiParts = function(rootApi, path) {
        // Pull out the relevant portions of the api request
        // and replace all numbers (usually an id) with a real
        // js number
        var pathParts = path.split('/').slice(1);

        var apiParts = _.map(pathParts, function(part) {
          if (!parseInt(part)) {
            return '/' + part;
          } else {
            return parseInt(part);
          }
        });

        // Starting point
        var currentApi = rootApi;

        // makes it easier to just pop portions off
        apiParts = apiParts.reverse();

        while(part = apiParts.pop()) {
          if (_.has(currentApi, 'resources')) {
            result = findBaseApi(currentApi.resources, part);
            if(result != undefined) currentApi = result;
          }
        }
        return currentApi;
      };

      var findMethod = function(methods, desiredMethod) {
        var lowercasedDesiredMethod = desiredMethod.toLowerCase();
        var method =
          _.find(methods, function(method) {
            if (method.method.toLowerCase() == lowercasedDesiredMethod) {
              return true;
            }
            return false;
          });
          if (method == undefined) {
            throw("Method not found in current api.", currentApi);
          }
          return method;
      };

      var findResponseStatus = function(method, url) {
        var status;
        var specificStatus = url.parse(path, true).query['resp'];
        var possibleStatus = Object.keys(method.responses).sort();
        var isValidResponseStatus;

        if (specificStatus) {
          isValidResponseStatus = _.find(possibleStatus, function(s) {
            return s == specificStatus;
          });
          if(isValidResponseStatus) {
            status = specificStatus;
          } else {
            throw("Invalid response status in resp parameter");
          }
        } else {
          status = possibleStatus[0];
        }
        return status;
      };

      var findResponseBody = function(method, status) {
        if (method.responses[status]['body']) {
          if (method.responses[status]['body']['application/json']) {
            if (method.responses[status]['body']['application/json']['example']) {
              return method.responses[status]['body']['application/json']['example'];
            }
          }
        }
        return "";
      };

      try {
        var currentApi = findApiParts(api, path);
        var method = findMethod(currentApi.methods, httpMethod);
        var status = findResponseStatus(method, url);
        var body = findResponseBody(method, status);
        var headers = { "Content-Type": "application/json" };
        return [status, headers, body];
      } catch(e) {
        return ["500", { "Content-Type": "text/plain" }, e];
      }
    }
  }

  raml.loadFile(file).then(function(parsedApi) {
    api = parsedApi;
    callback(fakeRamlApi);
  },function(error) {
    console.log('Error loading raml:', error);
  });
}

exports.create = createFakeRamlApi;