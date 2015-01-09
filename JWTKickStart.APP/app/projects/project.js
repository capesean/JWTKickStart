(function () {
    "use strict";

    angular
        .module("ixesha")
        .controller("project", project);

    project.$inject = ["$scope", "$stateParams", "api", "notifications"];

    function project($scope, $stateParams, api, notifications) {

        var vm = this;
        vm.project = null;
        vm.saveProject = saveProject;

        // load the requested project
        api
            .getProject($stateParams.projectId)
            .$promise
            .then(onLoad, onLoadError);

        // save button clicked
        function saveProject() {

            if ($scope.projectForm.$invalid) { 
                notifications.error('The form has not been completed correctly.', 'Error');
            } else {
                vm.project
                    .$save()
                    .then(onSave, onSaveError);
            }
        };

        function onLoad(data) {
            vm.project = data;
        };

        function onLoadError(err) {
            // todo: should redirect? (unless a new / insert)
            notifications.error('Failed to load the project.', 'Error', err);
        };

        function onSave(data) {
            vm.project = data;
            notifications.success('The project has been saved.', 'Saved');
        };

        function onSaveError(err) {
            notifications.error('Failed to save the project.', 'Error', err);
        };

    };

}());