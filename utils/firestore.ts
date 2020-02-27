import * as admin from 'firebase-admin';
import * as fireorm from 'fireorm';

const serviceAccount = require('../firestore.creds.json');
let firestore = null;
if (admin.apps.length) {
  firestore = admin.apps[0];
} else {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });

  firestore = admin.firestore();
  firestore.settings({ timestampsInSnapshots: true });
  fireorm.initialize(firestore);

}

export default firestore;