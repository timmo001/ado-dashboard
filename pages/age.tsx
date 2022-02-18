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

import { AnalyticsWorkItem, State } from "lib/types/azureDevOps";
import { AzureDevOps } from "lib/azureDevOps";
import { getChartAnalyticsWorkItemsAge } from "lib/chartData";
import Layout from "components/Layout";
import useStyles from "assets/jss/components/layout";

function Age(): ReactElement {
  const [alert, setAlert] = useState<string>();
  const [analyticsWorkItems, setAnalyticsWorkItems] =
    useState<Array<AnalyticsWorkItem>>();
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
    console.log("Get data:", organization, project);
    const azureDevOps = new AzureDevOps(
      organization,
      project,
      personalAccessToken
    );
    azureDevOps.getStates().then((result: Array<State>) => setStates(result));
    azureDevOps
      .getAnalyticsWorkItems()
      .then((result: Array<AnalyticsWorkItem>) =>
        setAnalyticsWorkItems(result)
      );
  }, [organization, project, personalAccessToken]);

  const chartAnalyticsWorkItemsAge = useMemo<
    Array<{ [key: string]: string | number }>
  >(
    () => getChartAnalyticsWorkItemsAge(analyticsWorkItems, states),
    [analyticsWorkItems, states]
  );

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
          <Grid item xs={11}>
            <Alert severity="error">{alert}</Alert>
          </Grid>
        ) : (
          ""
        )}
        <Grid item xs={11}>
          <Typography component="h3" gutterBottom variant="h4">
            Average Age of Open Items
          </Typography>
          {chartAnalyticsWorkItemsAge && states ? (
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
                      stroke={`#${states[states.length - 1].color}`}
                    />
                    {states
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
