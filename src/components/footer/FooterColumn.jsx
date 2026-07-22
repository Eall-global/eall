import { Link } from "react-router-dom";

const FooterColumn = ({ title, links }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-5">{title}</h3>

      <ul className="space-y-3">
        {links.map((item) => (
          <li key={item.label}>
            <Link
              to={item.path}
              className="
                text-slate-400
                hover:text-sky-400
                transition-colors
                text-sm
              "
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterColumn;
