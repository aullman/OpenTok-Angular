/*!
 *  opentok-angular (https://github.com/aullman/OpenTok-Angular)
 *  
 *  Angular module for OpenTok
 *
 *  @Author: Adam Ullman (http://github.com/aullman)
 *  @Copyright (c) 2014 Adam Ullman
 *  @License: Released under the MIT license (http://opensource.org/licenses/MIT)
**/

if (!window.TB) throw new Error("You must include the TB library before the TB_Angular library");

var OpenTokAngular = angular.module('opentok', [])
.factory("TB", function () {
    return TB;
})
.factory("OTReady", ['$document', function ($document) {
  var ready = false;
  $document.context.addEventListener('deviceReady', function () {
    ready = true;
  });
  
  return (function(fn){
    if (ready) {
      fn();
    } else {
      $document.context.addEventListener('deviceReady', fn);
    }
  });
}])
.factory("OTSession", ['TB', '$rootScope', 'OTReady', function (TB, $rootScope, OTReady) {
    var OTSession = {
        streams: [],
        publishers: [],
        init: function (apiKey, sessionId, token, cb) {
          OTReady(function () {
            OTSession.session = TB.initSession(apiKey, sessionId);
            
            OTSession.session.on({
                sessionConnected: function(event) {
                    OTSession.publishers.forEach(function (publisher) {
                        OTSession.session.publish(publisher);
                    });
                },
                streamCreated: function(event) {
                    $rootScope.$apply(function() {
                        OTSession.streams.push(event.stream);
                    });
                },
                streamDestroyed: function(event) {
                    $rootScope.$apply(function() {
                        OTSession.streams.splice(OTSession.streams.indexOf(event.stream), 1);
                    });
                },
                sessionDisconnected: function(event) {
                    $rootScope.$apply(function() {
                        OTSession.streams.splice(0, OTSession.streams.length);
                    });
                }
            });
            
            if (cb) cb(null, OTSession.session);
            OTSession.session.connect(token);
          });
        }
    };
    return OTSession;
}])
.directive('otLayout', ['$window', '$parse', 'TB', function($window, $parse, TB) {
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
            var props = $parse(attrs.props)();
            var container = TB.initLayoutContainer(element[0], props);
            scope.$watch(function() {
                return element.children().length;
            }, function () {
                container.layout();
                setTimeout(function () {
                    TB.updateViews();
                }, 100);
            });
            $window.addEventListener("resize", container.layout);
            scope.$on("otLayout", function() {
                container.layout();
                setTimeout(function () {
                    TB.updateViews();
                }, 100);
            });
        }
    };
}])
.directive('otPublisher', ['$document', '$window', 'OTSession', function($document, $window, OTSession) {
    return {
        restrict: 'E',
        scope: {
            props: '&'
        },
        link: function(scope, element, attrs){
            document.addEventListener('deviceReady', function () {
                var props = scope.props() || {};
                props.width = props.width ? props.width : angular.element(element).css("width");
                props.height = props.height ? props.height : angular.element(element).css("height");
                var oldChildren = angular.element(element).children();
                if (!element[0].getAttribute('id')) {
                    element[0].setAttribute('id', 'OTPublisher');
                }
                scope.publisher = TB.initPublisher(attrs.apikey || OTSession.session.apiKey,
                    element[0].getAttribute('id'), props, function (err) {
                    if (err) {
                        scope.$emit("otPublisherError", err, scope.publisher);
                    }
                });
                // Make transcluding work manually by putting the children back in there
                angular.element(element).append(oldChildren);
                // scope.publisher.on({
                //     accessAllowed: function(event) {
                //         $(element).addClass("allowed");
                //     },
                //     loaded: function (event){
                //         scope.$emit("otLayout");
                //     }
                // });
                setTimeout(function () {
                    scope.$emit("otLayout");
                }, 1000);
                if (OTSession.session && (OTSession.session.connected ||
                        (OTSession.session.isConnected && OTSession.session.isConnected()))) {
                    OTSession.session.publish(scope.publisher, function (err) {
                        if (err) {
                            scope.$emit("otPublisherError", err, scope.publisher);
                        }
                    });
                }
                OTSession.publishers.push(scope.publisher);
            });
            scope.$on("$destroy", function () {
                if (scope.session) scope.session.unpublish(scope.publisher);
                scope.publisher.destroy();
                OTSession.publishers = OTSession.publishers.filter(function (publisher) {
                    return publisher !== scope.publisher;
                });
                scope.publisher = null;
            });
        }
    };
}])
.directive('otSubscriber', ['OTSession', function(OTSession) {
    return {
        restrict: 'E',
        scope: {
            stream: '=',
            props: '&'
        },
        link: function(scope, element, attrs){
            var stream = scope.stream,
                props = scope.props() || {};
            props.width = props.width ? props.width : angular.element(element).css("width");
            props.height = props.height ? props.height : angular.element(element).css("height");
            var oldChildren = angular.element(element).children();
            element[0].setAttribute('id', stream.streamId);
            var subscriber = OTSession.session.subscribe(stream, element[0].getAttribute('id'), props, function (err) {
                if (err) {
                    scope.$emit("otSubscriberError", err, subscriber);
                }
            });
            // subscriber.on("loaded", function () {
            //     scope.$emit("otLayout");
            // });
            setTimeout(function () {
                scope.$emit("otLayout");
            }, 1000);
            // Make transcluding work manually by putting the children back in there
            angular.element(element).append(oldChildren);
            scope.$on("$destroy", function () {
                //subscriber.destroy();
            });
        }
    };
}]);