(function () {
    "use strict";

    angular
        .module("jwtKickStart")
        .factory("authService", authService);

    authService.$inject = ["$http", "$q", "$rootScope", "appSettings", "store", "jwtHelper"];

    function authService($http, $q, $rootScope, appSettings, store, jwtHelper) {

        var service = {
            login: login,
            logout: logout,
            isLoggedIn: isLoggedIn,
            getData: getData,
            getToken: getToken,
            loadUser: loadUser,
            storeData: storeData,
            getRefreshToken: getRefreshToken,
            getRefreshTokenPromise: getRefreshTokenPromise
        };

        return service;

        function login(loginData) {

            var data = "grant_type=password&client_id=" + appSettings.authClientId + "&username=" + loginData.userName + "&password=" + loginData.password;

            var deferred = $q.defer();

            $http.post(appSettings.apiServiceBaseUri + "token", data, { headers: { "Content-Type": "application/json" } })
                .success(function (response) {

                    if (!response.access_token)
                        deferred.reject("Server response did not include a token");

                    storeData(response.access_token, response.refresh_token);

                    deferred.resolve(response);

                })
                .error(function (err) {
                    logout();
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        function logout() {
            removeData();
        }

        function isLoggedIn() {
            var authData = getData();
            // must have auth token and (be non-expired or have refresh token)
            return (authData && authData.token && (!jwtHelper.isTokenExpired(authData.token) || authData.refreshToken));
        }

        function getData() {
            return store.get("authorizationData");
        }

        function getToken() {
            return getData().token || null;
        }

        function getRefreshToken() {
            return getData().refreshToken || null;
        }

        function getRefreshTokenPromise() {

            var refreshToken = getRefreshToken();

            console.log('refresh token promise requested');

            var deferred = $q.defer();

            $http({
                url: appSettings.apiServiceBaseUri + "token",
                data: "grant_type=refresh_token&refresh_token=" + refreshToken + "&client_id=" + appSettings.authClientId,
                skipAuthorization: true,
                method: "POST"
            }).then(function (response) {

                if (!response.data.access_token) deferred.reject();

                storeData(response.data.access_token, response.data.refresh_token);

                deferred.resolve(response.data.access_token);

            }, function () {

                authService.logout();
                deferred.reject();

            });

            return deferred.promise;
        }

        function storeData(accessToken, refreshToken) {

            var authData = { token: accessToken, refreshToken: refreshToken };

            store.set("authorizationData", authData);

            loadUser();

        }

        function loadUser() {

            var authData = getData();

            if (authData && authData.token) {

                var payload = jwtHelper.decodeToken(authData.token);

                var user = {
                    email: payload.email,
                    firstName: payload.given_name,
                    surname: payload.family_name,
                    name: payload.given_name + " " + payload.family_name,
                    userId: payload.nameid
                };

                $rootScope.user = user;

            } else {
                $rootScope.user = null;

            }

        }

        function removeData() {
            if (getData())
                store.remove("authorizationData");
        }
    };

}());