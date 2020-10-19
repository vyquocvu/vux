
import firebase from "firebase/app";
import { Post } from 'interfaces/Post';
import initFirebase from "utils/auth/initFirebase";
import "firebase/firestore";

initFirebase();

const db = firebase.firestore();
const postCollection = db.collection("posts");
export const getPostById = async (id: string, isEdit = false) => {
  try {
    const postDoc = await postCollection.doc(id).get();
    const post: any = postDoc.exists ? {
      ...postDoc.data(),
      uid: postDoc.id,
    } : {};
    if (!isEdit) {
      delete post.draffContent;
    }
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
    throw error;
  }
};

export const getPosts = async (isServer = false) => {
  try {
    const postRepo = await postCollection.orderBy('createdAt', 'desc').get();
    const posts = postRepo.docs.map((sp) => {
      const data = sp.data();
      if (isServer) {
        return {
          uid: sp.id,
          thumbText: data.thumbText,
          updatedAt: data.updatedAt,
        }
      } else {
        return { ...data, uid: sp.id }
      }
    });
    return posts
  } catch (error) {
    return []
  }
};

export const getPostsByUserId = async (id: string) => {
  try {
    const postRepo = await postCollection
      .where('author', '==', id)
      .orderBy('createdAt', 'desc').get();
    const posts = postRepo.docs.map((sp) => ({...sp.data(), uid: sp.id }));
    return posts
  } catch (error) {
    console.log('error', error);
    return []
  }
};


export const addPost = async (postData: Post) => {
  try {
    const postDoc = await postCollection.add({...postData });
    const post = await getPostById(postDoc.id);
    return post;
  } catch (error) {
    throw error;
  }
};