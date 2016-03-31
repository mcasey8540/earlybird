var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

var jwt = require('express-jwt');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});


//GET all posts
router.get('/posts', function(req, res, next) {
	Post.find(function(err, posts){
		if(err) {return next(err);}
		res.json(posts);
	})
})

//POST posts
router.post('/posts', auth, function(req, res, next){
	var post = new Post(req.body);
	//getting author's name from token's payload
	post.author = req.payload.username;

	post.save(function(err, post){
		if(err){return next(err);}
		res.json(post);
	});

});

//Helper method to get post by Id  
router.param('post', function(req, res, next, id){
	var query = Post.findById(id);

	query.exec(function(err, post){
		if(err) {return next(err); }
		if(!post) {return next(new Error('can\'t find post')); }

		req.post = post;
		return next();
	});
});

//GET post by Id
router.get('/posts/:post', function(req, res, next) {
	//loads comments
	req.post.populate('comments', function(err, post){
		if(err) {return next(err);}
		res.json(post)
	});
});

//PUT to upvote post
router.put('/posts/:post/upvote', auth, function(req, res, next){
	req.post.upvote(function(err, post){
		if(err) {return next(err);}
		res.json(post);
	});
});

//POST comment to post
router.post('/posts/:post/comments', auth function(req, res, next){
	var comment = new Comment(req.body);

	//getting author's name from token's payload
	comment.author = req.payload.username;

	comment.save(function(err,comment){
		if(err){return next(err);}

		req.post.comments.push(comment);
		req.post.save(function(err,post){
			if(err){return next(err);}
			res.json(comment);
		}); 
	});
});

//Helper method to GET comment
router.param('comment', function(req, res, next, id){
	var query = Comment.findById(id);

	query.exec(function(err, comment){
		if(err) {return next(error);}
		if(!comment) {return next(new Error('can\'t find comment'));}

		req.comment = comment;
		return next();
	});
});

//PUT to upvote comment
router.put('/posts/:post/comments/:comment/upvote', function(req, res, next){
	req.comment.upvote(function(err, comment){
		if(err) { return next(err);}
		res.json(comment);
	});
});

//POST for user login and authentication
router.post('/register', function(req, res, next){
	if(req.body.username || !req.body.password){
		return res.status(400).json({message: 'Please fill out all forms'});
	}

	var user = new User();
	user.username = req.body.username;
	user.setPassword(req.body.password);
});







