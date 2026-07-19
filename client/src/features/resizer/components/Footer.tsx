import { author } from "../../../config";

/** Author credit + contact links. */
export const Footer = () => (
  <footer className="footer">
    <span>
      Built by <b>{author.name}</b> · {author.year}
    </span>
    <nav className="footer__links">
      <a href={author.github} target="_blank" rel="noreferrer">
        GitHub
      </a>
      <a href={author.linkedin} target="_blank" rel="noreferrer">
        LinkedIn
      </a>
      <a href={`mailto:${author.email}`}>Email</a>
    </nav>
  </footer>
);
