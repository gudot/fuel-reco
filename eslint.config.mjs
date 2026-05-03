import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    rules: {
      "react-hooks/incompatible-library": "off"
    }
  }
];

export default eslintConfig;
