import initFirebase from './auth/initFirebase';

const firebase = initFirebase();
const storage = firebase.app().storage();
function makeid(length: number) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result.toLowerCase();
}

export default async (file: File, refPath: string) => {
  try {
    const fileType = file.type.split('/')[1];
    const id = refPath + '/' + makeid(12) + '.'+ fileType
    const storageRef = storage.ref().child(id);
    const snapshot = await storageRef.put(file);
    const url = await snapshot.ref.getDownloadURL();
    return url;
  } catch (error) {
    return null;
  }
}