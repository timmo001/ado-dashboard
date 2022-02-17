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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Link,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridColumnVisibilityModel,
  GridInitialState,
  GridRenderCellParams,
  GridRowId,
  GridSelectionModel,
} from "@mui/x-data-grid";
import moment from "moment";

import { AzureDevOps } from "lib/azureDevOps";
import { Iteration, WorkItemExpanded } from "lib/types/azureDevOps";
import Layout from "components/Layout";
import useStyles from "assets/jss/components/layout";

interface Picker {
  id: string;
  label: string;
}

interface WorkItemsView {
  id: number;
  order: number;
  title: string;
  url: string;
  state: string;
  assignedTo: string;
  storyPoints: number;
  tags: string;
}

const columns: Array<GridColDef> = [
  {
    field: "id",
    headerName: "ID",
    width: 60,
  },
  {
    field: "order",
    headerName: "Order",
    width: 90,
  },
  {
    field: "title",
    headerName: "Title",
    width: 840,
    renderCell: (params: GridRenderCellParams): ReactElement => (
      <Link href={params.row["url"]} target="_blank" underline="none">
        {params.value}
      </Link>
    ),
  },
  {
    field: "url",
  },
  {
    field: "state",
    headerName: "State",
    width: 140,
  },
  {
    field: "assignedTo",
    headerName: "Assigned To",
    width: 140,
  },
  {
    field: "storyPoints",
    headerName: "Story Points",
    width: 110,
  },
  {
    field: "tags",
    headerName: "Tags",
    width: 180,
  },
];

const columnVisibilityModel: GridColumnVisibilityModel = {
  url: false,
};

const initialState: GridInitialState = {
  sorting: {
    sortModel: [
      {
        field: "order",
        sort: "asc",
      },
    ],
  },
};

let azureDevOps: AzureDevOps;
function Iteration(): ReactElement {
  const [alert, setAlert] = useState<string>();
  const [currentIteration, setCurrentIteration] = useState<Iteration>();
  const [iterations, setIterations] = useState<Array<Iteration>>();
  const [newIteration, setNewIteration] = useState<Picker>();
  const [selectionModel, setSelectionModel] =
    React.useState<GridSelectionModel>([]);
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
    console.log("Get data:", organization, project);
    const it = iteration && iteration !== "" ? iteration : "current";
    console.log("Iteration:", it);
    azureDevOps = new AzureDevOps(organization, project, personalAccessToken);
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
      label: `${i.id === ci.id ? `(Current) ` : ""}${i.name} (${moment(
        i.attributes.startDate
      ).format("DD/MM/YYYY")} - ${moment(i.attributes.finishDate).format(
        "DD/MM/YYYY"
      )})`,
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
      state: wi["System.State"],
      assignedTo: wi["System.AssignedTo"]?.displayName,
      storyPoints: wi["Microsoft.VSTS.Scheduling.StoryPoints"],
      tags: wi["System.Tags"],
    }));
  }, [currentWorkItems]);

  function handleMoveIteration(): void {
    console.log("handleMoveIteration:", selectionModel);
    setNewIteration(
      iterationsPicker.find((it: Picker) => it.id === currentIteration.id)
    );
  }

  function handleCloseMoveIteration(): void {
    setNewIteration(null);
  }

  function handleMoveIterationConfirm(): void {
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
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

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
            <Grid
              container
              direction="row"
              alignContent="space-between"
              justifyContent="space-between">
              <Grid
                item
                xs={8}
                sx={{
                  padding: theme.spacing(1, 2, 1, 2),
                }}>
                <Typography component="h3" gutterBottom variant="h4">
                  {currentIteration?.name || "Iteration"}
                </Typography>
              </Grid>
              {iterationsPicker && currentIterationPicker ? (
                <>
                  <Grid
                    item
                    xs={4}
                    sx={{
                      padding: theme.spacing(1, 2, 1, 2),
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
            {currentWorkItemsView ? (
              <>
                <Grid
                  container
                  item
                  xs={12}
                  sx={{
                    padding: theme.spacing(1, 2, 1, 2),
                  }}
                  justifyContent="flex-end">
                  <Grid item>
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
                    padding: theme.spacing(1, 2, 1, 2),
                  }}>
                  <DataGrid
                    autoHeight
                    checkboxSelection
                    columns={columns}
                    columnVisibilityModel={columnVisibilityModel}
                    initialState={initialState}
                    pageSize={100}
                    rows={currentWorkItemsView}
                    rowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
                    selectionModel={selectionModel}
                    onSelectionModelChange={(
                      newSelectionModel: GridSelectionModel
                    ): void => setSelectionModel(newSelectionModel)}
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
      <Dialog
        fullScreen={fullScreen}
        fullWidth
        maxWidth="sm"
        scroll="body"
        open={newIteration ? true : false}
        onClose={handleCloseMoveIteration}>
        <DialogTitle>Move iteration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select an iteration to move these items to.
          </DialogContentText>
          <Autocomplete
            disableClearable
            id="new-iteration"
            options={iterationsPicker}
            value={newIteration}
            onChange={(_event, newValue: Picker) => {
              setNewIteration(
                iterationsPicker.find((it: Picker) => it.id === newValue.id)
              );
            }}
            renderInput={(params): JSX.Element => (
              <TextField {...params} label="New Iteration" />
            )}
            sx={{
              margin: theme.spacing(3, 0.5, 0),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMoveIteration}>Cancel</Button>
          <Button onClick={handleMoveIterationConfirm}>Move</Button>
        </DialogActions>
      </Dialog>
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
