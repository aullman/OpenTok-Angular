/*!
 *  opentok-angular (https://github.com/aullman/OpenTok-Angular)
 *
 *  Angular module for OpenTok
 *
 *  @Author: Adam Ullman (http://github.com/aullman)
 *  @Copyright (c) 2014 Adam Ullman
 *  @License: Released under the MIT license (http://opensource.org/licenses/MIT)
 **/

if (!window.OT) throw new Error('You must include the OT library before the OT_Angular library');

var ng;
if (typeof angular === 'undefined' && typeof require !== 'undefined') {
  ng = require('angular');
} else {
  ng = angular;
}
var initLayoutContainer;
if (!window.hasOwnProperty('initLayoutContainer') && typeof require !== 'undefined') {
  initLayoutContainer = require('opentok-layout-js').initLayoutContainer;
} else {
  initLayoutContainer = window.initLayoutContainer;
}

ng.module('opentok', [])
  .factory('OT', function() {
    return OT;
  })
  .factory('OTSession', ['OT', '$rootScope',
    function(OT, $rootScope) {
      var OTSession = {
        streams: [],
        connections: [],
        publishers: [],
        init: function(apiKey, sessionId, token, cb) {
          this.session = OT.initSession(apiKey, sessionId);

          OTSession.session.on({
            sessionConnected: function() {
              OTSession.publishers.forEach(function(publisher) {
                OTSession.session.publish(publisher, function(err) {
                  if (err) {
                    $rootScope.$broadcast('otPublisherError', err, publisher);
                  }
                });
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
            sessionDisconnected: function() {
              $rootScope.$apply(function() {
                OTSession.streams.splice(0, OTSession.streams.length);
                OTSession.connections.splice(0, OTSession.connections.length);
              });
            },
            connectionCreated: function(event) {
              $rootScope.$apply(function() {
                OTSession.connections.push(event.connection);
              });
            },
            connectionDestroyed: function(event) {
              $rootScope.$apply(function() {
                OTSession.connections.splice(OTSession.connections.indexOf(event.connection), 1);
              });
            }
          });

          this.session.connect(token, function(err) {
            if (cb) cb(err, OTSession.session);
          });
          this.trigger('init');
        },
        addPublisher: function(publisher) {
          this.publishers.push(publisher);
          this.trigger('otPublisherAdded');
        }
      };
      OT.$.eventing(OTSession);
      return OTSession;
    }
  ])
  .directive('otLayout', ['$window', '$parse', 'OT', 'OTSession',
    function($window, $parse, OT, OTSession) {
      return {
        restrict: 'E',
        link: function(scope, element, attrs) {
          var props = $parse(attrs.props)();
          var container = initLayoutContainer(element[0], props);
          var layout = function() {
            container.layout();
            scope.$emit('otLayoutComplete');
          };
          scope.$watch(function() {
            return element.children().length;
          }, layout);
          $window.addEventListener('resize', layout);
          scope.$on('otLayout', layout);
          var listenForStreamChange = function listenForStreamChange() {
            OTSession.session.on('streamPropertyChanged', function(event) {
              if (event.changedProperty === 'videoDimensions') {
                layout();
              }
            });
          };
          if (OTSession.session) listenForStreamChange();
          else OTSession.on('init', listenForStreamChange);
        }
      };
    }
  ])
  .directive('otPublisher', ['OTSession',
    function(OTSession) {
      return {
        restrict: 'E',
        scope: {
          props: '&'
        },
        link: function(scope, element, attrs) {
          var props = scope.props() || {};
          props.width = props.width ? props.width : ng.element(element).width();
          props.height = props.height ? props.height : ng.element(element).height();
          var oldChildren = ng.element(element).children();
          scope.publisher = OT.initPublisher(attrs.apikey || OTSession.session.apiKey,
            element[0], props, function(err) {
              if (err) {
                scope.$emit('otPublisherError', err, scope.publisher);
              }
            });
          // Make transcluding work manually by putting the children back in there
          ng.element(element).append(oldChildren);
          scope.publisher.on({
            accessDenied: function() {
              scope.$emit('otAccessDenied');
            },
            accessDialogOpened: function() {
              scope.$emit('otAccessDialogOpened');
            },
            accessDialogClosed: function() {
              scope.$emit('otAccessDialogClosed');
            },
            accessAllowed: function() {
              ng.element(element).addClass('allowed');
              scope.$emit('otAccessAllowed');
            },
            loaded: function() {
              scope.$emit('otLayout');
            },
            streamCreated: function() {
              scope.$emit('otStreamCreated');
            },
            streamDestroyed: function() {
              scope.$emit('otStreamDestroyed');
            }
          });
          scope.$on('$destroy', function() {
            if (OTSession.session) OTSession.session.unpublish(scope.publisher);
            else scope.publisher.destroy();
            OTSession.publishers = OTSession.publishers.filter(function(publisher) {
              return publisher !== scope.publisher;
            });
            scope.publisher = null;
          });
          if (OTSession.session && (OTSession.session.connected ||
            (OTSession.session.isConnected && OTSession.session.isConnected()))) {
            OTSession.session.publish(scope.publisher, function(err) {
              if (err) {
                scope.$emit('otPublisherError', err, scope.publisher);
              }
            });
          }
          OTSession.addPublisher(scope.publisher);
        }
      };
    }
  ])
  .directive('otSubscriber', ['OTSession',
    function(OTSession) {
      return {
        restrict: 'E',
        scope: {
          stream: '=',
          props: '&'
        },
        link: function(scope, element) {
          var stream = scope.stream,
            props = scope.props() || {};
          props.width = props.width ? props.width : ng.element(element).width();
          props.height = props.height ? props.height : ng.element(element).height();
          var oldChildren = ng.element(element).children();
          var subscriber = OTSession.session.subscribe(stream, element[0], props, function(err) {
            if (err) {
              scope.$emit('otSubscriberError', err, subscriber);
            }
          });
          subscriber.on('loaded', function() {
            scope.$emit('otLayout');
          });
          // Make transcluding work manually by putting the children back in there
          ng.element(element).append(oldChildren);
          scope.$on('$destroy', function() {
            OTSession.session.unsubscribe(subscriber);
          });
        }
      };
    }
  ]);
