/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { LitElement } from 'lit-element';
/**
 * The `web-socket` is an element to make a connection to the socket
 * using web sockets API.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof LogicElements
 */
class WebSocketComponent extends LitElement {
  static get properties() {
    return {
      /**
       * An URL to connect to.
       *
       * @type {String}
       */
      url: { type: String },
      /**
       * A message to be send via socket.
       * It can be any type supported by WebSockets web interface:
       * DOMString, ArrayBuffer or Blob.
       *
       * @type {Any}
       */
      message: { type: Object },

      _state: { type: Number },

      _retrying: { type: Boolean },
      /**
       * An initial time for retrying the request in seconds.
       * The element will attempt to reconnect to the server after set time
       * after loosing connection.
       * Every attempt to connect will increase delay time by multiplying last
       * time by 2.
       * For example if initial time is `1` seconds next attempt of connection
       * will occure after:
       * - 2 seconds
       * - 4 seconds
       * - 8 seconds
       * - 16 seconds
       * - 32 seconds
       * - an so on
       */
      retryingTime: { type: Number },
      /**
       * If true the element will attempt to connect after `url` change.
       * If conncetion was already established with previous `url` it will
       * be closed first.
       */
      auto: { type: Boolean },
      /**
       * A handler to the current connection.
       *
       * @type {WebSocket}
       */
      _connection: { type: Object },
      // When set it does not autoreconnect after connection lost.
      noRetry: { type: Boolean },
      /**
       * True when user called `close` function manually.
       * When is set to `false` the element will attempt to reconnect to the server.
       */
      _manualClose: { type: Boolean },
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
    };
  }
  /**
   * @return {Number} Current state of the socket, where:
   * -1 - default state, disconnected,
   * 0 - The connection is not yet open.
   * 1 - The connection is open and ready to communicate.
   * 2 - The connection is in the process of closing.
   * 3 - The connection is closed or couldn't be opened.
   */
  get state() {
    return this._state;
  }
  /**
   * @return {Boolean} If true element is retrying the connection to the server after
   * it has been lost.
   */
  get retrying() {
    return this._retrying;
  }

  get _retrying() {
    return this.__retrying;
  }

  set _retrying(value) {
    this.__retrying = value;
    this.dispatchEvent(new CustomEvent('retrying-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * @retuern {WebSocket|undefined} A pointer to the current connection.
   */
  get connection() {
    return this._connection;
  }
  /**
   * @return {Boolean} True when user called `close` function manually.
   * When is set to `false` the element will attempt to reconnect to the server.
   */
  get manualClose() {
    return this._manualClose;
  }

  get noRetry() {
    return this._noRetry;
  }
  /**
   * When set it does not autoreconnect after connection lost.
   * @param {Boolean} value
   */
  set noRetry(value) {
    const old = this._noRetry;
    if (old === value) {
      return;
    }
    this._noRetry = value;
    this._noRetryChanged(value);
  }

  get url() {
    return this._url;
  }

  set url(value) {
    const old = this._url;
    if (old === value) {
      return;
    }
    this._url = value;
    this._connectionDataChanged();
  }

  get auto() {
    return this._auto;
  }

  set auto(value) {
    const old = this._auto;
    if (old === value) {
      return;
    }
    this._auto = value;
    this._connectionDataChanged();
    this._messageChanged();
  }

  get message() {
    return this._message;
  }

  set message(value) {
    const old = this._message;
    if (old === value) {
      return;
    }
    this._message = value;
    this._messageChanged();
  }

  /**
   * @return {Function} Previously registered handler for `connected` event
   */
  get onconnected() {
    return this._onconnected;
  }
  /**
   * Registers a callback function for `connected` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onconnected(value) {
    this._registerCallback('connected', value);
  }
  /**
   * @return {Function} Previously registered handler for `disconnected` event
   */
  get ondisconnected() {
    return this._ondisconnected;
  }
  /**
   * Registers a callback function for `disconnected` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set ondisconnected(value) {
    this._registerCallback('disconnected', value);
  }
  /**
   * @return {Function} Previously registered handler for `disconnected` event
   */
  get onretrying() {
    return this['_onretrying-changed'];
  }
  /**
   * Registers a callback function for `disconnected` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onretrying(value) {
    this._registerCallback('retrying-changed', value);
  }
  /**
   * @return {Function} Previously registered handler for `message` event
   */
  get onmessage() {
    return this._onmessage;
  }
  /**
   * Registers a callback function for `message` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onmessage(value) {
    this._registerCallback('message', value);
  }
  /**
   * @return {Function} Previously registered handler for `error` event
   */
  get onerror() {
    return this._onerror;
  }
  /**
   * Registers a callback function for `error` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onerror(value) {
    this._registerCallback('error', value);
  }

  constructor() {
    super();
    this._onOpen = this._onOpen.bind(this);
    this._onClose = this._onClose.bind(this);
    this._onMessage = this._onMessage.bind(this);
    this._onError = this._onError.bind(this);

    this._state = -1;
    this._retrying = false;
    this.retryingTime = 1;
    this._manualClose = false;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (!this.hasAttribute('aria-hidden')) {
      this.setAttribute('aria-hidden', 'true');
    }
  }


  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    if (this._state === 1) {
      this.close();
    }
  }

  _registerCallback(eventType, value) {
    const key = `_on${eventType}`;
    if (this[key]) {
      this.removeEventListener(eventType, this[key]);
    }
    if (typeof value !== 'function') {
      this[key] = null;
      return;
    }
    this[key] = value;
    this.addEventListener(eventType, value);
  }
  /**
   * A handler for `url` and `auto` attribute changed.
   */
  _connectionDataChanged() {
    const { url, auto } = this;
    if (url && auto) {
      this.open();
    }
  }
  /**
   * A handler for `message` and `auto` attribute changed.
   */
  _messageChanged() {
    const { message, auto } = this;
    if (message && auto) {
      this.send();
    }
  }
  /**
   * Attempt to connect to the server.
   * If a connection already exists it will be closed.
   */
  open() {
    this._resetComponent();
    try {
      this._state = 0;
      this._connection = new WebSocket(this.url);
      this._attachListeners();
    } catch (e) {
      this._onError(e);
    }
  }
  /**
   * Release resources and sutup original state.
   */
  _resetComponent() {
    this._detachListeners();
    this.close();
    this._manualClose = false;
    if (this._reconnectTimer) {
      window.clearTimeout(this._reconnectTimer);
      this._reconnectTimer = undefined;
    }
  }

  _detachListeners() {
    if (!this.connection) {
      return;
    }
    this.connection.removeEventListener('open', this._onOpen);
    this.connection.removeEventListener('close', this._onClose);
    this.connection.removeEventListener('message', this._onMessage);
    this.connection.removeEventListener('error', this._onError);
  }

  _attachListeners() {
    if (!this.connection) {
      return;
    }
    this.connection.addEventListener('open', this._onOpen);
    this.connection.addEventListener('close', this._onClose);
    this.connection.addEventListener('message', this._onMessage);
    this.connection.addEventListener('error', this._onError);
  }
  /**
   * Close the connection.
   *
   * @param {Number=} code Optional, close status code.
   * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes for
   * allowed codes.
   * @param {String=} message Optional, a status message to be send.
   */
  close(code, message) {
    if (!this.connection) {
      return;
    }
    this._manualClose = true;
    this._state = 2;
    if (code === 1000 || (code >= 3000 && code < 5000)) {
      this.connection.close(code, message);
    } else {
      this.connection.close();
    }
  }
  /**
   * Send data to the server.
   * If `auto` attribute is present the message will be send wight after new `message` is set.
   */
  send() {
    if (this._state !== 1) {
      this._onError(new Error('Socket is not connected'));
      return;
    }
    try {
      this.connection.send(this.message);
    } catch (e) {
      this._onError(e);
    }
  }
  /**
   * A handler for `open` event.
   * It will set current state to 1 and fire `connected` event.
   */
  _onOpen() {
    this._state = 1;
    this._retrying = false;
    this._retryCounter = 0;
    this.dispatchEvent(new CustomEvent('connected', {
      composed: true
    }));
  }
  /**
   * A handler for `close` event.
   * It will set state to 3 and fire `disconnected` event.
   * If required it will set up reconnect algorithm.
   */
  _onClose() {
    const lastState = this.state;
    this._state = 3;
    this.dispatchEvent(new CustomEvent('disconnected', {
      composed: true
    }));
    if (this.noRetry) {
      return;
    }
    // Do not reconnect it there wasn't connection made.
    if (!this.manualClose && lastState !== 0) {
      this._retrying = true;
      this._retry();
    }
  }
  /**
   * A handler for `message` event.
   * It will fire message event.
   * @param {Event} e
   */
  _onMessage(e) {
    this.dispatchEvent(new CustomEvent('message', {
      composed: true,
      detail: {
        data: e.data
      }
    }));
  }
  /**
   * A handler for `error` event.
   * @param {Event} e
   */
  _onError(e) {
    this.dispatchEvent(new CustomEvent('error', {
      composed: true,
      detail: {
        error: e
      }
    }));
  }

  _retry() {
    let timeout = this.retryingTime || 1;
    timeout *= 1000;
    if (this._retryCounter > 0) {
      for (let i = 0; i < this._retryCounter; i++) {
        timeout *= 2;
      }
    }
    this._retryCounter++;
    this._reconnectTimer = window.setTimeout(() => {
      this._reconnectTimer = null;
      this.open();
    }, timeout);
  }

  _noRetryChanged(noRetry) {
    if (noRetry && this._reconnectTimer) {
      window.clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
      this._retrying = false;
      this._retryCounter = 0;
    }
  }
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
}
window.customElements.define('web-socket', WebSocketComponent);
