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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import moment from "moment";

import { AzureDevOps } from "lib/azureDevOps";
import { groupByKey } from "lib/util";
import { AnalyticsLeadCycleTime, State } from "lib/types/azureDevOps";
import Layout from "components/Layout";
import useStyles from "assets/jss/components/layout";

function CycleLeadTime(): ReactElement {
  const [alert, setAlert] = useState<string>();
  const [analyticsLeadCycleTime, setAnalyticsLeadCycleTime] =
    useState<Array<AnalyticsLeadCycleTime>>();
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
    azureDevOps.getStates().then((result: Array<State>) => setStates(result));
    azureDevOps
      .getAnalyticsLeadCycleTime()
      .then((result: Array<AnalyticsLeadCycleTime>) =>
        setAnalyticsLeadCycleTime(result)
      );
  }, [organization, project, personalAccessToken]);

  const chartAnalyticsLeadCycleTime = useMemo<
    Array<{ [key: string]: string | number }>
  >(() => {
    if (!analyticsLeadCycleTime) return undefined;
    const dates = groupByKey<AnalyticsLeadCycleTime>(
      analyticsLeadCycleTime,
      "CompletedDateSK"
    );
    return Object.keys(dates).map((date: string) => {
      const sumCycleTime: number = dates[date].reduce(
        (a: number, b: AnalyticsLeadCycleTime) => a + b.CycleTimeDays,
        0
      );
      const avgCycleTime: number = sumCycleTime / dates[date].length || 0;

      const sumLeadTime: number = dates[date].reduce(
        (a: number, b: AnalyticsLeadCycleTime) => a + b.LeadTimeDays,
        0
      );
      const avgLeadTime: number = sumLeadTime / dates[date].length || 0;

      let value = {
        Date: moment(date).format("Do MMM YYYY"),
        "Average Cycle Time": avgCycleTime,
        "Total Cycle Time": sumCycleTime,
        "Average Lead Time": avgLeadTime,
        "Total Lead Time": sumLeadTime,
      };
      return value;
    });
  }, [analyticsLeadCycleTime]);

  const statesView = useMemo<Array<State>>(() => {
    if (!states) return undefined;
    return states.filter((state: State) => !state.hidden);
  }, [states]);

  const classes = useStyles();
  const theme = useTheme();

  return (
    <Layout
      classes={classes}
      title="Cycle/Lead Time"
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
          xs={10}
          sx={{
            padding: theme.spacing(1, 2, 1, 2),
          }}>
          <Typography component="h3" gutterBottom variant="h4">
            Average Cycle/Lead Time
          </Typography>
          {chartAnalyticsLeadCycleTime && statesView ? (
            <>
              <div
                style={{
                  width: "100%",
                  height: 760,
                }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartAnalyticsLeadCycleTime}>
                    <XAxis dataKey="Date" />
                    <YAxis />
                    <Tooltip contentStyle={{ background: "#212121" }} />
                    <Legend />
                    <defs>
                      <linearGradient
                        id="colorAverageCycle"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1">
                        <stop
                          offset="5%"
                          stopColor={`#${
                            statesView[statesView.length - 4].color
                          }`}
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="95%"
                          stopColor={`#${
                            statesView[statesView.length - 4].color
                          }`}
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorAverageLead"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1">
                        <stop
                          offset="5%"
                          stopColor={`#${
                            statesView[statesView.length - 2].color
                          }`}
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="95%"
                          stopColor={`#${
                            statesView[statesView.length - 2].color
                          }`}
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="linear"
                      dataKey="Average Cycle Time"
                      stroke={`#${statesView[statesView.length - 4].color}`}
                      fillOpacity={1}
                      fill="url(#colorAverageCycle)"
                    />
                    <Area
                      type="linear"
                      dataKey="Average Lead Time"
                      stroke={`#${statesView[statesView.length - 2].color}`}
                      fillOpacity={1}
                      fill="url(#colorAverageLead)"
                    />
                  </AreaChart>
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

export default CycleLeadTime;
