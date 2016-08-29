## `<web-socket>`

The `<web-socket>` is an element to make a connection to the socket using web sockets API.

## Example:
```html
<web-socket
  message="[[myMessage]]"
  retrying="{{isRetrying}}"
  retryingTime="{{timeToRetry}}"
  on-message="_messageReceived"
  on-disconnected="_onDisconnected"
  on-connected=""></web-socket>
```
