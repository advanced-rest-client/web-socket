[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/web-socket.svg)](https://www.npmjs.com/package/@advanced-rest-client/web-socket)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-url-data-model.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/web-socket)

# web-socket

A web component wrapper for web socket.

## Usage

### Installation
```
npm install --save @advanced-rest-client/web-socket
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/web-socket/web-socket.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <web-socket auto url="wss://echo.websocket.org"></web-socket>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/web-socket
cd web-socket
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests
```sh
npm test
```


### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)
