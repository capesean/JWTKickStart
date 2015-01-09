(function () {
    "use strict";

    angular
        .module("jwtKickStart")
        .service("loginModal", loginModal);

    loginModal.$inject = ["$modal"];

    function loginModal ($modal) {

        return function () {
            $modal.open({
                templateUrl: "/app/login/loginModal.html",
                controller: "loginModal",
                controllerAs: "loginvm"
            });
        };

    }
}());