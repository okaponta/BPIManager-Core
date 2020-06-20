import 'react-app-polyfill/ie11';
import * as React from "react";
import * as ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import ReloadModal from './view/components/update';
import firebase from 'firebase/app';
import 'firebase/messaging';

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA

if ('serviceWorker' in navigator) {
  serviceWorker.register({
    onUpdate: (registration:ServiceWorkerRegistration) => {
      if (registration.waiting) {
        ReactDOM.render(<ReloadModal registration={registration} />, document.querySelector('.SW-update-dialog'));
      }
    },
  });
  navigator.serviceWorker.register('../firebase-messaging-sw.js')
  .then(function(registration) {
      firebase.messaging().useServiceWorker(registration);
  }).catch(function(err) {
    console.log('Service worker registration failed, error:', err);
  });
}
