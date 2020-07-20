
import firebase from "firebase/app";
import { Post } from '../interfaces/Post';
import initFirebase from "../utils/auth/initFirebase";
import "firebase/firestore";

initFirebase();

const db = firebase.firestore();
const postCollection = db.collection("posts");
export const getPostById = async (id: string) => {
  try {
    const postDoc = await postCollection.doc(id).get();
    const post = postDoc.exists ? {...postDoc.data(), uid: postDoc.id } : {};
    return post;
  } catch (error) {
    return {};
  }
};

export const setPostById = async (id: string, postData: Post) => {
  try {
    const post = await postCollection.doc(id).set({...postData });
    return post;
  } catch (error) {
    return {};
  }
};

export const getPosts = async () => {
  try {
    const postRepo = await postCollection.get();
    const posts = postRepo.docs.map((sp) => ({...sp.data(), uid: sp.id }));
    return posts
  } catch (error) {
    return []
  }
};