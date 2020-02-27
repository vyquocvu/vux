import "reflect-metadata";
import '../utils/firestore';
import { Collection, getRepository } from 'fireorm';

@Collection()
class Category {
  id: string;
  text: string;
};

export default getRepository(Category);
