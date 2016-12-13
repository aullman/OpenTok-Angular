describe('opentok-angular', function () {
  var OTSession, session, $rootScope, subscriber;
  beforeEach(function () {
    module('opentok', function () {
      OT.initSession = function () {
        session = {
          isConnected: jasmine.createSpy('isConnected').and.returnValue(true),
          signal: jasmine.createSpy('signal'),
          connect: jasmine.createSpy('connect'),
          publish: jasmine.createSpy('publish'),
          unpublish: jasmine.createSpy('unpublish'),
          subscribe: function () {
            subscriber = {};
            OT.$.eventing(subscriber);
            return subscriber;
          },
          unsubscribe: jasmine.createSpy('unsubscribe'),
          connection: {
            connectionId: 'sessionConnectionId'
          }
        };
        OT.$.eventing(session);
        spyOn(session, 'subscribe').and.callThrough();
        spyOn(session, 'on').and.callThrough();
        return session;
      };
      spyOn(OT, 'initSession').and.callThrough();
    });
    inject(function (_OTSession_, _$rootScope_) {
      OTSession = _OTSession_;
      spyOn(OTSession, 'trigger');
      $rootScope = _$rootScope_;
    });
  });

  describe('OTSession', function () {
    it('defines the right api', function () {
      expect(OTSession.init).toEqual(jasmine.any(Function));
      expect(OTSession.streams).toEqual(jasmine.any(Array));
      expect(OTSession.publishers).toEqual(jasmine.any(Array));
    });

    describe('init called', function () {
      var apiKey = 'mockAPIKey',
        sessionId = 'mockSessionId',
        token = 'mockToken',
        cb = jasmine.createSpy('cb');
      beforeEach(function () {
        OTSession.init(apiKey, sessionId, token, cb);
      });

      it('calls OT.initSession, session.on and session.connect when you call init', function () {
        expect(OT.initSession).toHaveBeenCalledWith(apiKey, sessionId);
        expect(OTSession.session).toBeDefined();
        expect(OTSession.session.on).toHaveBeenCalledWith(jasmine.objectContaining({
          streamCreated: jasmine.any(Function),
          streamDestroyed: jasmine.any(Function)
        }));
        expect(OTSession.session.connect).toHaveBeenCalledWith(token,
          jasmine.any(Function));
      });

      it('triggers init on init', function () {
        expect(OTSession.trigger).toHaveBeenCalledWith('init');
      });

      it('adds streams on streamCreated', function (done) {
        var stream = {};
        session.trigger('streamCreated', {stream: stream});
        setTimeout(function () {
          expect(OTSession.streams).toContain(stream);
          done();
        }, 10);
      });

      it('removes streams on streamDestroyed', function (done) {
        var stream = {};
        session.trigger('streamCreated', {stream: stream});
        session.trigger('streamDestroyed', {stream: stream});
        setTimeout(function () {
          expect(OTSession.streams).not.toContain(stream);
          done();
        }, 10);
      });

      it('adds connections on connectionCreated', function (done) {
        var connection = {};
        session.trigger('connectionCreated', {connection: connection});
        setTimeout(function () {
          expect(OTSession.connections).toContain(connection);
          done();
        }, 10);
      });

      it('removes connections on connectionDestroyed', function (done) {
        var connection = {};
        session.trigger('connectionCreated', {connection: connection});
        session.trigger('connectionDestroyed', {connection: connection});
        setTimeout(function () {
          expect(OTSession.connections).not.toContain(connection);
          done();
        }, 10);
      });

      it('empties the streams array on sessionDisconnected', function (done) {
        session.trigger('streamCreated', {stream: {}});
        session.trigger('streamCreated', {stream: {}});
        session.trigger('streamCreated', {stream: {}});
        session.trigger('sessionDisconnected');
        setTimeout(function () {
          expect(OTSession.streams.length).toBe(0);
          done();
        }, 10);
      });

      it('empties the connections array on sessionDisconnected', function (done) {
        session.trigger('connectionCreated', {connection: {}});
        session.trigger('connectionCreated', {connection: {}});
        session.trigger('connectionCreated', {connection: {}});
        session.trigger('sessionDisconnected');
        setTimeout(function () {
          expect(OTSession.connections.length).toBe(0);
          done();
        }, 10);
      });

      it('publishes publishers on sessionConnected', function (done) {
        var publisher = {};
        OTSession.publishers.push(publisher);
        session.trigger('sessionConnected');
        setTimeout(function () {
          expect(session.publish).toHaveBeenCalledWith(publisher, jasmine.any(Function));
          done();
        }, 10);
      });

      it('handles publish errors', function(done) {
        var publisher = {};
        OTSession.publishers.push(publisher);
        session.trigger('sessionConnected');
        $rootScope.$on('otPublisherError', done);
        setTimeout(function () {
          var callback = session.publish.calls.mostRecent().args[1];
          callback('error');
        }, 10);
      });

      it('triggers otPublisherAdded when you add a publisher', function() {
        var publisher = {};
        OTSession.addPublisher(publisher);
        expect(OTSession.publishers).toContain(publisher);
        expect(OTSession.trigger).toHaveBeenCalledWith('otPublisherAdded');
      });
    });
  });
  describe('directives:', function () {
    beforeEach(function () {
      var apiKey = 'mockAPIKey',
        sessionId = 'mockSessionId',
        token = 'mockToken',
        cb = jasmine.createSpy('cb');
      OTSession.init(apiKey, sessionId, token, cb);
    });

    describe('ot-layout', function () {
      var element, scope, layout, $window;
      beforeEach(inject(function ($rootScope, $compile, _$window_) {
        $window = _$window_;
        var oldInitLayoutContainer = initLayoutContainer;
        initLayoutContainer = function () {
          var container = oldInitLayoutContainer.apply(this, arguments);
          layout = container.layout = jasmine.createSpy('layout').and.callFake(container.layout);
          return container;
        };
        spyOn(window, 'initLayoutContainer').and.callThrough();
        scope = $rootScope.$new();
        element = '<ot-layout props="{animate:true}"></ot-layout>';
        element = $compile(element)(scope);
        scope.$digest();
      }));

      afterEach(function () {
        scope = null;
      });

      it('calls initLayoutContainer with the right props', function () {
        expect(initLayoutContainer).toHaveBeenCalledWith(element[0], jasmine.objectContaining({
          animate: true
        }));
      });

      it('calls layout if you add a child', function (done) {
        var numCalls = layout.calls.count();
        var removeHandler = scope.$on('otLayoutComplete', function () {
          removeHandler();
          expect(layout.calls.count()).toBeGreaterThan(numCalls);
          done();
        });
        element.append(angular.element('<div></div>'));
        scope.$digest();
      });

      it('calls layout if you get a streamPropertyChanged for videoDimentions', function (done) {
        var numCalls = layout.calls.count();
        var removeHandler = scope.$on('otLayoutComplete', function () {
          removeHandler();
          expect(layout.calls.count()).toBeGreaterThan(numCalls);
          done();
        });
        session.trigger('streamPropertyChanged', {changedProperty: 'videoDimensions'});
      });

      it ('calls layout if the window resizes', function (done) {
        var numCalls = layout.calls.count();
        var removeHandler = scope.$on('otLayoutComplete', function () {
          removeHandler();
          expect(layout.calls.count()).toBeGreaterThan(numCalls);
          done();
        });
        $window.dispatchEvent(new Event('resize'));
      });
    });

    describe('ot-publisher', function () {
      var element, scope, publisher;
      beforeEach(inject(function ($rootScope, $compile) {
        OTSession.init('mockAPIKey', 'mockSessionId', 'mockToken');
        spyOn(OT, 'initPublisher').and.callFake(function () {
          var publisher = {
            destroy: jasmine.createSpy('destroy')
          };
          OT.$.eventing(publisher);
          return publisher;
        });
        scope = $rootScope.$new();
        element = '<ot-publisher apiKey="mockAPIKey" props="{name:\'mockName\'}" ' +
          'style="width:200px;height:300px;"><div id="contents"></div></ot-publisher>';
        element = $compile(element)(scope);
        scope.$digest();
        publisher = element.isolateScope().publisher;
      }));

      it('calls initPublisher and defines scope.publisher', function () {
        expect(OT.initPublisher).toHaveBeenCalledWith('mockAPIKey', element[0],
          jasmine.objectContaining({name: 'mockName'}), jasmine.any(Function));
        expect(publisher).toBeDefined();
      });

      it('maintains the contents of <ot-publisher>', function () {
        expect(element.find('#contents').length).toBe(1);
      });

      it('emits otLayout when the publisher is loaded', function (done) {
        scope.$on('otLayout', done);
        publisher.trigger('loaded');
      });

      it('adds an allowed class', function (done) {
        publisher.trigger('accessAllowed');
        setTimeout(function () {
          expect(element[0].className).toContain('allowed');
          done();
        }, 10);
      });

      it('emits otAccessAllowed on publisher accessAllowed', function (done) {
        scope.$on('otAccessAllowed', done);
        publisher.trigger('accessAllowed');
      });

      it('emits otAccessDenied on publisher accessDenied', function (done) {
        scope.$on('otAccessDenied', done);
        publisher.trigger('accessDenied');
      });

      it('emits otAccessDialogOpened on publisher accessDialogOpened', function (done) {
        scope.$on('otAccessDialogOpened', done);
        publisher.trigger('accessDialogOpened');
      });

      it('emits otAccessDialogClosed on publisher accessDialogClosed', function (done) {
        scope.$on('otAccessDialogClosed', done);
        publisher.trigger('accessDialogClosed');
      });

      it('adds the publisher to the OTSession.publishers', function () {
        expect(OTSession.publishers).toContain(publisher);
      });

      it('calls session.publish if there is a session', function () {
        expect(session.publish).toHaveBeenCalledWith(publisher, jasmine.any(Function));
      });

      it('cleans up when its destroyed', function (done) {
        element.isolateScope().$emit('$destroy');
        setTimeout(function () {
          expect(session.unpublish).toHaveBeenCalledWith(publisher);
          expect(OTSession.publishers.length).toBe(0);
          expect(element.isolateScope().publisher).toBeNull();
          done();
        }, 10);
      });

      it('emits otPublisherError if there is an error on initPublisher', function (done) {
        scope.$on('otPublisherError', done);
        OT.initPublisher.calls.argsFor(0)[3]({});
      });

      it('emits otPublisherError if there is an error on session.publish', function (done) {
        scope.$on('otPublisherError', done);
        session.publish.calls.argsFor(0)[1]({});
      });

      it('uses the right width and height', function () {
        expect(OT.initPublisher.calls.argsFor(0)[2].width).toBe(200);
        expect(OT.initPublisher.calls.argsFor(0)[2].height).toBe(300);
      });
    });

    describe('ot-subscriber', function () {
      var element, scope;
      beforeEach(inject(function ($rootScope, $compile) {
        OTSession.init('mockAPIKey', 'mockSessionId', 'mockToken');
        scope = $rootScope.$new();
        scope.stream = {};
        element = '<ot-subscriber stream="stream" props="{subscribeToVideo:false}" ' +
          'style="width:200px;height:300px;"><div id="contents"></div></ot-publisher>';
        element = $compile(element)(scope);
        scope.$digest();
      }));

      it('calls session.subscribe', function () {
        expect(session.subscribe).toHaveBeenCalledWith(scope.stream, element[0],
          jasmine.objectContaining({
            subscribeToVideo: false
          }), jasmine.any(Function));
      });

      it('maintains the contents of <ot-subscriber>', function () {
        expect(element.find('#contents').length).toBe(1);
      });

      it('cleans up when its destroyed', function (done) {
        element.isolateScope().$emit('$destroy');
        setTimeout(function () {
          expect(session.unsubscribe).toHaveBeenCalled();
          done();
        }, 10);
      });

      it('emits an otLayout when loaded', function (done) {
        scope.$on('otLayout', done);
        subscriber.trigger('loaded');
      });

      it('emits an otSubscriberError if there is an error on subscribe', function (done) {
        scope.$on('otSubscriberError', done);
        session.subscribe.calls.argsFor(0)[3]({});
      });

      it('uses the right width and height', function () {
        expect(session.subscribe.calls.argsFor(0)[2].width).toBe(200);
        expect(session.subscribe.calls.argsFor(0)[2].height).toBe(300);
      });
    });
  });

});
