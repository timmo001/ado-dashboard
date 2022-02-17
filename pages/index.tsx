import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import {
  Alert,
  CircularProgress,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import moment from "moment";

import { AzureDevOps } from "lib/azureDevOps";
import { groupByKey } from "lib/util";
import {
  AnalyticsWorkItem,
  Iteration,
  State,
  WorkItemExpanded,
} from "lib/types/azureDevOps";
import Layout from "components/Layout";
import useStyles from "assets/jss/components/layout";

function Dashboard(): ReactElement {
  const [alert, setAlert] = useState<string>();
  const [
    analyticsWorkItemsCurrentIteration,
    setAnalyticsWorkItemsCurrentIteration,
  ] = useState<Array<AnalyticsWorkItem>>();
  const [analyticsWorkItems, setAnalyticsWorkItems] =
    useState<Array<AnalyticsWorkItem>>();
  const [iterations, setIterations] = useState<Array<Iteration>>();
  const [states, setStates] = useState<Array<State>>();
  const [workItems, setWorkItems] = useState<Array<WorkItemExpanded>>();

  const router = useRouter();
  const { personalAccessToken, organization, project, query } =
    router.query as NodeJS.Dict<string>;

  useEffect(() => {
    const missingParameters: Array<string> = [];
    if (!organization || organization === "")
      missingParameters.push("organization");
    if (!project || project === "") missingParameters.push("project");
    if (!personalAccessToken || personalAccessToken === "")
      missingParameters.push("personalAccessToken");
    if (!query || query === "") missingParameters.push("query");
    if (missingParameters.length > 0) {
      setAlert(
        `Missing required query parameter${
          missingParameters.length > 1 ? "s" : ""
        }: ${missingParameters.join(", ")}`
      );
      return;
    }
    setAlert(undefined);
    console.log("Get data:", organization, project);
    const azureDevOps = new AzureDevOps(
      organization,
      project,
      personalAccessToken
    );
    azureDevOps
      .getIterations()
      .then((result: Array<Iteration>) => setIterations(result));
    azureDevOps.getStates().then((result: Array<State>) => setStates(result));
    azureDevOps
      .getAnalyticsWorkItemsCurrentIteration()
      .then((result: Array<AnalyticsWorkItem>) =>
        setAnalyticsWorkItemsCurrentIteration(result)
      );
    azureDevOps
      .getAnalyticsWorkItems()
      .then((result: Array<AnalyticsWorkItem>) =>
        setAnalyticsWorkItems(result)
      );
    azureDevOps
      .getWorkItemIds(query)
      .then((ids: Array<number>) =>
        azureDevOps
          .getWorkItems(ids)
          .then((result: Array<WorkItemExpanded>) => setWorkItems(result))
      );
  }, [organization, project, personalAccessToken]);

  const chartAnalyticsWorkItemsCurrentIteration = useMemo<
    Array<{ [key: string]: string | number }>
  >(() => {
    if (!analyticsWorkItemsCurrentIteration) return undefined;
    const dates = groupByKey<AnalyticsWorkItem>(
      analyticsWorkItemsCurrentIteration.sort(
        (a: AnalyticsWorkItem, b: AnalyticsWorkItem) =>
          a.DateValue > b.DateValue ? 1 : -1
      ),
      "DateValue"
    );
    return Object.keys(dates).map((date: string) => {
      let value = {
        Date: moment(date).format("Do MMM YYYY"),
      };
      const itemsByStates = groupByKey<AnalyticsWorkItem>(dates[date], "State");
      Object.keys(itemsByStates).forEach((state: string) => {
        value[state] = itemsByStates[state].length;
      });
      return value;
    });
  }, [analyticsWorkItemsCurrentIteration]);

  const chartAnalyticsWorkItems = useMemo<
    Array<{ [key: string]: string | number }>
  >(() => {
    if (!analyticsWorkItems || !states) return undefined;
    const dates = groupByKey<AnalyticsWorkItem>(
      analyticsWorkItems
        .filter(
          (workItem: AnalyticsWorkItem) =>
            workItem.State !== "Removed" && workItem.State !== "Closed"
        )
        .sort((a: AnalyticsWorkItem, b: AnalyticsWorkItem) =>
          a.DateValue > b.DateValue ? 1 : -1
        ),
      "DateValue"
    );
    return Object.keys(dates).map((date: string) => {
      let value = {
        Date: moment(date).format("Do MMM YYYY"),
      };
      const itemsByStates = groupByKey<AnalyticsWorkItem>(dates[date], "State");
      Object.keys(itemsByStates).forEach((state: string) => {
        if (!value[state]) value[state] = 0;
        value[state] += itemsByStates[state].length;
      });
      return value;
    });
  }, [analyticsWorkItems, states]);

  const currentIteration = useMemo<Iteration>(() => {
    if (!iterations) return undefined;
    return iterations.find(
      (iteration: Iteration) => iteration.attributes.timeFrame === "current"
    );
  }, [iterations]);

  const statesView = useMemo<Array<State>>(() => {
    if (!states) return undefined;
    return states.filter((state: State) => !state.hidden);
  }, [states]);

  const itemsByIteration = useMemo<{
    [iteration: string]: Array<WorkItemExpanded>;
  }>(() => {
    if (!iterations || !workItems) return undefined;
    return groupByKey<WorkItemExpanded>(workItems, "iteration");
  }, [iterations, workItems]);

  const itemsByStateBacklog = useMemo<{
    [state: string]: Array<WorkItemExpanded>;
  }>(() => {
    if (!itemsByIteration) return undefined;
    return groupByKey<WorkItemExpanded>(
      itemsByIteration["Backlog"],
      "System.State"
    );
  }, [itemsByIteration]);

  const itemsByStateCurrentIteration = useMemo<{
    [state: string]: Array<WorkItemExpanded>;
  }>(() => {
    if (!currentIteration || !itemsByIteration) return undefined;
    return groupByKey<WorkItemExpanded>(
      itemsByIteration[currentIteration.name],
      "System.State"
    );
  }, [currentIteration, itemsByIteration]);

  const classes = useStyles();
  const theme = useTheme();

  return (
    <Layout
      classes={classes}
      title="Dashboard"
      description="Azure DevOps Dashboard">
      <Grid
        className={classes.main}
        component="article"
        container
        direction="row"
        alignContent="space-around"
        justifyContent="space-around">
        {alert ? (
          <Grid
            item
            xs={12}
            sx={{
              padding: theme.spacing(1, 4, 4, 4),
            }}>
            <Alert severity="error">{alert}</Alert>
          </Grid>
        ) : (
          ""
        )}
        <Grid
          item
          xs={6}
          sx={{
            padding: theme.spacing(1, 2, 1, 4),
            borderRight: "1px dashed #cccccc",
          }}>
          <Typography component="h3" gutterBottom variant="h4">
            Backlog
          </Typography>
          {itemsByStateBacklog ? (
            <Grid
              container
              direction="row"
              alignContent="space-around"
              justifyContent="space-around">
              {states
                .filter((state: State) => !state.hidden)
                .map((state: State) => (
                  <Grid
                    key={state.id}
                    item
                    xs={4}
                    sx={{
                      padding: theme.spacing(1),
                      color: `#${state.color}`,
                    }}>
                    <Typography variant="h4">{state.name}</Typography>
                    <Typography variant="h5">
                      {itemsByStateBacklog[state.name]?.length || 0}
                    </Typography>
                  </Grid>
                ))}
            </Grid>
          ) : (
            <Grid
              container
              alignContent="space-around"
              justifyContent="space-around">
              <CircularProgress color="primary" />
            </Grid>
          )}
          <Typography component="h4" gutterBottom variant="h5">
            Items by State
          </Typography>
          {chartAnalyticsWorkItems && statesView ? (
            <>
              <div
                style={{
                  width: "100%",
                  height: 600,
                }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartAnalyticsWorkItems}>
                    <XAxis dataKey="Date" />
                    <YAxis />
                    <Tooltip contentStyle={{ background: "#212121" }} />
                    <Legend />
                    {statesView
                      .filter((state: State) => state.name !== "Closed")
                      .map((state: State) => (
                        <Line
                          key={state.id}
                          type="linear"
                          dataKey={state.name}
                          stroke={`#${state.color}`}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <Grid
              container
              alignContent="space-around"
              justifyContent="space-around">
              <CircularProgress color="primary" />
            </Grid>
          )}
        </Grid>
        <Grid
          item
          xs={6}
          sx={{
            padding: theme.spacing(1, 4, 1, 2),
            borderLeft: "1px dashed #cccccc",
          }}>
          <Typography component="h3" gutterBottom variant="h4">
            Current Sprint
          </Typography>
          {itemsByStateCurrentIteration && statesView ? (
            <Grid
              container
              direction="row"
              alignContent="space-around"
              justifyContent="space-around">
              {statesView.map((state: State) => (
                <Grid
                  key={state.id}
                  item
                  xs={4}
                  sx={{
                    padding: theme.spacing(1),
                    color: `#${state.color}`,
                  }}>
                  <Typography variant="h4">{state.name}</Typography>
                  <Typography variant="h5">
                    {itemsByStateCurrentIteration[state.name]?.length || 0}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid
              container
              alignContent="space-around"
              justifyContent="space-around">
              <CircularProgress color="primary" />
            </Grid>
          )}
          <Typography component="h4" gutterBottom variant="h5">
            Items by State
          </Typography>
          {chartAnalyticsWorkItemsCurrentIteration && statesView ? (
            <>
              <div
                style={{
                  width: "100%",
                  height: 600,
                }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartAnalyticsWorkItemsCurrentIteration}>
                    <XAxis dataKey="Date" />
                    <YAxis />
                    <Tooltip contentStyle={{ background: "#212121" }} />
                    <Legend />
                    {statesView.map((state: State) => (
                      <Line
                        key={state.id}
                        type="linear"
                        dataKey={state.name}
                        stroke={`#${state.color}`}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <Grid
              container
              alignContent="space-around"
              justifyContent="space-around">
              <CircularProgress color="primary" />
            </Grid>
          )}
        </Grid>
      </Grid>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 1,
  };
};

export default Dashboard;
