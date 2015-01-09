(function () {
    "use strict";

    angular
        .module("ixesha")
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