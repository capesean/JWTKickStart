(function () {
    "use strict";

    var refreshTokenPromise,
        appSettings = {
            apiServiceBaseUri: "http://localhost:63265/",
            authClientId: "JWTKickStart.API",
            apiPrefix: "api/"
        };

    angular
        .module("jwtKickStart", [
            "ui.router",        // routing (UI version)
            "angular-jwt",      // jwt token
            "angular-storage",  // token storage
            "ui.bootstrap"      // login modal
        ])
        .config(configure)
        .factory("notifications", notificationFactory)
        .run(run)
        .controller("navigation", navigation)
        .constant("appSettings", appSettings);

    configure.$inject = ["$urlRouterProvider", "$stateProvider", "$locationProvider", "$httpProvider", "jwtInterceptorProvider"];
    function configure($urlRouterProvider, $stateProvider, $locationProvider, $httpProvider, jwtInterceptorProvider) {

        // configure routes
        setupRoutes($urlRouterProvider, $stateProvider, $locationProvider);

        jwtInterceptorProvider.tokenGetter = ["authService", "jwtHelper", "$http", "appSettings", "store", "config", function (authService, jwtHelper, $http, appSettings, store, requestConfig) {

            // if the request is not for the api, then return null token, so the authorization header is not set (and therefore a token refresh not possible)
            if (requestConfig.url.indexOf(appSettings.apiServiceBaseUri + appSettings.apiPrefix) !== 0
                && requestConfig.url.indexOf("/" + appSettings.apiPrefix) !== 0) return null;

            // if there"s an outstanding promise for a token, return it
            if (refreshTokenPromise) return refreshTokenPromise;

            // get the token
            var accessToken = authService.getToken();

            // if no token, retun null
            if (!accessToken) return null;

            // token is valid (not expired), return it
            if (!jwtHelper.isTokenExpired(accessToken)) return accessToken;

            // going to try refresh via a promise
            // get & store the promise in global variable in case it's called again before resolving
            refreshTokenPromise = authService.getRefreshTokenPromise();
            refreshTokenPromise.then(function (newToken) {

                // success: clear promise & return token
                refreshTokenPromise = null;
                return newToken;

            }, function () {

                // failed: clear promise & return null
                refreshTokenPromise = null;
                return null;

            });
            return refreshTokenPromise;

        }];

        $httpProvider.interceptors.push("jwtInterceptor");

    }

    run.$inject = ["$rootScope", "$state", "notifications", "loginModal", "authService"];
    function run($rootScope, $state, notifications, loginModal, authService) {

        authService.loadUser();

        $rootScope.$on("$stateChangeStart", function (event, toState, toParams, from) {

            if (from.name == "" && toState.name !== "login" && !authService.isLoggedIn()) {
                event.preventDefault();
                return $state.go("login");
            }
            else if (toState.data.requireLogin && !authService.isLoggedIn()) {
                event.preventDefault();

                notifications.error("You are not logged in", "Access Denied");
                if (from.name == "login") {
                    // leave as is
                }
                else if (toState.name !== "login") {
                    var modal = loginModal(); // todo: why is this returning undefined on first call?
                    if (modal)
                        modal.then(function () {
                            return $state.go(toState.name, toParams);
                        })
                        .catch(function () {
                            return $state.go("login");
                        });
                }
            }

        });

        // set default options for toastr
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "progressBar": false,
            "positionClass": "toast-bottom-right",
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
    }

    navigation.$inject = ["$state", "$rootScope", "notifications", "authService"];
    function navigation($state, $rootScope, notifications, authService) {

        var vm = this;
        vm.logout = logout;
        vm.isLoggedIn = isLoggedIn;
        vm.user = {};

        $rootScope.$watch('user', function (newValue) {
            vm.user = newValue;
        });

        function isLoggedIn() {
            return authService.isLoggedIn();
        }

        function logout() {

            authService.logout();
            $state.go("login");
            notifications.success("Logged out", "Goodbye!");
        }

    }

    function notificationFactory() {
        return {
            success: function (text, title) {
                //console.log(title, text);
                toastr.success(text, title);
            },
            error: function (text, title, err) {
                console.log(title, text, err);
                toastr.error(text, title);
            }
        };
    }

    function setupRoutes($urlRouterProvider, $stateProvider, $locationProvider) {
        $urlRouterProvider.otherwise("/");

        $stateProvider
            .state("login", {
                url: "/login",
                templateUrl: "/app/login/login.html",
                controller: "login",
                controllerAs: "vm",
                data: { requireLogin: false }
            })
            .state("home", {
                url: "/",
                templateUrl: "/app/home/home.html",
                controller: "home",
                controllerAs: "vm",
                data: { requireLogin: true }
            })
            .state("protected", {
                url: "/",
                templateUrl: "/app/home/home.html",
                controller: "home",
                controllerAs: "vm",
                data: { requireLogin: true }
            })
        ;

        $locationProvider.html5Mode(true);
    }
}());