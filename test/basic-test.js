/* jshint expr: true */
/* globals rawPosts, rawComments, fixture */
describe('<hateoas-ajax> basic', function() {

  var server;
  var xhrSpy;

  before(function() {
    server = sinon.fakeServer.create({
      autoRespond: true
    });

    var formPost = function(post) {
      var tPost = _.defaults({
        '_links': {
          self: {
            href: '/posts/' + post.id
          },
          post: {
            href: '/posts/' + post.id
          },
          comments: {
            href: '/posts/' + post.id + '/comments'
          }
        }
      }, post);
      delete tPost.id;
      return tPost;
    };

    server.respondWith('GET', '/posts', function(request) {

      var postsResponse = _.transform(rawPosts, function(result, post) {
        result._embedded.posts.push(formPost(post));
      }, {
        _embedded: {
          posts: []
        },
        _links: {
          self: {
            href: '/posts'
          }
        }
      });
      request.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify(postsResponse));
    });

    server.respondWith(/^\/posts\/(\d+)$/, function(request, id) {
      id = parseInt(id, 10);

      var post = _.find(rawPosts, {
        id: id
      });

      request.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify(formPost(post)));
    });

    var formComment = function(comment) {
      var tComment = _.defaults({
        '_links': {
          self: {
            href: '/comments/' + comment.id
          },
          comment: {
            href: '/comments/' + comment.id
          },
          post: {
            href: '/comments/' + comment.id + '/post'
          }
        }
      }, comment);
      delete tComment.id;
      return tComment;
    };

    server.respondWith('GET', '/comments', function(request) {

      var commentsResponse = _.transform(rawComments, function(result, comment) {
        result._embedded.comments.push(formComment(comment));
      }, {
        _embedded: {
          comments: []
        },
        _links: {
          self: {
            href: '/comments'
          }
        }
      });

      request.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify(commentsResponse));
    });

    server.respondWith(/^\/comments\/(\d+)$/, function(request, id) {
      id = parseInt(id, 10);

      var comment = _.find(rawComments, {
        id: id
      });

      request.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify(formComment(comment)));
    });

    server.respondWith(/^\/posts\/(\d+)\/comments$/, function(request, id) {
      id = parseInt(id, 10);
      var commentsResponse = _.transform(rawComments, function(result, comment) {
        if (comment.postId === id) {
          result._embedded.comments.push(formComment(comment));
        }
      }, {
        _embedded: {
          comments: []
        },
        _links: {
          self: {
            href: '/comments'
          }
        }
      });

      request.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify(commentsResponse));
    });

    server.respondWith(/^\/comments\/(\d+)\/post$/, function(request, id) {
      id = parseInt(id, 10);

      var comment = _.find(rawComments, {
        id: id
      });

      var post = _.find(rawPosts, {
        id: comment.postId
      });

      request.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify(formPost(post)));
    });

    xhrSpy = sinon.spy(server, 'handleRequest');
  });

  var oneToManyTests = function(getPostObject) {
    return function() {

      var post;

      before(function() {
        post = getPostObject();
      });

      it('should fire 1 xhr request', function() {
        post.comments;

        expect(xhrSpy).to.be.calledOnce;
      });

      it('should be able to access linked collection of resources', function(done) {
        post.commentsHandler.lastRequest.completes.then(function() {
          expect(post.comments.comments).to.be.an('array');
          done();
        });
      });

      it('should have self handlers', function() {
        expect(post.deleteSelf).to.be.an('function');
        expect(post.deletePost).to.be.an('function');
        expect(post.postSelf).to.be.an('function');
        expect(post.postPost).to.be.an('function');
        expect(post.putSelf).to.be.an('function');
        expect(post.putPost).to.be.an('function');
      });

      it('should have relation handlers', function() {
        expect(post.deleteComments).to.be.an('function');
        expect(post.postComments).to.be.an('function');
        expect(post.putComments).to.be.an('function');
      });

      afterEach(function() {
        xhrSpy.reset();
      });
    };
  };

  var manyToOneTests = function(getCommentObject) {
    return function() {
      var comment;

      before(function() {
        comment = getCommentObject();
      });

      it('should fire 1 xhr request', function() {
        comment.post;

        expect(xhrSpy).to.be.calledOnce;
      });

      it('should be able to access linked resource', function(done) {
        comment.postHandler.lastRequest.completes.then(function() {
          expect(comment.post).to.be.an('object');
          done();
        });
      });

      it('should have self handlers', function() {
        expect(comment.deleteSelf).to.be.an('function');
        expect(comment.deleteComment).to.be.an('function');
        expect(comment.postSelf).to.be.an('function');
        expect(comment.postComment).to.be.an('function');
        expect(comment.putSelf).to.be.an('function');
        expect(comment.putComment).to.be.an('function');
      });

      it('should have relation handlers', function() {
        expect(comment.deletePost).to.be.an('function');
        expect(comment.postPost).to.be.an('function');
        expect(comment.putPost).to.be.an('function');
      });

      afterEach(function() {
        xhrSpy.reset();
      });
    };
  };

  describe('when accessing a resource collection (GET all)', function() {

    var posts;
    var request;

    it('should fire 1 xhr request', function() {
      posts = fixture('posts');
      request = posts.generateRequest();

      expect(xhrSpy).to.be.calledOnce;
    });

    it('should have embedded resources within the response', function(done) {
      request.completes.then(function() {
        expect(request.response.posts).to.be.an('array');
        done();
      });
    });

    describe('when accessing one-to-many linked resources', oneToManyTests(function() {
      return request.response.posts[0];
    }));

    describe('when accessing many-to-one linked resource', manyToOneTests(function() {
      return request.response.posts[0].comments.comments[0];
    }));

    afterEach(function() {
      xhrSpy.reset();
    });

  });

  describe('when accessing a single resource (GET by id)', function() {

    var post;
    var request;

    it('should fire 1 xhr request', function() {
      post = fixture('post');
      request = post.generateRequest();

      expect(xhrSpy).to.be.calledOnce;
    });

    it('should have resource at root of response', function(done) {
      request.completes.then(function() {
        expect(request.response).to.be.an('object');
        expect(request.response.title).to.be.an('string');
        expect(request.response.title).to.equal('sunt aut facere repellat provident occaecati excepturi optio reprehenderit');
        done();
      });
    });

    describe('when accessing one-to-many linked resources', oneToManyTests(function() {
      return request.response;
    }));

    describe('when accessing many-to-one linked resource', manyToOneTests(function() {
      return request.response.comments.comments[0];
    }));

    afterEach(function() {
      xhrSpy.reset();
    });

  });

  after(function() {
    server.restore();
  });

});
