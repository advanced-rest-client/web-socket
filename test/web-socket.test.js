import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';
import { a11ySuite } from '@advanced-rest-client/a11y-suite/index.js';
import '../web-socket.js';

describe('<web-socket>', () => {
  async function basicFixture() {
    return (await fixture(`<web-socket url="wss://echo.websocket.org"></web-socket>`));
  }

  async function autoFixture() {
    return (await fixture(`<web-socket auto url="wss://echo.websocket.org"></web-socket>`));
  }

  async function ariaHiddenFixture() {
    return (await fixture(`<web-socket aria-hidden="test"></web-socket>`));
  }

  describe('Basics', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('has default state', () => {
      assert.equal(element.state, -1);
    });

    it('has default connection', () => {
      assert.isUndefined(element.connection);
    });

    it('has default retrying', () => {
      assert.isFalse(element.retrying);
    });

    it('opens the connection', (done) => {
      element.addEventListener('error', function f(e) {
        element.removeEventListener('error', f);
        done(e.detail.error);
      });
      element.addEventListener('connected', function f() {
        element.removeEventListener('connected', f);
        assert.equal(element.state, 1);
        done();
      });
      element.open();
      assert.equal(element.state, 0);
      assert.ok(element.connection);
    });

    it('sends a message', (done) => {
      const msg = 'test-msg';
      element.addEventListener('error', function f(e) {
        element.removeEventListener('error', f);
        done(e.detail.error);
      });
      element.addEventListener('message', function f(e) {
        element.removeEventListener('message', f);
        assert.equal(e.detail.data, msg);
        done();
      });
      element.addEventListener('connected', function f() {
        element.removeEventListener('connected', f);
        element.send();
      });
      element.open();
      element.message = msg;
    });

    it('closes the connection', (done) => {
      element.addEventListener('error', function f(e) {
        element.removeEventListener('error', f);
        done(e.detail.error);
      });
      element.addEventListener('disconnected', function f() {
        element.removeEventListener('disconnected', f);
        assert.equal(element.state, 3);
        done();
      });
      element.addEventListener('connected', function f() {
        element.removeEventListener('connected', f);
        element.close();
        assert.equal(element.state, 2);
        assert.isTrue(element.manualClose);
      });
      element.open();
    });
  });

  describe('Auto mode', () => {
    let element;
    beforeEach(async () => {
      element = await autoFixture();
    });

    it('connects automatically', (done) => {
      element.onconnected = () => {
        done();
      };
    });

    it('sends a message automatically', (done) => {
      const msg = 'test-msg';
      element.onconnected = () => {
        element.message = msg;
      };
      element.onmessage = (e) => {
        assert.equal(e.detail.data, msg);
        done();
      };
    });
  });

  describe('Retrying', () => {
    let element;
    beforeEach(async () => {
      element = await autoFixture();
    });

    it('reopens the connection', (done) => {
      element.onconnected = () => {
        element.close();
        element._manualClose = false;
        element._state = 1;
        element.onconnected = () => {
          done();
        };
      };
    });

    it('won\'t reopen weh noretry', (done) => {
      element.noRetry = true;
      element.onconnected = () => {
        element.close();
        element._manualClose = false;
        element._state = 1;
      };

      element.ondisconnected = () => {
        assert.isFalse(element.retrying);
        done();
      };
    });
  });

  describe('_noRetryChanged()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('clears _reconnectTimer', () => {
      element._reconnectTimer = 1;
      element._noRetryChanged(true);
      assert.equal(element._reconnectTimer, null);
    });

    it('re-sets _retrying', () => {
      element._reconnectTimer = 1;
      element._retrying = true;
      element._noRetryChanged(true);
      assert.isFalse(element._retrying);
    });

    it('re-sets _retryCounter', () => {
      element._reconnectTimer = 1;
      element._retryCounter = 1;
      element._noRetryChanged(true);
      assert.equal(element._retrying, 0);
    });
  });

  describe('_onError()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('dispatches error event', () => {
      const spy = sinon.spy();
      element.addEventListener('error', spy);
      const e = new Error('');
      element._onError(e);
      assert.isTrue(spy.args[0][0].detail.error === e);
    });
  });

  describe('_onMessage()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('dispatches message event', () => {
      const spy = sinon.spy();
      element.addEventListener('message', spy);
      const message = 'test-message';
      element._onMessage({
        data: message
      });
      assert.equal(spy.args[0][0].detail.data, message);
    });
  });

  describe('send()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('calls _onError() when not connected', () => {
      let called = false;
      element.onerror = () => {
        called = true;
      };
      element.send();
      assert.isTrue(called);
    });
  });

  describe('onconnected', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onconnected);
      const f = () => {};
      element.onconnected = f;
      assert.isTrue(element.onconnected === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onconnected = f;
      element._onOpen();
      element.onconnected = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onconnected = f1;
      element.onconnected = f2;
      element._onOpen();
      element.onconnected = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('ondisconnected', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.ondisconnected);
      const f = () => {};
      element.ondisconnected = f;
      assert.isTrue(element.ondisconnected === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.ondisconnected = f;
      element._onClose();
      element.ondisconnected = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.ondisconnected = f1;
      element.ondisconnected = f2;
      element._onClose();
      element.ondisconnected = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('onmessage', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onmessage);
      const f = () => {};
      element.onmessage = f;
      assert.isTrue(element.onmessage === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onmessage = f;
      element._onMessage({});
      element.onmessage = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onmessage = f1;
      element.onmessage = f2;
      element._onMessage({});
      element.onmessage = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('onerror', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onerror);
      const f = () => {};
      element.onerror = f;
      assert.isTrue(element.onerror === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onerror = f;
      element._onError({});
      element.onerror = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onerror = f1;
      element.onerror = f2;
      element._onError({});
      element.onerror = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('Setters', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('noRetry calls _noRetryChanged()', () => {
      const spy = sinon.spy(element, '_noRetryChanged');
      element.noRetry = true;
      assert.isTrue(spy.called);
    });

    it('noRetry ignores _noRetryChanged() when value is set', () => {
      element.noRetry = true;
      const spy = sinon.spy(element, '_noRetryChanged');
      element.noRetry = true;
      assert.isFalse(spy.called);
    });

    it('url calls _connectionDataChanged()', () => {
      const spy = sinon.spy(element, '_connectionDataChanged');
      element.url = 'abc';
      assert.isTrue(spy.called);
    });

    it('url ignores _connectionDataChanged() when value is set', () => {
      element.url = 'abc';
      const spy = sinon.spy(element, '_connectionDataChanged');
      element.url = 'abc';
      assert.isFalse(spy.called);
    });

    it('auto calls _connectionDataChanged()', () => {
      element.open = () => {};
      const spy = sinon.spy(element, '_connectionDataChanged');
      element.auto = true;
      assert.isTrue(spy.called);
    });

    it('auto calls _messageChanged()', () => {
      element.open = () => {};
      const spy = sinon.spy(element, '_messageChanged');
      element.auto = true;
      assert.isTrue(spy.called);
    });

    it('auto ignores _connectionDataChanged() when value is set', () => {
      element.open = () => {};
      element.auto = true;
      const spy = sinon.spy(element, '_connectionDataChanged');
      element.auto = true;
      assert.isFalse(spy.called);
    });

    it('message calls _messageChanged()', () => {
      const spy = sinon.spy(element, '_messageChanged');
      element.message = 'abc';
      assert.isTrue(spy.called);
    });

    it('message ignores _messageChanged() when value is set', () => {
      element.message = 'abc';
      const spy = sinon.spy(element, '_messageChanged');
      element.message = 'abc';
      assert.isFalse(spy.called);
    });
  });

  describe('a11y', () => {
    it('Passes a11y test', async () => {
      await a11ySuite('Normal state', '<web-socket url="wss://echo.websocket.org"></web-socket>');
    });

    it('sets aria-hidden', async () => {
      const element = await basicFixture();
      assert.equal(element.getAttribute('aria-hidden'), 'true');
    });

    it('respects existing aria-hidden', async () => {
      const element = await ariaHiddenFixture();
      assert.equal(element.getAttribute('aria-hidden'), 'test');
    });
  });
});
