(function () {
    "use strict";

    angular
        .module("ixesha")
        .factory("api", api);

    api.$inject = ["$http", "appSettings"];

    function api($http, appSettings) {

        var service = {
            getProtectedData: getProtectedData
        };

        return service;

        function getProtectedData() {
            var url = appSettings.apiServiceBaseUri + "api/protected";
            
            return $http.get(url).then(
                function(response) {
                     return response.data;
                });
        }

    };

}());