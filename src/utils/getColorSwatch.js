const cssColors = [
  "black",
  "white",
  "blue",
  "red",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "gray",
  "grey",
  "silver",
  "gold",
  "brown",
  "beige",
  "cream",
  "ivory",
  "cyan",
  "navy",
  "teal",
  "olive",
  "maroon",
  "lime",
  "violet",
];

export const getColorSwatch = (color = "") => {
  const value = color.toLowerCase();

  const match = cssColors.find((item) => value.includes(item));

  switch (match) {
    case "grey":
      return "gray";

    case "ivory":
      return "#FFFFF0";

    case "cream":
      return "#FFFDD0";

    case "silver":
      return "#C0C0C0";

    case "gold":
      return "#D4AF37";

    default:
      return match || "#CBD5E1";
  }
};
