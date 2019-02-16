import firebase from 'firebase';

var config = {
  apiKey: "AIzaSyBtBU5SO7VUp_pHDGSNaeLSdzrhgoIyrAw",
  authDomain: "beezy-7154e.firebaseapp.com",
  databaseURL: "https://beezy-7154e.firebaseio.com",
  projectId: "beezy-7154e",
  storageBucket: "beezy-7154e.appspot.com",
  messagingSenderId: "212818390361"
};

firebase.initializeApp(config);

const database = firebase.database();

export { database };