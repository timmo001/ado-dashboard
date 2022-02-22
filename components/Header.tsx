import React, { ReactElement, useEffect, useState } from "react";
import {
  AppBar,
  Button,
  Drawer,
  Hidden,
  IconButton,
  PropTypes,
  Toolbar,
  Typography,
} from "@mui/material";
import { mdiMenu } from "@mdi/js";
import Icon from "@mdi/react";
import clsx from "clsx";

import useStyles from "assets/jss/components/header";

type ColorExpanded = PropTypes.Color | "transparent";

interface ChangeColorOnScroll {
  color: ColorExpanded;
  height: string | number;
}

interface HeaderProps {
  absolute?: string;
  brand?: string;
  changeColorOnScroll?: ChangeColorOnScroll;
  color?: ColorExpanded;
  fixed?: boolean;
  rightLinks?: ReactElement;
}

function Header(props: HeaderProps): ReactElement {
  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (props.changeColorOnScroll) {
      window.addEventListener("scroll", headerColorChange);
    }
    return function cleanup() {
      if (props.changeColorOnScroll) {
        window.removeEventListener("scroll", headerColorChange);
      }
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const headerColorChange = () => {
    const { color, changeColorOnScroll } = props;
    const windowsScrollTop = window.pageYOffset;
    if (windowsScrollTop > changeColorOnScroll.height) {
      document.body
        .getElementsByTagName("header")[0]
        .classList.remove(classes[color]);
      document.body
        .getElementsByTagName("header")[0]
        .classList.add(classes[changeColorOnScroll.color]);
    } else {
      document.body
        .getElementsByTagName("header")[0]
        .classList.add(classes[color]);
      document.body
        .getElementsByTagName("header")[0]
        .classList.remove(classes[changeColorOnScroll.color]);
    }
  };

  const { color, rightLinks, brand, fixed, absolute } = props;
  return (
    <AppBar
      className={clsx({
        [classes.appBar]: true,
        [classes[color]]: color,
        [classes.absolute]: absolute,
        [classes.fixed]: fixed,
      })}
      color={color}>
      <Toolbar className={classes.container}>
        <Typography className={classes.title} component="div" variant="h4">
          {brand}
        </Typography>
        <Hidden xlDown implementation="css">
          {rightLinks}
        </Hidden>
        <Hidden mdUp>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            size="large"
            onClick={handleDrawerToggle}>
            <Icon path={mdiMenu} size={1} />
          </IconButton>
        </Hidden>
      </Toolbar>
      <Hidden mdUp implementation="css">
        <Drawer
          variant="temporary"
          anchor={"right"}
          open={mobileOpen}
          classes={{
            paper: classes.drawerPaper,
          }}
          onClose={handleDrawerToggle}>
          <div className={classes.appResponsive}>{rightLinks}</div>
        </Drawer>
      </Hidden>
    </AppBar>
  );
}

export default Header;
