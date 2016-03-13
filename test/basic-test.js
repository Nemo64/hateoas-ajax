/* jshint expr: true */
/* globals rawPosts, rawComments, fixture */
describe('<hateoas-ajax> basic', function() {

  var server;
  var xhrSpy;

  before(function() {
    server = sinon.fakeServer.create({
      autoRespond: true
    });

    server.respondWith('GET', '/posts', function(request) {

      var postsResponse = _.transform(rawPosts, function(result, post) {
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
        result._embedded.posts.push(tPost);
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

    server.respondWith('GET', '/comments', function(request) {

      var commentsResponse = _.transform(rawComments, function(result, comment) {
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
        result._embedded.comments.push(tComment);
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

    server.respondWith(/\/posts\/(\d+)\/comments/, function(request, id) {
      id = parseInt(id, 10);
      var commentsResponse = _.transform(rawComments, function(result, comment) {
        if (comment.postId === id) {
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
          result._embedded.comments.push(tComment);
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

    server.respondWith(/\/comments\/(\d+)\/post/, function(request, id) {
      id = parseInt(id, 10);

      var comment = _.find(rawComments, {
        id: id
      });

      var post = _.find(rawPosts, {
        id: comment.postId
      });

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

      request.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify(tPost));
    });

    xhrSpy = sinon.spy(server, 'handleRequest');
  });

  describe('when making simple GET requests', function() {

    var posts;
    var request;

    it('should fire 1 xhr request', function() {
      posts = fixture('posts');
      request = posts.generateRequest();

      expect(xhrSpy).to.be.calledOnce;
    });

    it('should have embedded resources', function(done) {
      request.completes.then(function() {
        expect(request.response.posts).to.be.an('array');
        done();
      });
    });

    describe('when accessing one-to-many linked resources', function() {

      it('should fire 1 xhr request', function() {
        request.response.posts[0].comments;

        expect(xhrSpy).to.be.calledOnce;
      });

      it('should be able to access linked collection of resources', function(done) {
        request.response.posts[0].commentsHandler.lastRequest.completes.then(function() {
          expect(request.response.posts[0].comments.comments).to.be.an('array');
          done();
        });
      });

      afterEach(function() {
        xhrSpy.reset();
      });
    });

    describe('when accessing many-to-one linked resource', function() {

      var comment;

      before(function() {
        comment = request.response.posts[0].comments.comments[0];
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

      afterEach(function() {
        xhrSpy.reset();
      });
    });

    afterEach(function() {
      xhrSpy.reset();
    });

  });

  after(function() {
    server.restore();
  });

});
