if (!TB) throw new Error("You must include the TB library before the TB_Angular library");

if (!TB.angular) TB.angular = {};

TB.angular.createOpentokCtrl = function(apiKey, sessionId, token) {
    return function($scope) {
        $scope.streams = [];
        $scope.publisher;

        $scope.session = TB.initSession(sessionId);

        var addStreams = function addStreams(streams) {
            $scope.$apply(function() {
                $scope.streams = $scope.streams.concat(streams);
            });
        };

        var removeStreams = function removeStreams(streams) {
            for (var i = 0; i < streams.length; i++) {
                for (var j = 0; j < $scope.streams.length; j++) {
                    if (streams[i].streamId == $scope.streams[j].streamId) {
                        $scope.$apply(function() {
                            $scope.streams.splice(j, 1);
                        });
                        break;
                    }
                };
            };
        };

        $scope.session.on({
            sessionConnected: function(event) {
                addStreams(event.streams);
                $scope.session.publish($scope.publisher);
            },
            streamCreated: function(event) {
                addStreams(event.streams);
            },
            streamDestroyed: function(event) {
                removeStreams(event.streams);
            },
            sessionDisconnected: function(event) {
                $scope.$apply(function() {
                    $scope.streams = [];
                });
            }
        });

        $scope.notMine = function(stream) {
            return stream.connection.connectionId != $scope.session.connection.connectionId;
        };

        $scope.session.connect(apiKey, token);
    };
}


TB.angular.LayoutDirective = function($window) {
    return {
        restrict: 'E',
        link: function(scope, element, attrs){
            var layout = function() {
                $(element).layout({
                    animate: true
                });
            };
            scope.$watch(function() {
                return element.children().length;
            }, layout);
            $window.onresize = layout;                
        }
    };
};


TB.angular.PublisherDirective = function() {
    return {
        restrict: 'E',
        scope: {
            props: '&',
            publisher: '='
        },
        link: function(scope, element, attrs){
            $(element).attr("id", "publisher");
            var props = scope.props() || {};
            props.width = $(element).width();
            props.height = $(element).height();
            scope.publisher = TB.initPublisher(attrs.apikey, 'publisher', props);
        }
    };
};

TB.angular.SubscriberDirective = function() {
    return {
        restrict: 'E',
        scope: {
            stream: '&',
            session: "&",
            props: '&'
        },
        link: function(scope, element, attrs){
            var stream = scope.stream();
            var session = scope.session();
            var props = scope.props() || {};
            props.width = $(element).width();
            props.height = $(element).height();
            $(element).attr("id", stream.streamId);
            var subscriber = session.subscribe(stream, stream.streamId, props);
        }
    };
}
    
