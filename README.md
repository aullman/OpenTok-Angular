OpenTok-Angular
===============

Angular directives and helper code to make working with OpenTok more Angularish.

It only works with the [OpenTok API for WebRTC](http://www.tokbox.com/opentok/webrtc/docs).

To see a demo of it all working check out the [example.html](example.html) and replace your sessionId, token and apiKey values.

## TB.angular.PublisherDirective

The publisher directive uses the power of Angular directives to allow you to define an OpenTok publisher directly in your DOM. This publisher creates a standalone publisher using TB.initPublisher and it is up to you when you actually publish it on a session. It makes a publisher object available on your Controller scope that you can call publish with.

### Requirements

This directive requires the OpenTok JavaScript WebRTC library to be included in your page. For more details see [the opentok documentation](http://www.tokbox.com/opentok/webrtc/docs/js/reference/index.html).

### Attributes

* apiKey - string attribute representing the apiKey of your application.
* publisher - a bi-directional binding to your controller scope. This is a reference to the OpenTok [publisher object](http://www.tokbox.com/opentok/webrtc/docs/js/reference/Publisher.html).
* props - The properties you want to pass to the [session.publish](http://www.tokbox.com/opentok/webrtc/docs/js/reference/Session.html#publish) method.

### Example Usage

Include the OpenTok TB.min.js file and the TB_Angular.js file in your HTML.

```javascript
angular.module('layoutDemo', [])
    .directive('publisher', TB.angular.PublisherDirective)

function PublisherCtrl($scope) {
    $scope.publisher;
    session.on("sessionConnected", function(event) {
        session.publish($scope.publisher);
    });
}
```

```html
<div ng-controller="PublisherCtrl">
    <publisher apiKey="1127" publisher="publisher" props="{name: 'Adam'}"></publisher>
</div>
```


## TB.angular.SubscriberDirective

The subscriber directive uses the power of Angular directives to allow you to define an OpenTok subscriber directly in your DOM. You will likely want to iterate over some kind of collection of streams and create subscriber objects for those streams. You can either maintain that list of streams yourself or you can use the default TB.angular.createOpentokCtrl to maintain all of the streams in the session on your scope.

### Requirements

This directive requires the OpenTok JavaScript WebRTC library to be included in your page. For more details see [the opentok documentation](http://www.tokbox.com/opentok/webrtc/docs/js/reference/index.html).

This also requires that you track the list of streams that you want to subscribe to in your scope. You can do this yourself or by using the TB.angular.createOpentokCtrl method.

### Attributes

* stream - The OpenTok stream you want to subscribe to
* session - The OpenTok Session object
* props - The properties you want to pass to the [session.subscribe](http://www.tokbox.com/opentok/webrtc/docs/js/reference/Session.html#subscribe) method.

### Example Usage

```javascript
angular.module('SubscriberDemo', [])
    .directive('subscriber', TB.angular.SubscriberDirective);

var SubscriberCtrl = TB.angular.createOpentokCtrl(apiKey, sessionId, token);
```

```html
<div ng-controller="SubscriberDemo">
    <subscriber ng-repeat="stream in streams | filter:notMine" stream="stream" session="session" props="{subscribeToAudio:false}"></subscriber>
</div>
```
## TB.angular.LayoutDirective

The layout directive uses an existing [LayoutContainer jQuery plugin](https://github.com/aullman/aullman.github.com/tree/master/LayoutContainer) that I wrote but makes it accessible as an Angular directive. What it does is intelligently size a bunch of video elements to fit within a specified space. You can see a [demo here](http://aullman.github.io/LayoutContainer/mediaLayout.html).

You can put Subscribers and your Publisher in it to make them all have equal weight.

### Example Usage

```css
layout {
    width: 100%;
    height: 100%;
}
```

```javascript
angular.module('layoutDemo', [])
    .directive('layout', TB.angular.LayoutDirective)
    .directive('subscriber', TB.angular.SubscriberDirective);
```

```html
<layout>
    <subscriber ng-repeat="stream in streams | filter:notMine" stream="stream" session="session" props="{subscribeToAudio:false}"></subscriber>
</layout>
```
