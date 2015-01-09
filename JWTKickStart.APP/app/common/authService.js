(function () {
    "use strict";

    angular
        .module("ixesha")
        .factory("authService", authService);

    authService.$inject = ["$http", "$q", "appSettings", "store"];

    function authService($http, $q, appSettings, store) {

        var service = {
            login: login,
            logout: logout,
            isLoggedIn: isLoggedIn,
            getData: getData,
            getToken: getToken,
            getRefreshToken: getRefreshToken,
            refreshToken: refreshToken
        };

        return service;

        function login(loginData) {

            var data = "grant_type=password&client_id=" + appSettings.authClientId + "&username=" + loginData.userName + "&password=" + loginData.password;

            var deferred = $q.defer();

            $http.post(appSettings.apiServiceBaseUri + 'token', data, { headers: { 'Content-Type': 'application/json' } })
                .success(function (response) {

                    if (!response.access_token)
                        deferred.reject("Server response did not include a token");

                    storeData(response.access_token, response.refresh_token);

                    deferred.resolve(response);

                })
                .error(function (err, status) {
                    //_logOut();
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        function logout() {
            removeData();
        }

        function isLoggedIn() {
            if (getToken()) return true;
            return false;
        }

        function getData() {
            return store.get("authorizationData");
        }

        function getToken() {
            var authData = getData();
            if (authData) {
                return authData.token;
            }
            return null;
        }

        function getRefreshToken() {
            var authData = getData();
            if (authData && authData.refreshToken) {
                return authData.refreshToken;
            }
            return null;
        }

        function refreshToken() {

            var deferred = $q.defer();

            var token = getRefreshToken();

            if (token) {

                var data = "grant_type=refresh_token&refresh_token=" + token + "&client_id=" + appSettings.authClientId;

                removeData();

                var promise = $http.post(appSettings.apiServiceBaseUri + 'token', data, { headers: { 'Content-Type': 'application/json' } })
                    .success(function(response) {

                        storeData(response.access_token, response.refresh_token);

                        deferred.resolve(response);

                    })
                    .error(function(err) {
                        logout();
                        deferred.reject(err);
                    });

                return promise;

            } else {
                deferred.reject("No Refresh Token available");
            }

            return deferred.promise;

        }

        function storeData(accessToken, refToken) {
            // could add more properties directly here, like username, email, etc. then the data doesn't need to be decrypted each time?
            store.set('authorizationData', { token: accessToken, refreshToken: refToken });
        }

        function removeData() {
            if (getData())
                store.remove("authorizationData");
        }
    };

}());

