import '@advanced-rest-client/arc-demo-helper/arc-demo-helper.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';
import '../web-socket.js';

function init() {
  document.querySelector('#socket').addEventListener('message', (e) => {
    document.querySelector('#out').innerText += '\n' + e.detail.data;
  });
  document.querySelector('#send').addEventListener('click', () => {
    document.querySelector('#socket').message = document.querySelector('#msg').value;
  });
}

window.customElements.whenDefined('arc-demo-helper').then(() => {
  setTimeout(() => {
    init();
  });
});
