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
  Chip,
  CircularProgress,
  Grid,
  Link,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridColumnVisibilityModel,
  GridFilterModel,
  GridInitialState,
  GridRenderCellParams,
  GridRowId,
  GridSelectionModel,
} from "@mui/x-data-grid";
import moment from "moment";

import { AzureDevOps } from "lib/azureDevOps";
import { groupByKey } from "lib/util";
import { Iteration, State, WorkItemExpanded } from "lib/types/azureDevOps";
import DataGridToolbar from "components/DataGridToolbar";
import Layout from "components/Layout";
import MoveIteration from "components/MoveIteration";
import useStyles from "assets/jss/components/layout";

export interface Picker {
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

const columnVisibilityModel: GridColumnVisibilityModel = {
  url: false,
};

let azureDevOps: AzureDevOps;
function Iteration(): ReactElement {
  const [alert, setAlert] = useState<string>();
  const [currentIteration, setCurrentIteration] = useState<Iteration>();
  const [iterations, setIterations] = useState<Array<Iteration>>();
  const [moveIteration, setMoveIteration] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(50);
  const [selectionModel, setSelectionModel] = useState<GridSelectionModel>([]);
  const [states, setStates] = useState<Array<State>>();
  const [workItems, setWorkItems] = useState<Array<WorkItemExpanded>>();

  const router = useRouter();
  const { personalAccessToken, organization, project, iteration, filter } =
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
    azureDevOps.getStates().then((result: Array<State>) => setStates(result));
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
      label: `${i.id === ci.id ? `(Current) ` : ""}${i.name}${
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
      state: wi["System.State"],
      assignedTo: wi["System.AssignedTo"]?.displayName,
      storyPoints: wi["Microsoft.VSTS.Scheduling.StoryPoints"],
      tags: wi["System.Tags"],
    }));
  }, [currentWorkItems]);

  const itemsByState = useMemo<{
    [state: string]: Array<WorkItemExpanded>;
  }>(() => {
    if (!currentWorkItems) return undefined;
    return groupByKey<WorkItemExpanded>(currentWorkItems, "System.State");
  }, [currentWorkItems]);

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
      width: 870,
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
      sortComparator: (v1: string, v2: string): number =>
        states.find((state: State) => state.name === v1)?.order >
        states.find((state: State) => state.name === v2)?.order
          ? 1
          : -1,
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
      width: 280,
      renderCell: (params: GridRenderCellParams): ReactElement => (
        <>
          {params.value
            ? params.value
                .split(";")
                .map((tag: string) => <Chip key={tag} label={tag} />)
            : ""}
        </>
      ),
    },
  ];

  const initialState = useMemo<GridInitialState>(() => {
    const filterModel: Array<GridFilterModel> =
      filter && filter !== "" ? JSON.parse(filter) : undefined;
    console.log("Filter model:", filterModel);
    return {
      sorting: {
        sortModel: [
          {
            field: "order",
            sort: "asc",
          },
        ],
      },
      filter: {
        filterModel: filterModel,
      },
    };
  }, [filter]);

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
            {currentWorkItemsView && states && initialState ? (
              <>
                <Grid
                  container
                  item
                  xs={12}
                  sx={{
                    padding: theme.spacing(1, 0),
                  }}
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
                        <Typography component="span" variant="body1">
                          {state.name}: {itemsByState[state.name]?.length || 0}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                  <Grid
                    item
                    xs={3}
                    container
                    direction="row"
                    alignContent="space-around"
                    justifyContent="flex-end">
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
                  <DataGrid
                    autoHeight
                    checkboxSelection
                    columns={columns}
                    columnVisibilityModel={columnVisibilityModel}
                    components={{ Toolbar: DataGridToolbar }}
                    initialState={initialState}
                    pageSize={pageSize}
                    rows={currentWorkItemsView}
                    rowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
                    selectionModel={selectionModel}
                    onPageSizeChange={(newSize: number) => setPageSize(newSize)}
                    onSelectionModelChange={(
                      newSelectionModel: GridSelectionModel
                    ): void => setSelectionModel(newSelectionModel)}
                    onFilterModelChange={(newFilterModel: GridFilterModel) => {
                      router.push({
                        pathname: router.pathname,
                        query: {
                          ...router.query,
                          filter: JSON.stringify(newFilterModel),
                        },
                      });
                    }}
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
