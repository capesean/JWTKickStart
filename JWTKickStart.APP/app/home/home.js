(function () {
    "use strict";

    angular
        .module("jwtKickStart")
        .controller("home", home);

    home.$inject = ["authService", "api"];

    function home(authService, api) {

        var vm = this;
        vm.authData = { token: authService.getToken(), refreshToken: authService.getRefreshToken() };

        api.getProtectedData()
            .then(function(data) { vm.protectedData = data; });

    };

}());