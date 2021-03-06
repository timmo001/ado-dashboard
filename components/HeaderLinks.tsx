import React, { ReactElement, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { List, ListItem, Button } from "@mui/material";
import clsx from "clsx";

import SetProject from "./SetProject";
import useStyles from "assets/jss/components/headerLinks";

function HeaderLinks(): ReactElement {
  const [setProject, setSetProject] = useState<boolean>(false);

  const router = useRouter();
  const classes = useStyles();

  function handleSetProject(): void {
    setSetProject(true);
  }

  return (
    <>
      <List className={classes.list}>
        <ListItem className={classes.listItem}>
          <Button
            variant="outlined"
            className={classes.navLink}
            onClick={handleSetProject}
          >
            <span className={classes.listItemText}>Set Project</span>
          </Button>
        </ListItem>
        <ListItem className={clsx(classes.listItem, classes.divider)} />
        <ListItem className={classes.listItem}>
          <Link
            href={{
              pathname: "/",
              query: router.query,
            }}
          >
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
            }}
          >
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
            }}
          >
            <Button variant="text" className={classes.navLink}>
              <span className={classes.listItemText}>Cycle/Lead Time</span>
            </Button>
          </Link>
        </ListItem>
        <ListItem className={classes.listItem}>
          <Link
            href={{
              pathname: "/backlog",
              query: router.query,
            }}
          >
            <Button variant="text" className={classes.navLink}>
              <span className={classes.listItemText}>Backlog</span>
            </Button>
          </Link>
        </ListItem>
        <ListItem className={classes.listItem}>
          <Link
            href={{
              pathname: "/iteration",
              query: router.query,
            }}
          >
            <Button variant="text" className={classes.navLink}>
              <span className={classes.listItemText}>Sprints</span>
            </Button>
          </Link>
        </ListItem>
      </List>
      {setProject ? <SetProject /> : ""}
    </>
  );
}

export default HeaderLinks;
