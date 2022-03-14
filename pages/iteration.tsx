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
  Autocomplete,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { GridRowId, GridSelectionModel } from "@mui/x-data-grid";
// eslint-disable-next-line import/no-named-as-default
import Icon from "@mdi/react";
import moment from "moment";

import { AzureDevOps } from "lib/azureDevOps";
import { groupByKey } from "lib/util";
import {
  Iteration,
  ProcessWorkItemTypeExtended,
  State,
  WorkItemExpanded,
} from "lib/types/azureDevOps";
import { Picker } from "lib/types/general";
import { XLSXExport } from "lib/xlsxExport";
import Layout from "components/Layout";
import MoveIteration from "components/MoveIteration";
import useStyles from "assets/jss/components/layout";
import WorkItems, { stateIconMap, WorkItemsView } from "components/WorkItems";

let azureDevOps: AzureDevOps;
function Iteration(): ReactElement {
  const [alert, setAlert] = useState<string>();
  const [currentIteration, setCurrentIteration] = useState<Iteration>();
  const [iterations, setIterations] = useState<Array<Iteration>>();
  const [moveIteration, setMoveIteration] = useState<boolean>(false);
  const [selectionModel, setSelectionModel] = useState<GridSelectionModel>([]);
  const [states, setStates] = useState<Array<State>>();
  const [workItems, setWorkItems] = useState<Array<WorkItemExpanded>>();

  const router = useRouter();
  const { personalAccessToken, organization, project, iteration } =
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
    console.log("Get data:", { organization, project });
    const it = iteration && iteration !== "" ? iteration : "current";
    console.log("Iteration:", it);
    azureDevOps = new AzureDevOps(personalAccessToken, organization, project);
    azureDevOps.getIterations().then((result: Array<Iteration>) => {
      setIterations(result);
      const foundIteration = result.find((i: Iteration) =>
        it === "current" ? i.attributes.timeFrame === "current" : i.id === it
      );
      if (!foundIteration) {
        setAlert(`Could not find iteration: ${it}`);
        return;
      }
      setCurrentIteration(foundIteration);
      azureDevOps
        .getIterationWorkItemIds(foundIteration.id)
        .then((ids: Array<number>) =>
          azureDevOps
            .getWorkItems(ids)
            .then((result: Array<WorkItemExpanded>) => setWorkItems(result))
        );
    });

    azureDevOps
      .getStatesFromProject()
      .then(
        (result: {
          states: Array<State>;
          processWorkItemTypes: Array<ProcessWorkItemTypeExtended>;
        }) => {
          setStates(result.states);
        }
      );
  }, [organization, project, personalAccessToken, iteration]);

  useEffect(() => {
    setup();
  }, [organization, project, personalAccessToken, iteration]);

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

  const currentWorkItems = useMemo<Array<WorkItemExpanded>>(() => {
    if (!currentIteration || !workItems) return undefined;
    return workItems.filter(
      (wi: WorkItemExpanded) => wi.iteration === currentIteration.name
    );
  }, [currentIteration, workItems]);

  const currentWorkItemsView = useMemo<Array<WorkItemsView>>(() => {
    if (!currentWorkItems) return undefined;
    return currentWorkItems.map((wi: WorkItemExpanded) => ({
      id: wi.id,
      order: wi.order,
      title: wi["System.Title"],
      url: `https://dev.azure.com/${organization}/${project}/_workitems/edit/${wi.id}`,
      type: wi["System.WorkItemType"],
      iteration: wi.iteration,
      state: wi["System.State"],
      assignedTo: wi["System.AssignedTo"]?.displayName,
      storyPoints: wi["Microsoft.VSTS.Scheduling.StoryPoints"],
      tags: wi["System.Tags"],
      areaPath: wi["System.AreaPath"],
      components: wi["Custom.Components"],
      functions: wi["Custom.Functions"],
      exportList: wi["Custom.ExportList"],
      tables: wi["Custom.Tables"],
      fields: wi["Custom.Fields"],
      scripts: wi["Custom.Scripts"],
      files: wi["Custom.Fields"],
      misc: wi["Custom.Misc"],
      releaseDetails: wi["Custom.ReleaseDetails"],
    }));
  }, [currentWorkItems]);

  const itemsByState = useMemo<{
    [state: string]: Array<WorkItemExpanded>;
  }>(() => {
    if (!currentWorkItems) return undefined;
    return groupByKey<WorkItemExpanded>(currentWorkItems, "System.State");
  }, [currentWorkItems]);

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

  function handleGenerateChecklist(): void {
    new XLSXExport().generateReleaseChecklist(currentWorkItems);
  }

  const classes = useStyles();
  const theme = useTheme();

  return (
    <>
      <Layout
        classes={classes}
        title={currentIteration?.name || "Iteration"}
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
            <Grid
              container
              direction="row"
              alignContent="space-between"
              justifyContent="space-between">
              <Grid item xs={8}>
                <Typography
                  component="h3"
                  variant="h4"
                  sx={{
                    padding: theme.spacing(1.8, 0, 1, 0),
                  }}>
                  {currentIteration?.name || "Iteration"}
                </Typography>
              </Grid>
              {iterationsPicker && currentIterationPicker ? (
                <>
                  <Grid
                    item
                    xs={4}
                    sx={{
                      padding: theme.spacing(1, 0),
                    }}>
                    <Autocomplete
                      disablePortal
                      disableClearable
                      id="iteration"
                      options={iterationsPicker}
                      value={currentIterationPicker}
                      onChange={(_event, newValue: Picker) => {
                        router.push({
                          pathname: router.pathname,
                          query: {
                            ...router.query,
                            iteration: newValue.id,
                          },
                        });
                      }}
                      renderInput={(params): JSX.Element => (
                        <TextField {...params} label="Iteration" />
                      )}
                    />
                  </Grid>
                </>
              ) : (
                ""
              )}
            </Grid>
            {currentWorkItemsView && states ? (
              <>
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
                    justifyContent="space-around"
                    sx={{ padding: theme.spacing(0, 1) }}>
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
                          {state.name}: {itemsByState[state.name]?.length || 0}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                  <Grid item sx={{ paddingLeft: theme.spacing(1) }}>
                    <Button
                      variant="outlined"
                      onClick={handleGenerateChecklist}>
                      Generate Release Checklist..
                    </Button>
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
                <Grid
                  item
                  xs={12}
                  sx={{
                    padding: theme.spacing(1, 0),
                  }}>
                  <WorkItems
                    selectionModel={selectionModel}
                    states={states}
                    workItemsView={currentWorkItemsView}
                    setSelectionModel={setSelectionModel}
                  />
                </Grid>
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

export default Iteration;
