import { WebSocketElement } from './src/WebSocketElement';

declare global {
  interface HTMLElementTagNameMap {
    "web-socket": WebSocketElement;
  }
}
