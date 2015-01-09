(function () {
    "use strict";

    angular
        .module("ixesha")
        .controller("projects", projects);

    projects.$inject = ["$scope", "$timeout", "$resource", "api", "notifications"];

    function projects($scope, $timeout, $resource, api, notifications) {

        var vm = this;
        vm.searchText = "";
        vm.searchProjects = searchProjects;

        function searchProjects() {
            // hide results
            $scope.loaded = false;
            // reset dataTable
            if ($scope.dataTable) $scope.dataTable.destroy();
            // get the data
            api.searchProjects(vm.searchText).then(onProjects, onError);
        };

        function onProjects(data) {
            // set the data to the model
            $scope.projects = data;
            // add to queue so it gets called after model binds to UI
            $timeout(function () {
                // create the datatable
                $scope.dataTable = $('table#projects').DataTable({
                    "order": [[0, "asc"]]
                });
                // loading is done
                $scope.loaded = true;
            }, 0);

        };

        function onError(err) {
            notifications.error('Failed to load the projects.', 'Error', err);
        };

    };

}());