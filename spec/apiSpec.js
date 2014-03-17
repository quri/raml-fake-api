var fs = require('fs');
var ramlFakeApi = require('../src/raml_fake_api.js');

describe("apiSpec", function() {

  describe(".navigate", function(){
    it("returns the raml tree", function() {
      ramlFakeApi.create("./spec/api.raml", function(api) {
        expect(api.navigate().title).toEqual("Api");
        done();
      });
    });
  });

  describe(".request", function () {
    it("returns the corresponding collection endpoint JSON sample response", function(done) {
      ramlFakeApi.create("./spec/api.raml", function(api) {
        response = api.request("GET", "/posts");

        expect(response[0]).toEqual("200");
        expect(response[1]).toEqual("{\"Content-Type\":\"application/json\"}");

        fs.readFile("./spec/api/models/post/collection-example.json", "utf8", function (err,data) {
          expect(err).toBe(null);
          expect(response[2]).toEqual(data);
          done();
        });
      });
    });

    it("returns the corresponding model endpoint JSON sample response", function(done) {
      ramlFakeApi.create("./spec/api.raml", function(api) {
        response = api.request("GET", "/posts/1");

        expect(response[0]).toEqual("200");
        expect(response[1]).toEqual("{\"Content-Type\":\"application/json\"}");

        fs.readFile("./spec/api/models/post/model-example.json", "utf8", function (err,data) {
          expect(err).toBe(null);
          expect(data).toEqual(response[2]);
          done();
        });
      });
    });

    // it("returns a specific JSON http code sample response", function(done) {
    //   ramlFakeApi.create("./spec/api.raml", function(api) {
    //     json = api.request("GET", "/posts/1?resp=422");
    //     expect("").toEqual(json)
    //     done();
    //   });
    // });
  });

});

