(function () {
    "use strict";

    angular
        .module("ixesha", [
            //"ngRoute",          // routing
            "ui.router",        // routing (UI version)
            "angular-jwt",      // jwt token
            "angular-storage",  // token storage
            "ui.bootstrap"      // login modal
        ])
        .config(configure)
        .factory("notifications", notificationFactory)
        .run(run)
        .controller("navigation", navigation)
        .constant("appSettings", getAppSettings());

    function getAppSettings() {
        return {
            apiServiceBaseUri: "http://localhost:63265/",
            authClientId: "JWTKickStart.API"
        };
    }

    navigation.$inject = ["$state", "notifications", "authService"];
    function navigation($state, notifications, authService) {

        var vm = this;
        vm.logout = logout;
        vm.isLoggedIn = isLoggedIn;

        function isLoggedIn() {
            return authService.isLoggedIn();
        }

        function logout() {

            authService.logout();
            $state.go("login");
            notifications.success("Logged out", "Goodbye!");
        }

    }

    configure.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider", "$httpProvider", "jwtInterceptorProvider"];
    function configure($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, jwtInterceptorProvider) {

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
            .state("projects", {
                url: "/projects",
                templateUrl: "/app/projects/projects.html",
                controller: "projects",
                controllerAs: "vm",
                data: { requireLogin: true }
            })
            .state("project", {
                url: "/projects/:projectId",
                templateUrl: "/app/projects/project.html",
                controller: "project",
                controllerAs: "vm",
                data: { requireLogin: true }
            })
        ;

        $locationProvider.html5Mode(true);

        jwtInterceptorProvider.tokenGetter = function (authService) {
            return authService.getToken();
        };

        $httpProvider.interceptors.push("jwtInterceptor");
        $httpProvider.interceptors.push("authInterceptorService");

    }

    run.$inject = ["$rootScope", "$state", "notifications", "loginModal", "authService"];
    function run($rootScope, $state, notifications, loginModal, authService) {
        $rootScope.$on("$stateChangeStart", function (event, toState, toParams) {
            var requireLogin = toState.data.requireLogin;

            if (requireLogin && !authService.isLoggedIn()) {
                event.preventDefault();

                notifications.error("You are not logged in", "Access Denied");

                if ($state.current.name !== "login") {
                    loginModal()
                        .then(function() {
                            return $state.go(toState.name, toParams);
                        })
                        .catch(function() {
                            return $state.go("login");
                        });
                }
            }
        });
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

}());