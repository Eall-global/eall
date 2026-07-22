import InfoCard from "../common/InfoCard";

const SolutionCard = ({ icon: Icon, title, description, badge, link }) => {
  return (
    <InfoCard
      icon={<Icon />}
      title={title}
      description={description}
      badge={badge}
      link={link}
      buttonText="Explore Solution"
    />
  );
};

export default SolutionCard;
