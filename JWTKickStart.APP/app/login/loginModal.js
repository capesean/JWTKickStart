(function () {
    "use strict";

    angular
        .module("ixesha")
        .controller("loginModal", loginModal);

    loginModal.$inject = ["$scope", "$state", "notifications", "authService"];

    function loginModal($scope, $state, notifications, authService) {

        var loginvm = this;
        loginvm.email = "test@test.com";
        loginvm.password = "password";
        loginvm.cancel = $scope.$dismiss;
        loginvm.login = login;

        function login() {

            var user = { userName: loginvm.email, password: loginvm.password };

            authService.login(user).then(function (response) {

                notifications.success('Logged in', 'Hello!');
                $scope.$close(user);

            },
             function (err) {
                 notifications.error('Login failed', 'Error', err);
             });
        };

    }
}());