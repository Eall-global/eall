import { Link } from "react-router-dom";
import { FiBox, FiTag, FiShield } from "react-icons/fi";

const MobileQuickActions = ({ onClose }) => {
  const actions = [
    {
      label: "Products",
      icon: FiBox,
      to: "/products",
      color: "text-sky-700",
    },
    {
      label: "Brands",
      icon: FiTag,
      to: "/brands",
      color: "text-emerald-700",
    },
    {
      label: "Verify",
      icon: FiShield,
      to: "/verify",
      color: "text-violet-700",
    },
  ];

  return (
    <section>
      <p className="text-xs uppercase tracking-wider text-left text-slate-500 mb-3!">
        Quick Access
      </p>

      <div className="grid grid-cols-3 gap-3">
        {actions.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className="
                rounded-2xl
                bg-slate-50
                border
                border-slate-200
                p-4
                text-center
                hover:border-sky-300
                transition
              "
            >
              <Icon className={`mx-auto text-2xl ${item.color}`} />

              <p className="mt-3 text-sm font-medium text-slate-700">
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default MobileQuickActions;
