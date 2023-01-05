import { TAGS } from '../utils/tags';

const Projects = () => {
  return <div>
    This is some project
    {
      TAGS.map((tag) => {
        return <div key={tag}>
          <h2>{tag}
          </h2>
          </div>})
    }
  </div>;
};

export default Projects;
