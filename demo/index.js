import '@advanced-rest-client/arc-demo-helper/arc-demo-helper.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '../web-socket.js';

function init() {
  document.querySelector('#socket').addEventListener('message', (e) => {
    // @ts-ignore
    document.querySelector('#out').innerText += `\n${e.detail.data}`;
  });
  document.querySelector('#send').addEventListener('click', () => {
    // @ts-ignore
    document.querySelector('#socket').message = document.querySelector('#msg').value;
  });
}

window.customElements.whenDefined('arc-demo-helper').then(() => {
  setTimeout(() => {
    init();
  });
});
