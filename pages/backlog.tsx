import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import {
  Alert,
  Button,
  CircularProgress,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import { GridRowId, GridSelectionModel } from "@mui/x-data-grid";
import { camelCase } from "lodash";
// eslint-disable-next-line import/no-named-as-default
import Icon from "@mdi/react";
import moment from "moment";

import { AzureDevOps } from "lib/azureDevOps";
import {
  Field,
  Iteration,
  ProcessWorkItemTypeExtended,
  State,
  WorkItemExpanded,
} from "lib/types/azureDevOps";
import { groupByKey } from "lib/util";
import { Picker } from "lib/types/general";
import Layout from "components/Layout";
import MoveIteration from "components/MoveIteration";
import useStyles from "assets/jss/components/layout";
import WorkItems, {
  CustomFieldMap,
  stateIconMap,
  WorkItemsView,
} from "components/WorkItems";

let azureDevOps: AzureDevOps;
function Backlog(): ReactElement {
  const [alert, setAlert] = useState<string>();
  const [fields, setFields] = useState<Array<Field>>();
  const [iterations, setIterations] = useState<Array<Iteration>>();
  const [moveIteration, setMoveIteration] = useState<boolean>(false);
  const [selectionModel, setSelectionModel] = useState<GridSelectionModel>([]);
  const [states, setStates] = useState<Array<State>>();
  const [workItems, setWorkItems] = useState<Array<WorkItemExpanded>>();

  const router = useRouter();
  const { personalAccessToken, organization, project, areaPath } =
    router.query as NodeJS.Dict<string>;

  const setup = useCallback(() => {
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
    azureDevOps = new AzureDevOps(personalAccessToken, organization, project);
    azureDevOps.getFields().then((result: Array<Field>) => setFields(result));
    azureDevOps.getIterations().then((result: Array<Iteration>) => {
      setIterations(result);
    });
    azureDevOps
      .getWorkItemIds(areaPath, true, true, true)
      .then((ids: Array<number>) =>
        azureDevOps
          .getWorkItems(ids)
          .then((result: Array<WorkItemExpanded>) => setWorkItems(result))
      );

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
  }, [areaPath, organization, project, personalAccessToken]);

  useEffect(() => {
    setup();
  }, [areaPath, organization, project, personalAccessToken]);

  const customFieldMap = useMemo<CustomFieldMap>(() => {
    if (!fields) return undefined;
    const fieldMap = {};
    for (const field of fields)
      if (
        field.referenceName.startsWith("Custom.") &&
        !Object.keys(fieldMap).includes(field.referenceName)
      )
        fieldMap[field.referenceName] = {
          key: camelCase(field.referenceName.replace("Custom.", "")),
          title: field.name,
        };
    return fieldMap;
  }, [fields]);

  const currentIteration = useMemo<Iteration>(() => {
    if (!iterations) return undefined;
    return iterations.find(
      (iteration: Iteration) => iteration.attributes.timeFrame === "current"
    );
  }, [iterations]);

  const iterationsPicker = useMemo<Array<Picker>>(() => {
    if (!iterations) return undefined;
    const ci = iterations.find(
      (i: Iteration) => i.attributes.timeFrame === "current"
    );
    return iterations.map((i: Iteration) => ({
      id: i.id,
      label: `${i.id === ci?.id ? `(Current) ` : ""}${i.name}${
        i.attributes.startDate
          ? ` (${moment(i.attributes.startDate).format(
              "DD/MM/YYYY"
            )} - ${moment(i.attributes.finishDate).format("DD/MM/YYYY")})}`
          : ""
      }`,
    }));
  }, [iterations]);

  const currentIterationPicker = useMemo<Picker>(() => {
    if (!currentIteration || !iterationsPicker) return undefined;
    return iterationsPicker.find((ip: Picker) => ip.id === currentIteration.id);
  }, [currentIteration, iterationsPicker]);

  const workItemsView = useMemo<Array<WorkItemsView>>(() => {
    if (!workItems || !customFieldMap) return undefined;
    return workItems.map((wi: WorkItemExpanded) => {
      const item = {
        id: wi.id,
        order: wi["Microsoft.VSTS.Common.StackRank"],
        type: wi["System.WorkItemType"],
        title: wi["System.Title"],
        url: `https://dev.azure.com/${organization}/${project}/_workitems/edit/${wi.id}`,
        iteration: wi.iteration,
        state: wi["System.State"],
        assignedTo: wi["System.AssignedTo"]?.displayName,
        storyPoints: wi["Microsoft.VSTS.Scheduling.StoryPoints"],
        tags: wi["System.Tags"],
        areaPath: wi["System.AreaPath"],
        blocked: wi["Microsoft.VSTS.CMMI.Blocked"],
      };
      for (const key of Object.keys(wi))
        if (Object.keys(customFieldMap).includes(key))
          item[customFieldMap[key].key] = wi[key];
      return item;
    });
  }, [workItems]);

  const itemsByState = useMemo<{
    [state: string]: Array<WorkItemExpanded>;
  }>(() => {
    if (!workItems) return undefined;
    return groupByKey<WorkItemExpanded>(workItems, "System.State");
  }, [workItems]);

  function handleMoveIteration(): void {
    console.log("handleMoveIteration:", selectionModel);
    setMoveIteration(true);
  }

  function handleCloseMoveIteration(): void {
    setMoveIteration(false);
  }

  function handleMoveIterationConfirm(newIteration: Picker): void {
    const it = iterations.find((it: Iteration) => it.id === newIteration.id);
    if (!it) {
      console.error("Could not find iteration");
      return;
    }
    selectionModel.forEach(async (id: GridRowId) => {
      await azureDevOps.updateWorkItem(Number(id), [
        {
          op: "add",
          path: "/fields/System.IterationPath",
          value: it.path,
        },
      ]);
    });
    handleCloseMoveIteration();
    setup();
  }

  const classes = useStyles();
  const theme = useTheme();

  return (
    <>
      <Layout
        classes={classes}
        title="Backlog"
        description="Azure DevOps Dashboard">
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
            {workItemsView && states ? (
              <>
                <Grid
                  container
                  direction="row"
                  alignContent="space-between"
                  justifyContent="space-between">
                  <Grid item xs={8}>
                    <Typography component="h3" variant="h4">
                      Backlog
                    </Typography>
                  </Grid>
                  <Grid
                    container
                    item
                    xs={12}
                    sx={{
                      padding: theme.spacing(1, 0),
                    }}
                    alignContent="space-around"
                    justifyContent="flex-end">
                    <Grid
                      item
                      xs
                      container
                      direction="row"
                      alignContent="space-around"
                      justifyContent="space-around">
                      {states.map((state: State) => (
                        <Grid
                          key={state.id}
                          item
                          sx={{
                            padding: theme.spacing(1),
                            color: `#${state.color}`,
                          }}>
                          {stateIconMap[state.name] ? (
                            <Icon
                              color={`#${state.color}`}
                              path={stateIconMap[state.name]}
                              size={0.75}
                              style={{ marginRight: theme.spacing(0.5) }}
                            />
                          ) : (
                            ""
                          )}
                          <Typography component="span" variant="subtitle1">
                            {state.name}:{" "}
                            {itemsByState[state.name]?.length || 0}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                    <Grid item sx={{ paddingLeft: theme.spacing(1) }}>
                      <Button
                        disabled={selectionModel.length > 0 ? false : true}
                        variant="outlined"
                        onClick={handleMoveIteration}>
                        Move to Sprint..
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
                <WorkItems
                  backlog
                  customFieldMap={customFieldMap}
                  selectionModel={selectionModel}
                  states={states}
                  workItemsView={workItemsView}
                  setSelectionModel={setSelectionModel}
                />
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
      {moveIteration ? (
        <MoveIteration
          iterationsPicker={iterationsPicker}
          initialIteration={currentIterationPicker}
          handleCloseMoveIteration={handleCloseMoveIteration}
          handleMoveIterationConfirm={handleMoveIterationConfirm}
        />
      ) : (
        ""
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 1,
  };
};

export default Backlog;
