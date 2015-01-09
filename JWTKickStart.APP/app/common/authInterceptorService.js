// todo: why does removing the IIFE cause the injector to fail?
// todo: will minification break this? e.g. request method will be renamed
//(function () {
"use strict";

angular
    .module("ixesha")
    .factory("authInterceptorService", authInterceptorService);

authInterceptorService.$inject = ["$injector", "$q", "$timeout"];
function authInterceptorService($injector, $q, $timeout) {

    var $state, loginModal, $http;

    // avoids error: "Uncaught Error: [$injector:cdep] Circular dependency found"
    $timeout(function () {
        loginModal = $injector.get("loginModal");
        $http = $injector.get("$http");
        $state = $injector.get("$state");
    });

    var service = {
        request: request,
        responseError: responseError
    };

    return service;

    function request(config) {

        // adds the "Authorization: Bearer <token>" to the request header
        var authService = $injector.get("authService");

        config.headers = config.headers || {};

        var token = authService.getToken();
        if (token) {
            config.headers.Authorization = "Bearer " + token;
        }

        return config;
    }

    function responseError(rejection) {

        // if the error was not an authorization error, return the error
        if (rejection.status !== 401) {
            return rejection;
        }

        var authService = $injector.get("authService");
        var deferred;

        // get the refresh token from the auth data
        var refreshToken = authService.getRefreshToken();

        // if there is a token
        if (refreshToken) {

            deferred = $q.defer();

            // try reissue an auth_token using the refresh_token
            authService
                .refreshToken()
                .then(function () {
                    // new auth token was received, resolve promise
                    deferred.resolve($http(rejection.config));
                }, function () {
                    // refresh token failed, ask the user to login
                    showLogin(deferred, rejection, authService);
                });

            return deferred.promise;

        } else {
            // no refresh token, ask the user to login
            deferred = $q.defer();
            showLogin(deferred, rejection, authService);
            return deferred.promise;
        }
    }

    function showLogin(deferred, rejection, authService) {

        loginModal()
            .then(function () {
                deferred.resolve($http(rejection.config));
            })
            .catch(function () {
                // user cancelled sign in, return to login page
                // todo: if credentials are incorrect, might want to re-show the login?
                authService.logout();
                $state.go("login");
                deferred.reject(rejection);
            });

    }
}

//});
