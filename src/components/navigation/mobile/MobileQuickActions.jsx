import { Link } from "react-router-dom";
import { FiBox, FiTag, FiShield } from "react-icons/fi";
import { useCountry } from "../../../context/CountryContext";

const MobileQuickActions = ({ onClose }) => {
  const { countryPath } = useCountry();

  const actions = [
    {
      label: "All Products",
      icon: FiBox,
      to: "/products",
      iconCls: "text-sky-700 bg-sky-50",
    },
    {
      label: "Brands",
      icon: FiTag,
      to: "/brands",
      iconCls: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Verify IMEI",
      icon: FiShield,
      to: "/verify",
      iconCls: "text-violet-700 bg-violet-50",
    },
  ];

  return (
    <section>
      <p className="text-[10px] font-bold uppercase tracking-wider text-left text-slate-400 mb-2">
        Quick Access
      </p>

      <div className="grid grid-cols-3 gap-2">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={countryPath(item.to)}
              onClick={onClose}
              className="rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-sky-300 hover:bg-white py-2.5 px-2 flex flex-col items-center justify-center gap-1.5 text-center transition"
            >
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.iconCls}`}
              >
                <Icon className="text-base" />
              </span>
              <span className="text-[11px] font-semibold text-slate-700 leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default MobileQuickActions;
