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
.factory("OTSession", ['TB', '$rootScope', function (TB, $rootScope) {
    var OTSession = {
        streams: [],
        publishers: [],
        init: function (apiKey, sessionId, token, cb) {
            this.session = TB.initSession(sessionId);
            
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
            
            this.session.connect(apiKey, token, function (err) {
                if (cb) cb(err, OTSession.session);
            });
            this.trigger('init');
        }
    };
    TB.$.eventing(OTSession);
    return OTSession;
}])
.directive('otLayout', ['$window', '$parse', 'TB', 'OTSession', function($window, $parse, TB, OTSession) {
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
            var props = $parse(attrs.props)();
            var container = TB.initLayoutContainer(element[0], props);
            scope.$watch(function() {
                return element.children().length;
            }, container.layout);
            $window.addEventListener("resize", container.layout);
            scope.$on("otLayout", container.layout);
            var listenForStreamChange = function listenForStreamChange(session) {
                OTSession.session.on("streamPropertyChanged", function (event) {
                    if (event.changedProperty === 'videoDimensions') {
                        container.layout();
                    }
                });
            };
            if (OTSession.session) listenForStreamChange();
            else OTSession.on("init", listenForStreamChange);
        }
    };
}])
.directive('otPublisher', ['OTSession', function(OTSession) {
    return {
        restrict: 'E',
        scope: {
            props: '&'
        },
        link: function(scope, element, attrs){
            var props = scope.props() || {};
            props.width = props.width ? props.width : $(element).width();
            props.height = props.height ? props.height : $(element).height();
            var oldChildren = $(element).children();
            scope.publisher = TB.initPublisher(attrs.apikey || OTSession.session.apiKey,
                element[0], props, function (err) {
                if (err) {
                    scope.$emit("otPublisherError", err, scope.publisher);
                }
            });
            // Make transcluding work manually by putting the children back in there
            $(element).append(oldChildren);
            scope.publisher.on({
                accessDenied: function (event) {
                    scope.$emit("otAccessDenied");
                },
                accessDialogOpened: function (event) {
                    scope.$emit("otAccessDialogOpened");
                },
                accessDialogClosed: function(event){
                    scope.$emit("otAccessDialogClosed");
                },
                accessAllowed: function(event) {
                    $(element).addClass("allowed");
                    scope.$emit("otAccessAllowed");
                },
                loaded: function (event){
                    scope.$emit("otLayout");
                }
            });
            scope.$on("$destroy", function () {
                if (OTSession.session) OTSession.session.unpublish(scope.publisher);
                else scope.publisher.destroy();
                OTSession.publishers = OTSession.publishers.filter(function (publisher) {
                    return publisher !== scope.publisher;
                });
                scope.publisher = null;
            });
            if (OTSession.session && (OTSession.session.connected ||
                    (OTSession.session.isConnected && OTSession.session.isConnected()))) {
                OTSession.session.publish(scope.publisher, function (err) {
                    if (err) {
                        scope.$emit("otPublisherError", err, scope.publisher);
                    }
                });
            }
            OTSession.publishers.push(scope.publisher);
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
            props.width = props.width ? props.width : $(element).width();
            props.height = props.height ? props.height : $(element).height();
            var oldChildren = $(element).children();
            var subscriber = OTSession.session.subscribe(stream, element[0], props, function (err) {
                if (err) {
                    scope.$emit("otSubscriberError", err, subscriber);
                }
            });
            subscriber.on("loaded", function () {
                scope.$emit("otLayout");
            });
            // Make transcluding work manually by putting the children back in there
            $(element).append(oldChildren);
            scope.$on("$destroy", function () {
                OTSession.session.unsubscribe(subscriber);
            });
        }
    };
}]);