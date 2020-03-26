import { NextApiRequest, NextApiResponse } from 'next'
import Post from '~models/post'


export default async function(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        const list = await Post.find();
        res.status(200).json(list);
        break;
      default:
        res.status(400).json({ message: 'Bad request' })
        break;
    }
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}