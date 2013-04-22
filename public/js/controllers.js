angular.module("NanoSearch", ['ngResource']).
	directive('focus', function () {
		return function (scope, element) {
			element[0].select();
		}
	});

function SearchController($scope, $resource, $rootScope, $window, $location) {
	$scope.$on('$viewContentLoaded', function(event) {
		$window._gaq.push(['_trackPageview', $location.path()]);
	});
    $scope.youtube = $resource("https://gdata.youtube.com/feeds/api/videos",
        {'max-results':'9', orderby:'relevance', alt:'json-in-script', v:'2', callback:'JSON_CALLBACK', category:'Music', format:'5', safeSearch:'strict'},
        {get:{method:'JSONP'}}
    );
    if($rootScope.q) {
    	$scope.margintop = 'off';
    	var q = $rootScope.q;
    	$scope.search(q);
    	$scope.q = q;
    	delete $rootScope.q;
    }
    $scope.search = function(query){
    	$scope.msg = '';
    	var q = query || $scope.q;
    	if(!q) {
    		$scope.msg = 'Empty search = No results !';
    		return;
    	}
        $scope.youtube.get(
    		{q:q},
    		function (data) {
				$scope.videos = data.feed.entry || [];
				if($scope.videos.length == 0) {
					$scope.msg = 'No results... Try again !';
				}
				$scope.margintop = 'off';
				//console.log($scope.videos);
		});
    }
}
