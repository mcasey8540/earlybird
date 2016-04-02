var app = angular.module('flapperNews', ['ui.router']);

//posts factory
app.factory('posts', ['$http', 'auth', function($http, auth){
	var o = {
		posts: []
	};
	
	o.getAll = function(){
		return $http.get('/posts').success(function(data){
			angular.copy(data, o.posts)
		});
	};

	o.create = function(post){
		return $http.post('/posts', post, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		})
		.success(function(data){
			o.posts.push(data);
		});
	}

	o.upvote = function(post){
		return $http.put('/posts/'+ post._id +'/upvote', null, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		})
		.success(function(res){
			post.upvotes += 1;
		});
	};

	o.get = function(id){
		return $http.get('/posts/' + id)
			//res param represents success
			.then(function(res){
				return res.data;
			});
	};

	o.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};

	o.upvoteComment = function(id, comment){
		return $http.put('/posts/' + id + '/comments/' + comment._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		})
			.success(function(data){
				comment.upvotes += 1;
			});
	};

	return o;

}]);

//auth factory
app.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};

	//saving token 
	auth.saveToken = function(token){
		$window.localStorage['flapper-news-token'] = token;
	};

	//getting token
	auth.getToken = function (){
	  return $window.localStorage["flapper-news-token"];
	}

	//check if loggedin
	auth.isLoggedIn = function(){
		var token = auth.getToken();
		if(token){
			//convert payload to JSON
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	}

	//gets current user
	auth.currentUser = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.username;
		};
	}

	//register user
	auth.register = function(user){
	  return $http.post('/register', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

	//login user
	auth.logIn = function(user){
	  return $http.post('/login', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

	//logout user
	auth.logOut = function(){
		$window.localStorage.removeItem('flapper-news-token');
	};

	return auth;
}]);


app.controller('MainCtrl', ['$scope', 'posts', 'auth',
	function($scope, posts, auth){
		$scope.test = 'Hello World';
		$scope.posts = posts.posts;
		$scope.isLoggedIn = auth.isLoggedIn;

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

app.controller('PostsCtrl', ['$scope','posts','post', 'auth',
	function($scope, posts, post, auth){
		$scope.post = post;
		$scope.isLoggedIn = auth.isLoggedIn;

		$scope.addComment = function(){
			if($scope.body === '') { return;}
			
			//add comment to post
			posts.addComment(post._id, {
				body: $scope.body,
				author: 'Mike',
			}).success(function(comment){
				$scope.post.comments.push(comment);
			});
			$scope.body = '';
		};

		$scope.incrementUpvotes = function(comment){
			posts.upvoteComment(post._id,comment);
		};

}]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth',
	function($scope, $state, auth){
		$scope.user = {};

	  $scope.register = function(){
	    auth.register($scope.user).error(function(error){
	      $scope.error = error;
	    }).then(function(){
	      $state.go('home');
	    });
	  };

	  $scope.logIn = function(){
	    auth.logIn($scope.user).error(function(error){
	      $scope.error = error;
	    })
	    .then(function(){
	      $state.go('home');
	    });
	  };

}]);

app.controller('NavCtrl', ['$scope', 'auth',
	function($scope, auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
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
				controller: 'PostsCtrl',
				resolve: {
					post: ['$stateParams', 'posts', function($stateParams, posts){
						return posts.get($stateParams.id);
					}]
				}
			})

			.state('login', {
				url: '/login',
				templateUrl: '/login.html',
				controller: 'AuthCtrl',
				//onEnter function gives ability to detect if the user authenticated before enterin state
				onEnter: ['$state','auth', function($state, auth){
					if(auth.isLoggedIn()){
						$state.go('home');
					}	
				}]
			})

			.state('register', {
			  url: '/register',
			  templateUrl: '/register.html',
			  controller: 'AuthCtrl',
			  onEnter: ['$state', 'auth', function($state, auth){
			    if(auth.isLoggedIn()){
			      $state.go('home');
			    }
			  }]
			});			

		$urlRouterProvider.otherwise('home');
		
}]);