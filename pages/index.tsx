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
// eslint-disable-next-line import/no-named-as-default
import Icon from "@mdi/react";

import { AzureDevOps } from "lib/azureDevOps";
import {
  AnalyticsWorkItem,
  Iteration,
  ProcessWorkItemTypeExtended,
  State,
  WorkItemExpanded,
} from "lib/types/azureDevOps";
import {
  getChartAnalyticsWorkItems,
  getChartAnalyticsWorkItemsCurrentIteration,
} from "lib/chartData";
import { groupByKey } from "lib/util";
import { stateIconMap } from "components/WorkItems";
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
  const { personalAccessToken, organization, project, areaPath } =
    router.query as NodeJS.Dict<string>;

  useEffect(() => {
    const missingParameters: Array<string> = [];
    if (!organization || organization === "")
      missingParameters.push("organization");
    if (!project || project === "") missingParameters.push("project");
    if (!personalAccessToken || personalAccessToken === "")
      missingParameters.push("personalAccessToken");
    if (missingParameters.length > 0) {
      setAlert(
        `Missing required query parameter${
          missingParameters.length > 1 ? "s" : ""
        }: ${missingParameters.join(", ")}`
      );
      return;
    }
    setAlert(undefined);
    console.log("Get data:", { organization, project, areaPath });
    const azureDevOps = new AzureDevOps(
      personalAccessToken,
      organization,
      project
    );
    azureDevOps
      .getIterations()
      .then((result: Array<Iteration>) => setIterations(result));
    azureDevOps
      .getStatesFromProject()
      .then(
        (result: {
          states: Array<State>;
          processWorkItemTypes: Array<ProcessWorkItemTypeExtended>;
        }) => {
          setStates(
            result.states.filter(
              (state: State) => state.stateCategory !== "Completed"
            )
          );
        }
      );
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
      .getWorkItemIds(areaPath, false, true, false)
      .then((ids: Array<number>) =>
        azureDevOps
          .getWorkItems(ids)
          .then((result: Array<WorkItemExpanded>) => setWorkItems(result))
      );
  }, [areaPath, organization, project, personalAccessToken]);

  const chartAnalyticsWorkItemsCurrentIteration = useMemo<
    Array<{ [key: string]: string | number }>
  >(
    () =>
      getChartAnalyticsWorkItemsCurrentIteration(
        analyticsWorkItemsCurrentIteration
      ),
    [analyticsWorkItemsCurrentIteration]
  );

  const chartAnalyticsWorkItems = useMemo<
    Array<{ [key: string]: string | number }>
  >(
    () => getChartAnalyticsWorkItems(analyticsWorkItems, states),
    [analyticsWorkItems, states]
  );

  const currentIteration = useMemo<Iteration>(() => {
    if (!iterations) return undefined;
    return iterations.find(
      (iteration: Iteration) => iteration.attributes.timeFrame === "current"
    );
  }, [iterations]);

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
      description="Azure DevOps Dashboard"
    >
      <Grid
        className={classes.main}
        component="article"
        container
        direction="row"
        alignContent="space-around"
        justifyContent="center"
      >
        {alert ? (
          <Grid item xs={11}>
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
          }}
        >
          <Typography component="h3" gutterBottom variant="h4">
            Backlog
          </Typography>
          {itemsByStateBacklog && states ? (
            <Grid
              container
              direction="row"
              alignContent="space-around"
              justifyContent="space-around"
            >
              {states.map((state: State) => (
                <Grid
                  key={state.id}
                  item
                  xs={4}
                  sx={{
                    margin: theme.spacing(1, 0),
                    color: `#${state.color}`,
                  }}
                >
                  <Typography variant="h4" noWrap>
                    {state.name}
                    {stateIconMap[state.name] ? (
                      <Icon
                        color={`#${state.color}`}
                        path={stateIconMap[state.name]}
                        size={1}
                        style={{ marginLeft: theme.spacing(1) }}
                      />
                    ) : (
                      ""
                    )}
                  </Typography>
                  <Typography variant="h5" noWrap>
                    {itemsByStateBacklog[state.name]?.length || 0}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid
              container
              alignContent="space-around"
              justifyContent="space-around"
            >
              <CircularProgress color="primary" />
            </Grid>
          )}
          <Typography
            component="h4"
            gutterBottom
            variant="h5"
            sx={{ marginTop: theme.spacing(2) }}
          >
            Items by State
          </Typography>
          {chartAnalyticsWorkItems && states ? (
            <>
              <div
                style={{
                  width: "100%",
                  height: 520,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartAnalyticsWorkItems}>
                    <XAxis dataKey="Date" />
                    <YAxis />
                    <Tooltip contentStyle={{ background: "#212121" }} />
                    <Legend />
                    {states
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
              justifyContent="space-around"
            >
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
          }}
        >
          <Typography component="h3" gutterBottom variant="h4">
            Current Sprint
          </Typography>
          {itemsByStateCurrentIteration && states ? (
            <Grid
              container
              direction="row"
              alignContent="space-around"
              justifyContent="space-around"
            >
              {states.map((state: State) => (
                <Grid
                  key={state.id}
                  item
                  xs={4}
                  sx={{
                    margin: theme.spacing(1, 0),
                    color: `#${state.color}`,
                  }}
                >
                  <Typography variant="h4" noWrap>
                    {state.name}
                    {stateIconMap[state.name] ? (
                      <Icon
                        color={`#${state.color}`}
                        path={stateIconMap[state.name]}
                        size={1}
                        style={{ marginLeft: theme.spacing(1) }}
                      />
                    ) : (
                      ""
                    )}
                  </Typography>
                  <Typography variant="h5" noWrap>
                    {itemsByStateCurrentIteration[state.name]?.length || 0}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid
              container
              alignContent="space-around"
              justifyContent="space-around"
            >
              <CircularProgress color="primary" />
            </Grid>
          )}
          <Typography
            component="h4"
            gutterBottom
            variant="h5"
            sx={{ marginTop: theme.spacing(2) }}
          >
            Items by State
          </Typography>
          {chartAnalyticsWorkItemsCurrentIteration && states ? (
            <>
              <div
                style={{
                  width: "100%",
                  height: 520,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartAnalyticsWorkItemsCurrentIteration}>
                    <XAxis dataKey="Date" />
                    <YAxis />
                    <Tooltip contentStyle={{ background: "#212121" }} />
                    <Legend />
                    {states.map((state: State) => (
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
              justifyContent="space-around"
            >
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
