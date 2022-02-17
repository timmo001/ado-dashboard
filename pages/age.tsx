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
  AreaChart,
  Area,
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
  AnalyticsLeadCycleTime,
  AnalyticsWorkItem,
  Iteration,
  State,
  WorkItemExpanded,
} from "lib/types/azureDevOps";
import Layout from "components/Layout";
import useStyles from "assets/jss/components/layout";

function Age(): ReactElement {
  const [alert, setAlert] = useState<string>();
  const [analyticsWorkItems, setAnalyticsWorkItems] =
    useState<Array<AnalyticsWorkItem>>();
  const [iterations, setIterations] = useState<Array<Iteration>>();
  const [states, setStates] = useState<Array<State>>();

  const router = useRouter();
  const { personalAccessToken, organization, project } =
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
    console.log("Get data..");
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
      .getAnalyticsWorkItems()
      .then((result: Array<AnalyticsWorkItem>) =>
        setAnalyticsWorkItems(result)
      );
  }, [organization, project, personalAccessToken]);

  const chartAnalyticsWorkItemsAge = useMemo<
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
      const sum: number = dates[date].reduce(
        (a: number, b: AnalyticsWorkItem) => a + b.daysSinceCreated,
        0
      );
      const avg: number = sum / dates[date].length || 0;
      value["Average Age"] = avg;
      value["Total Age"] = sum;

      const itemsByStates = groupByKey<AnalyticsWorkItem>(dates[date], "State");
      Object.keys(itemsByStates).forEach((state: string) => {
        const sumState: number = itemsByStates[state].reduce(
          (a: number, b: AnalyticsWorkItem) => {
            return a + b.daysSinceCreated;
          },
          0
        );
        const avgState: number = sumState / itemsByStates[state].length || 0;
        value[`${state} Average Age`] = avgState;
        value[`${state} Total Age`] = sumState;
      });
      return value;
    });
  }, [analyticsWorkItems, states]);

  const statesView = useMemo<Array<State>>(() => {
    if (!states) return undefined;
    return states.filter((state: State) => !state.hidden);
  }, [states]);

  const classes = useStyles();
  const theme = useTheme();

  return (
    <Layout classes={classes} title="Age" description="Azure DevOps Dashboard">
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
          xs={10}
          sx={{
            padding: theme.spacing(1, 2, 1, 2),
          }}>
          <Typography component="h3" gutterBottom variant="h4">
            Average Age of Open Items
          </Typography>
          {chartAnalyticsWorkItemsAge && statesView ? (
            <>
              <div
                style={{
                  width: "100%",
                  height: 760,
                }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartAnalyticsWorkItemsAge}>
                    <XAxis dataKey="Date" />
                    <YAxis />
                    <Tooltip contentStyle={{ background: "#212121" }} />
                    <Legend />
                    <Line
                      type="linear"
                      dataKey="Average Age"
                      stroke={`#${statesView[statesView.length - 1].color}`}
                    />
                    {statesView
                      .filter((state: State) => state.name !== "Closed")
                      .map((state: State) => (
                        <Line
                          key={state.id}
                          type="linear"
                          dataKey={`${state.name} Average Age`}
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

export default Age;
