import React, { ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { List, ListItem, Button, Tooltip } from "@mui/material";
import { mdiInformation } from "@mdi/js";
import { useTheme } from "@mui/material/styles";
// eslint-disable-next-line import/no-named-as-default
import Icon from "@mdi/react";
import clsx from "clsx";

import useStyles from "assets/jss/components/headerLinks";

function HeaderLinks(): ReactElement {
  const router = useRouter();
  const classes = useStyles();
  const theme = useTheme();
  return (
    <List className={classes.list}>
      <ListItem className={classes.listItem}>
        <Link
          href={{
            pathname: "/",
            query: router.query,
          }}>
          <Button variant="text" className={classes.navLink}>
            <span className={classes.listItemText}>Dashboard</span>
          </Button>
        </Link>
      </ListItem>
      <ListItem className={classes.listItem}>
        <Link
          href={{
            pathname: "/age",
            query: router.query,
          }}>
          <Button variant="text" className={classes.navLink}>
            <span className={classes.listItemText}>Age</span>
          </Button>
        </Link>
      </ListItem>
      <ListItem className={classes.listItem}>
        <Link
          href={{
            pathname: "/cycle-lead-time",
            query: router.query,
          }}>
          <Button variant="text" className={classes.navLink}>
            <span className={classes.listItemText}>Cycle/Lead Time</span>
          </Button>
        </Link>
      </ListItem>
      <ListItem className={classes.listItem}>
        <Link
          href={{
            pathname: "/iteration",
            query: router.query,
          }}>
          <Button variant="text" className={classes.navLink}>
            <span className={classes.listItemText}>Sprints</span>
          </Button>
        </Link>
      </ListItem>
    </List>
  );
}

export default HeaderLinks;
