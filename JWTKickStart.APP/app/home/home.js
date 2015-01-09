(function () {
    "use strict";

    angular
        .module("ixesha")
        .controller("home", home);

    home.$inject = ["authService", "api"];

    function home(authService, api) {

        var vm = this;
        vm.authData = authService.getData();

        api.getProtectedData()
            .then(function(data) { vm.protectedData = data; });

    };

}());