import "reflect-metadata";
import '../utils/firestore';
import { Collection, getRepository } from 'fireorm';

@Collection()
class Post {
  id: string;
  text: string;
};

export default getRepository(Post);
