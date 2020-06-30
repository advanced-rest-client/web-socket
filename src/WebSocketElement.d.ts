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

/* eslint-disable no-plusplus */

/**
 * The `web-socket` is an element to make a connection to the socket
 * using web sockets API.
 */
export declare class WebSocketElement extends LitElement {
  /**
   * An URL to connect to.
   */
  url: string;
  /**
   * A message to be send via socket.
   * It can be any type supported by WebSockets web interface:
   * DOMString, ArrayBuffer or Blob.
   */
  message: string|ArrayBuffer|Blob|File;

  _state: number;

  _retrying: boolean;
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
  retryingTime: number;
  /**
   * If true the element will attempt to connect after `url` change.
   * If conncetion was already established with previous `url` it will
   * be closed first.
   */
  auto: boolean;
  /**
   * A handler to the current connection.
   */
  _connection: WebSocket;
  // When set it does not autoreconnect after connection lost.
  noRetry: boolean;
  /**
   * True when user called `close` function manually.
   * When is set to `false` the element will attempt to reconnect to the server.
   */
  _manualClose: boolean;
  /**
   * Window timeout ID for reconnect timer.
   */
  _reconnectTimer: number;
  /**
   * Current retry counter
   */
  _retryCounter: number;

  /**
   * @returns Current state of the socket, where:
   * -1 - default state, disconnected,
   * 0 - The connection is not yet open.
   * 1 - The connection is open and ready to communicate.
   * 2 - The connection is in the process of closing.
   * 3 - The connection is closed or couldn't be opened.
   */
  readonly state: number;

  /**
   * @return If true element is retrying the connection to the server after
   * it has been lost.
   */
  readonly retrying: boolean;

  /**
   * @retuerns A pointer to the current connection.
   */
  readonly connection?: WebSocket;

  /**
   * @return {Boolean} True when user called `close` function manually.
   * When is set to `false` the element will attempt to reconnect to the server.
   */
  readonly manualClose: boolean;

  /**
   * A handler for the `connected` event
   */
  onconnected: EventListener|null;

  /**
   * A handler for the `disconnected` event
   */
  ondisconnected: EventListener|null;

  /**
   * A handler for the `disconnected` event
   */
  onretrying: EventListener|null;

  /**
   * A handler for the `message` event
   */
  onmessage: EventListener|null;

  /**
   * A handler for the `error` event
   */
  onerror: EventListener|null;

  constructor();
  connectedCallback(): void;
  disconnectedCallback(): void;

  /**
   * A handler for `url` and `auto` attribute changed.
   */
  _connectionDataChanged(): void;

  /**
   * A handler for `message` and `auto` attribute changed.
   */
  _messageChanged(): void;

  /**
   * Attempt to connect to the server.
   * If a connection already exists it will be closed.
   */
  open(): void;

  /**
   * Release resources and sutup original state.
   */
  _resetComponent(): void;

  _detachListeners(): void;

  _attachListeners(): void;

  /**
   * Close the connection.
   *
   * @param code Optional, close status code.
   * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes for
   * allowed codes.
   * @param message Optional, a status message to be send.
   */
  close(code?: number, message?: string): void;

  /**
   * Send data to the server.
   * If `auto` attribute is present the message will be send wight after new `message` is set.
   */
  send(): void;

  /**
   * A handler for `open` event.
   * It will set current state to 1 and fire `connected` event.
   */
  _onOpen(): void;

  /**
   * A handler for `close` event.
   * It will set state to 3 and fire `disconnected` event.
   * If required it will set up reconnect algorithm.
   */
  _onClose(): void;

  /**
   * A handler for `message` event.
   * It will fire message event.
   */
  _onMessage(e: MessageEvent): void;

  _onError(e: Error|Event): void;

  _retry(): void;

  _noRetryChanged(noRetry: boolean): void;
}
