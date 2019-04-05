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
import {PolymerElement} from '../../@polymer/polymer/polymer-element.js';
/**
 * The `web-socket` is an element to make a connection to the socket
 * using web sockets API.
 *
 * Example:
 *
 * ```html
 * <web-socket
 *  message="[[myMessage]]"
 *  retrying="{{isRetrying}}"
 *  retryingTime="{{timeToRetry}}"
 *  on-message="_messageReceived"
 *  on-disconnected="_onDisconnected"
 *  on-connected=""></web-socket>
 * ```
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof LogicElements
 */
class WebSocketComponent extends PolymerElement {
  static get properties() {
    return {
      /**
       * An URL to connect to.
       *
       * @type {String}
       */
      url: String,
      /**
       * A message to be send via socket.
       * It can be any type supported by WebSockets web interface:
       * DOMString, ArrayBuffer or Blob.
       *
       * @type {Any}
       */
      message: Object,
      /**
       * Current state of the socket, where:
       * -1 - default state, disconnected,
       * 0 - The connection is not yet open.
       * 1 - The connection is open and ready to communicate.
       * 2 - The connection is in the process of closing.
       * 3 - The connection is closed or couldn't be opened.
       */
      state: {
        type: Number,
        value: -1,
        notify: true,
        readOnly: true
      },
      /**
       * If true element is retrying the connection to the server after
       * it has been lost.
       */
      retrying: {
        type: Boolean,
        value: false,
        notify: true,
        readOnly: true
      },
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
      retryingTime: {
        type: Number,
        value: 1
      },
      /**
       * If true the element will attempt to connect after `url` change.
       * If conncetion was already established with previous `url` it will
       * be closed first.
       */
      auto: Boolean,
      /**
       * A handler to the current connection.
       *
       * @type {WebSocket}
       */
      connection: {
        type: Object,
        readOnly: true
      },
      // When set it does not autoreconnect after connection lost.
      noRetry: {
        type: Boolean,
        observer: '_noRetryChanged'
      },
      /**
       * True when user called `close` function manually.
       * When is set to `false` the element will attempt to reconnect to the server.
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
    };
  }
  static get observers() {
    return [
      '_connectionDataChanged(url, auto)',
      '_messageChanged(message, auto)'
    ];
  }
  constructor() {
    super();
    this._onOpen = this._onOpen.bind(this);
    this._onClose = this._onClose.bind(this);
    this._onMessage = this._onMessage.bind(this);
    this._onError = this._onError.bind(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.state === 1) {
      this.close();
    }
  }
  /**
   * A handler for `url` attribute changed.
   *
   * @param {String} url
   * @param {Boolean} auto
   */
  _connectionDataChanged(url, auto) {
    if (url && auto) {
      this.open();
    }
  }
  /**
   * A handler for `message` attribute changed.
   * @param {String} message
   * @param {Boolean} auto
   */
  _messageChanged(message, auto) {
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
      this._setState(0);
      this._setConnection(new WebSocket(this.url));
      this._attachListeners();
    } catch (e) {
      this.dispatchEvent(new CustomEvent('error', {
        composed: true,
        detail: {
          error: e
        }
      }));
    }
  }
  /**
   * Release resources and sutup original state.
   */
  _resetComponent() {
    this._detachListeners();
    this.close();
    this._setManualClose(false);
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
    this._setManualClose(true);
    this._setState(2);
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
    if (this.state !== 1) {
      this.dispatchEvent(new CustomEvent('error', {
        composed: true,
        detail: {
          error: new Error('Socket is not connected')
        }
      }));
    }
    try {
      this.connection.send(this.message);
    } catch (e) {
      this.dispatchEvent(new CustomEvent('error', {
        composed: true,
        detail: {
          error: e
        }
      }));
    }
  }
  /**
   * A handler for `open` event.
   * It will set current state to 1 and fire `connected` event.
   */
  _onOpen() {
    this._setState(1);
    this._setRetrying(false);
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
    this._setState(3);
    this.dispatchEvent(new CustomEvent('disconnected', {
      composed: true
    }));
    if (this.noRetry) {
      return;
    }
    // Do not reconnect it there wasn't connection made.
    if (!this.manualClose && lastState !== 0) {
      this._setRetrying(true);
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
      this._setRetrying(false);
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
