var app = angular.module('flapperNews', ['ui.router']);

app.factory('posts', ['$http', function($http){
	var o = {
		posts: []
	};
	
	o.getAll = function(){
		return $http.get('/posts').success(function(data){
			angular.copy(data, o.posts)
		});
	};

	o.create = function(post){
		return $http.post('/posts', post)
		.success(function(data){
			o.posts.push(data);
		});
	}

	o.upvote = function(post){
		return $http.put('/posts/'+ post._id +'/upvote')
			.success(function(data){
				post.upvotes += 1;
		});
	};

	o.get = function(post){
		return $http.get('/posts/' + post._id)
			.success(function(data){

			});
	}

	return o;

}]);

app.controller('MainCtrl', ['$scope', 'posts',
	function($scope, posts){
		$scope.test = 'Hello World';
		$scope.posts = posts.posts;

		$scope.addPost = function(){
			//prevents user from adding blank title
			if(!$scope.title || $scope.title === ''){return;}

				//posts method to save to server
				posts.create({
					title: $scope.title,
					link: $scope.link
				});

			$scope.title = '';
			$scope.link = '';
		};

		$scope.incrementUpvotes = function(post){
			posts.upvote(post);
		};
	}
]);

app.controller('PostsCtrl', ['$scope','$stateParams','posts',
	function($scope, $stateParams, posts){
		$scope.post = posts.posts[$stateParams.id];

		$scope.addComment = function(){
			if($scope.body === '') { return;}
			$scope.post.comments.push({
				body: $scope.body,
				author: 'user',
				upvotes: 0
			});
			$scope.body = '';
		}
}]);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider){

		$stateProvider
			.state('home', {
				url: '/home',
				templateUrl: '/home.html',
				controller: 'MainCtrl',
				resolve: {
					//promise to make sure that all posts are queried from backend before state actually finishes loading
					postPromise: ['posts', function(posts){
						return posts.getAll();
					}]
				}
			})

			.state('posts', {
				url: '/posts/{id}',
				templateUrl: '/posts.html',
				controller: 'PostsCtrl'
			})

		$urlRouterProvider.otherwise('home');
		
}]);