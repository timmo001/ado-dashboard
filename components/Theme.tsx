import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { cyan, indigo, purple } from "@mui/material/colors";

let theme = createTheme({
  palette: {
    mode: "dark",
    primary: cyan,
    secondary: indigo,
    contrastThreshold: 3,
    tonalOffset: 0.2,
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          color: purple[400],
        },
      },
    },
  },
});
theme = responsiveFontSizes(theme);

export default theme;
