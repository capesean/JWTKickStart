(function () {
    "use strict";

    angular
        .module("jwtKickStart")
        .controller("login", loginController);

    loginController.$inject = ["$scope", "$state", "notifications", "authService"];

    function loginController($scope, $state, notifications, authService) {

        if (authService.isLoggedIn())
            $state.go("home");

        var vm = this;
        vm.email = "test@test.com";
        vm.password = "password";
        vm.login = login;

        function login() {
            var user = { userName: vm.email, password: vm.password };

            authService.login(user).then(function () {

                notifications.success('Logged in', 'Hello!');
                $state.go("home");

            },
             function (err) {
                 notifications.error('Login failed', 'Error', err);
             });
        };

    };

}());