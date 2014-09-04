[![Build Status](https://travis-ci.org/aullman/OpenTok-Angular.svg?branch=master)](https://travis-ci.org/aullman/OpenTok-Angular)

OpenTok-Angular
===============

Angular Module to make working with OpenTok more Angularish.

It only works with the [OpenTok API for WebRTC](http://www.tokbox.com/opentok/webrtc/docs).

## Examples

This Angular Module was originally created to power [opentok-meet](https://meet.tokbox.com/) ([github](https://github.com/aullman/opentok-meet)). It's a pretty good example of how to use it.

## Usage

This component can be installed using [bower](http://bower.io/). Simply run `bower install opentok-angular`. Or you can clone this repo and include the `opentok-angular.min.js` file in your page.

## Running the demo

To run the [demo.html](demo.html) file.

1. Clone this repo
2. Replace your apiKey, sessionId and token in the [demo.html](demo.html) file
3. Run `npm install`
4. Serve this directory on a web browser.
5. Visit demo.html in your browser.

## Building and Testing

If you want to contribute to this project you will need to know how to build and test.

```
npm install
npm test
```

Easy as that.

## Dependencies

This component requires that you include the [OpenTok Library](http://www.tokbox.com/opentok) v2.2+, [AngularJS](http://angularjs.org) v1.2.2+. Optionally it also requires the [opentok-layout-js](https://github.com/aullman/opentok-layout-js) component v0.0.6+ and [jQuery](http://jquery.com/) 1.9+ for automatic layout and animation.

## Documentation

### OTSession Service

#### Attributes

* streams - An array of streams in your session. Changes to this will $apply on the $rootScope so your views can bind to it.
* publishers - an Array of OpenTok publishers in your session.
* session - The OpenTok Session object. This isn't defined until you have received the callback from init

#### Methods

* init(apiKey, sessionId, token, callback) - This must be called once to connect to the session.

#### Example Usage

```javascript
angular.module('MyApp', ['opentok'])
.controller('MyCtrl', ['$scope', 'OTSession', 'apiKey', 'sessionId', 'token', function($scope, OTSession, apiKey, sessionId, token) {
    OTSession.init(apiKey, sessionId, token, function(err, session) {
      // Here you can do things to the OpenTok session
      // The err is bubbled up from session.connect
    });
    $scope.streams = OTSession.streams;
}]).value({
    apiKey: 'REPLACE_WITH_YOUR_APIKEY',
    sessionId: 'REPLACE_WITH_YOUR_SESSION_ID',
    token: 'REPLACE_WITH_YOUR_TOKEN'
});
```

### ot-publisher Directive

The publisher directive uses the power of Angular directives to allow you to define an OpenTok publisher directly in your DOM. This publisher creates a standalone publisher using TB.initPublisher and if you pass a reference to a session then session.publish will be called
when the publisher is ready. Alternatively you can pass a reference to this publisher to the 
ot-session directive and session.publish(publisher) will be called when the session connects.

#### Dependencies

This directive requires the OpenTok JavaScript WebRTC library to be included in your page. For more details see [the opentok documentation](http://www.tokbox.com/opentok/webrtc/docs/js/reference/index.html).

#### Attributes

* props - The properties you want to pass to the [session.publish](http://www.tokbox.com/opentok/webrtc/docs/js/reference/Session.html#publish) method.

#### Events

* `"otPublisherError"` - This event is emitted on the scope if there is an error creating or publishing this publisher.

#### Example Usage

Include the OpenTok TB.min.js file and the opentok-angular.js file in your HTML.

```javascript
angular.module('myModule', ['opentok']);
```

```html
<ot-publisher props="{name: 'Adam'}"></ot-publisher>
```


### ot-subscriber

The subscriber directive uses the power of Angular directives to allow you to define an OpenTok subscriber directly in your DOM. You will likely want to iterate over some kind of collection of streams and create subscriber objects for those streams. You can either maintain that list of streams yourself or you can use the streams provided by the ot-session directive.

#### Dependencies

This directive requires the OpenTok JavaScript WebRTC library to be included in your page. For more details see [the opentok documentation](http://www.tokbox.com/opentok/webrtc/docs/js/reference/index.html).

#### Attributes

* stream - The OpenTok stream you want to subscribe to
* props - The properties you want to pass to the [session.subscribe](http://www.tokbox.com/opentok/webrtc/docs/js/reference/Session.html#subscribe) method.

#### Events

* `"otSubscriberError"` - This event is emitted on the scope if there is an error subscribing.

#### Example Usage

```javascript
angular.module('myModule', ['opentok']);
```

```html
<ot-subscriber ng-repeat="stream in streams" 
    stream="stream" 
    props="{style: {nameDisplayMode: 'off'}}">
</ot-subscriber>
```

### ot-layout directive

This directive handles some nice layout logic for you to layout your publishers and subscribers. What it does is intelligently size a bunch of video elements to fit within a specified space. You can see a [demo here](http://aullman.github.io/opentok-layout-js/).

You can put Publishers and/or Subscribers into it and it will basically size the widgets to fit within the container and minimise whitespace.

#### Dependencies

This directive uses the [opentok-layout-js](https://github.com/aullman/opentok-layout-js) component.

#### Attributes

* props - These properties are passed to the TB.initLayoutContainer method of [opentok-layout-js](https://github.com/aullman/opentok-layout-js)

#### Events

* otLayout - If you emit the "otLayout" event on the layout container's scope or a child of the layout container then it will call the `layout()` method of [opentok-layout-js](https://github.com/aullman/opentok-layout-js). The Publisher and Subscriber directives automatically trigger these events when they are loaded, it is also triggered on window resize. But if there are other times when you want to redraw the layout container you can trigger it manually.

#### Example Usage

```javascript
angular.module('myModule', ['opentok']);
```

```html
<ot-layout props="{animate:true}">
    <ot-subscriber ng-repeat="stream in streams" 
        stream="stream" 
        session="session" 
        props="{style: {nameDisplayMode: 'off'}}">
    </ot-subscriber>
</ot-layout>
```

### Putting it all together

These directives are meant to all be used together, an example of them all being used can be found [here](demo.html). You will need to put in your own sessionId and token to get it to work. A more fully-functional demo can be found at: [opentok-meet](https://meet.tokbox.com/).
