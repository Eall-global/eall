const InfoItem = ({ icon: Icon, title, value }) => {
  return (
    <div className="flex gap-3 items-center">
      {Icon && (
        <Icon
          className="
            text-sky-700
            text-lg
          "
        />
      )}

      <p className="text-sm text-slate-500">{title}</p>

      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  );
};

export default InfoItem;
