var url = require('url');
var raml = require('raml-parser');
var fs = require('fs');
var _ = require('underscore');

/*
  Ideas here:

  1. Parse all raml
  2. Return actual middleware function
*/
exports.create = function(file, callback) {
  var api = null;
  var schemaGenerators = {};

  var apiClient = {
    request: function (httpMethod, originalUrl) {
      var parsedUrl = url.parse(originalUrl, true);
      var pathParts = parsedUrl.pathname.split('/').slice(1);

      // Pull out the relevant portions of the api request
      // and replace all numbers (usually an id) with a real
      // js number
      apiParts = _.map(pathParts, function(part) {
        if (!parseInt(part)) {
          return '/' + part;
        } else {
          return parseInt(part);
        }
      });

      // This searches an API's resources for a particular
      // part that's based on the relative URI. If we're dealing with a
      // number it's safe to assume the first object with URI parameters
      // is our API (need to double check this though)
      var findApi = function(resources, part) {
        var api =
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

        return api;
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

          return method;
      };

      // makes it easier to just pop portions off
      apiParts = apiParts.reverse();

      currentApi = api;
      while(part = apiParts.pop()) {
        if (_.has(currentApi, 'resources')) {
          result = findApi(currentApi.resources, part);
          if(result != undefined) currentApi = result;
        }
      }

      method = findMethod(currentApi.methods, httpMethod);

      if (method == undefined) {
        throw("Method not found in current api.", currentApi);
      }

      if (method.responses == undefined) {
        throw('No valid responses in currentApi', currentApi);
      }

      responseType = '200';
      if (parsedUrl.query['resp']) {
        responseType = parsedUrl.query['resp'];
      }

      if (method.responses[responseType]) {
        if (method.responses[responseType]['body']) {
          if (method.responses[responseType]['body']['application/json']) {
            if (method.responses[responseType]['body']['application/json']['example']) {
              return method.responses[responseType]['body']['application/json']['example'];
            }
          }
        }
      }

      throw('No valid responses found.', method.responses);
    }
  }

  raml.loadFile(file).then(function(parsedApi) {
    api = parsedApi;
    callback(apiClient);

    console.log('Error loading raml:', error);
  });
}
