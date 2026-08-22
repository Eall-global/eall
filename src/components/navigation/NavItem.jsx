import { NavLink } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";

const NavItem = ({
  item,
  activeMenu,
  setActiveMenu,
  onClick,
  isTransparent,
}) => {
  const hasMegaMenu = !!item.megaMenu;

  if (hasMegaMenu) {
    return (
      <button
        type="button"
        onClick={() =>
          setActiveMenu(
            activeMenu === item.megaMenu.type ? null : item.megaMenu.type,
          )
        }
        className={`
          flex
          items-center
          gap-1
          font-medium
          text-sm
          transition-colors
          cursor-pointer
          ${
            activeMenu === "products"
              ? "text-sky-600 font-semibold"
              : isTransparent
              ? "text-white/90 hover:text-white drop-shadow-xs"
              : "text-slate-700 hover:text-sky-700"
          }
        `}
      >
        {item.label}
        <FiChevronDown
          className={`transition-transform duration-300 ${
            activeMenu === "products" ? "rotate-180" : ""
          }`}
        />
      </button>
    );
  }

  return (
    <NavLink
      to={item.path}
      onClick={() => {
        setActiveMenu(null);
        onClick?.();
      }}
      className={({ isActive }) =>
        `
          font-medium
          text-sm
          transition-colors
          ${
            isActive
              ? isTransparent
                ? "text-sky-400 font-semibold drop-shadow-xs"
                : "text-sky-700 font-semibold"
              : isTransparent
              ? "text-white/90 hover:text-white drop-shadow-xs"
              : "text-slate-700 hover:text-sky-700"
          }
        `
      }
    >
      {item.label}
    </NavLink>
  );
};

export default NavItem;
