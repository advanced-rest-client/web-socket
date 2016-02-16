'use strict';

Polymer({
  is: 'web-socket',
  /**
   * An event when a message was sent from the server to the client.
   * The detail attribute of the event will contain a message property that will contain
   * received message.
   *
   * @event message
   * @param {String|ArrayBuffer|Blob} data.
   */
  /**
   * An event fired when connection to the socket has been made.
   *
   * @event connected
   */
  /**
   * An event fired when connection to the server has been lost.
   *
   * @event disconnected
   */
  /**
   * Fired when error occured.
   *
   * @event error
   * @param {Error} error.
   */
  properties: {
    /**
     * An URL to connect to.
     *
     * @type {String}
     */
    url: String,
    /**
     * A message to be send via socket.
     * It can be any type supported by WebSockets web interface: DOMString,
     * ArrayBuffer or Blob.
     *
     * @type Any
     */
    message: {
      type: Object,
      value: null
    },
    /**
     * Current state of the socket, where:
     * -1 - default state, disconnected,
     * 0 - The connection is not yet open.
     * 1 - The connection is open and ready to communicate.
     * 2 - The connection is in the process of closing.
     * 3 - The connection is closed or couldn't be opened.
     *
     * @type {Number}
     */
    state: {
      type: Number,
      value: -1,
      notify: true,
      readOnly: true
    },
    /**
     * If true element is retrying the connection to the server after it has been lost.
     *
     * @type {Boolean}
     */
    retrying: {
      type: Boolean,
      value: false,
      notify: true,
      readOnly: true
    },
    /**
     * An initial time for retrying the request in seconds.
     * The element will attempt to reconnect to the server after set time after loosing connection.
     * Every attempt to connect will increase delay time by multiplying last time by 2.
     * For example if initial time is `1` seconds next attempt of connection will occure after:
     * - 2 seconds
     * - 4 seconds
     * - 8 seconds
     * - 16 seconds
     * - 32 seconds
     * - an so on
     *
     * @type Number
     */
    retryingTime: {
      type: Number,
      value: 1
    },
    /**
     * If true the element will attempt to connect after `url` change.
     * If conncetion was already established with previous `url` it will be closed first.
     *
     * @type {Boolean}
     */
    auto: {
      type: Boolean,
      value: false
    },
    /**
     * A handler to the current connection.
     *
     * @type {WebSocket}
     */
    connection: {
      type: Object,
      readOnly: true
    },
    /**
     * A handler for open event
     *
     * @type {Function}
     */
    _onOpenHandler: {
      type: Function,
      value: function() {
        return this._onOpen.bind(this);
      }
    },
    /**
     * A handler for close event
     *
     * @type {Function}
     */
    _onCloseHandler: {
      type: Function,
      value: function() {
        return this._onClose.bind(this);
      }
    },
    /**
     * A handler for message event
     *
     * @type {Function}
     */
    _onMessageHandler: {
      type: Function,
      value: function() {
        return this._onMessage.bind(this);
      }
    },
    /**
     * A handler for error event
     *
     * @type {Function}
     */
    _onErrorHandler: {
      type: Function,
      value: function() {
        return this._onError.bind(this);
      }
    },
    /**
     * True when user called `close` function manually.
     * When is set to `false` the element will attempt to reconnect to the server.
     *
     * @type {Boolean}
     */
    manualClose: {
      type: Boolean,
      value: false,
      readOnly: true
    },
    /**
     * A current reconnect timeout in miliseconds
     */
    reconnectTimeout: {
      type: Number,
      readOnly: true
    },
    /**
     * Window timeout ID for reconnect timer.
     */
    _reconnectTimer: Number,
    /**
     * Current retry counter
     */
    _retryCounter: {
      type: Number,
      value: 0
    }
  },

  listeners: [
    '_connectionDataChanged(url, auto)',
    '_messageChanged(message, auto)'
  ],
  /**
   * A handler for `url` attribute changed.
   */
  _connectionDataChanged: function(url, auto) {
    if (url && auto) {
      this.open();
    }
  },
  /**
   * A handler for `message` attribute changed.
   */
  _messageChanged: function(message, auto) {
    if (message && auto) {
      this.send();
    }
  },
  /**
   * Attempt to connect to the server.
   * If a connection already exists it will be closed.
   */
  open: function() {
    this._resetComponent();
    try {
      this._setConnection(new WebSocket(this.url));
      this._setState(0);
      this._attachListeners();
    } catch (e) {
      this.fire('error', {
        error: e
      });
    }
  },
  /**
   * Release resources and sutup original state.
   */
  _resetComponent: function() {
    this._detachListeners();
    this.close();
    this._setManualClose(false);
    if (this._reconnectTimer) {
      window.clearTimeout(this._reconnectTimer);
      this._reconnectTimer = undefined;
    }
  },

  _detachListeners: function() {
    if (!this.connection) {
      return;
    }
    this.connection.removeEventListener('open', this._onOpenHandler);
    this.connection.removeEventListener('close', this._onCloseHandler);
    this.connection.removeEventListener('message', this._onMessageHandler);
    this.connection.removeEventListener('error', this._onErrorHandler);
  },
  _attachListeners: function() {
    if (!this.connection) {
      return;
    }
    this.connection.addEventListener('open', this._onOpenHandler);
    this.connection.addEventListener('close', this._onCloseHandler);
    this.connection.addEventListener('message', this._onMessageHandler);
    this.connection.addEventListener('error', this._onErrorHandler);
  },
  /**
   * Close the connection.
   *
   * @param {Number=} code Optional, close status code.
   * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes for
   * allowed codes.
   * @param {String=} message Optional, a status message to be send.
   */
  close: function(code, message) {
    if (!this.connection) {
      return;
    }
    this._setManualClose(true);
    this._setState(2);
    if (code === 1000 || (code >= 3000 && code < 5000)) {
      this.connection.close(code, message);
    } else {
      this.connection.close();
    }
  },
  /**
   * Send data to the server.
   * If `auto` attribute is present the message will be send wight after new `message` is set.
   */
  send: function() {
    if (this.state !== 1) {
      this.fire('error', {
        error: new Error('Socket is not connected')
      });
    }
    try {
      this.connection.send(this.message);
    } catch (e) {
      this.fire('error', {
        error: e
      });
    }
  },
  /**
   * A handler for `open` event.
   * It will set current state to 1 and fire `connected` event.
   */
  _onOpen: function() {
    this._setState(1);
    this._setRetrying(false);
    this._retryCounter = 0;
    this.fire('connected');
  },
  /**
   * A handler for `close` event.
   * It will set state to 3 and fire `disconnected` event.
   * If required it will set up reconnect algorithm.
   */
  _onClose: function() {
    this._setState(3);
    this.fire('disconnected');
    if (!this.manualClose) {
      this._setRetrying(true);
      this._retry();
    }
  },
  /**
   * A handler for `message` event.
   * It will fire message event.
   */
  _onMessage: function(e) {
    this.fire('message', {
      data: e.data
    });
  },
  /**
   * A handler for `error` event.
   */
  _onError: function(e) {
    this.fire('error', {
      error: e
    });
  },
  _retry: function() {
    var timeout = this.retryingTime || 1;
    timeout *= 1000;
    if (this._retryCounter > 0) {
      for (var i = 0; i < this._retryCounter; i++) {
        timeout *= 2;
      }
    }
    this._retryCounter++;
    this._reconnectTimer = window.setTimeout(() => {
      this._reconnectTimer = null;
      this.open();
    }, timeout);
  }
});
