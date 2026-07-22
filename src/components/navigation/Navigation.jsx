import NavItem from "./NavItem";
import { navigationLinks } from "../../constants/navigation";

const Navigation = ({ activeMenu, setActiveMenu }) => {
  return (
    <nav className="hidden md:flex items-center gap-8">
      {navigationLinks.map((item) => (
        <NavItem
          key={item.path}
          item={item}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          onClick={() => setActiveMenu(null)}
        />
      ))}
    </nav>
  );
};

export default Navigation;
