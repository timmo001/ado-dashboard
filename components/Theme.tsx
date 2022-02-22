import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { cyan, grey, indigo } from "@mui/material/colors";

let theme = createTheme({
  palette: {
    mode: "dark",
    primary: cyan,
    secondary: indigo,
    contrastThreshold: 3,
    tonalOffset: 0.2,
  },
  components: {
    MuiChip: {
      styleOverrides: {
        root: {
          margin: 2,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: grey[200],
        },
      },
    },
  },
});
theme = responsiveFontSizes(theme);

export default theme;
