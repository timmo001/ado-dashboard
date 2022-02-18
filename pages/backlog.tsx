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
  Chip,
  CircularProgress,
  Grid,
  Link,
  Typography,
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
import { Iteration as Backlog, WorkItemExpanded } from "lib/types/azureDevOps";
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
  iteration: string;
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
  },
  {
    field: "iteration",
    headerName: "Iteration",
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
function Backlog(): ReactElement {
  const [alert, setAlert] = useState<string>();
  const [iterations, setIterations] = useState<Array<Backlog>>();
  const [moveIteration, setMoveIteration] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(50);
  const [selectionModel, setSelectionModel] =
    React.useState<GridSelectionModel>([]);
  const [workItems, setWorkItems] = useState<Array<WorkItemExpanded>>();

  const router = useRouter();
  const { personalAccessToken, organization, project, query } =
    router.query as NodeJS.Dict<string>;

  const setup = useCallback(() => {
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
    azureDevOps = new AzureDevOps(organization, project, personalAccessToken);
    azureDevOps.getIterations().then((result: Array<Backlog>) => {
      setIterations(result);
    });
    azureDevOps
      .getWorkItemIds(query)
      .then((ids: Array<number>) =>
        azureDevOps
          .getWorkItems(ids)
          .then((result: Array<WorkItemExpanded>) => setWorkItems(result))
      );
  }, [organization, project, personalAccessToken]);

  useEffect(() => {
    setup();
  }, [organization, project, personalAccessToken]);

  const currentIteration = useMemo<Backlog>(() => {
    if (!iterations) return undefined;
    return iterations.find(
      (iteration: Backlog) => iteration.attributes.timeFrame === "current"
    );
  }, [iterations]);

  const iterationsPicker = useMemo<Array<Picker>>(() => {
    if (!iterations) return undefined;
    const ci = iterations.find(
      (i: Backlog) => i.attributes.timeFrame === "current"
    );
    return iterations.map((i: Backlog) => ({
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

  const workItemsView = useMemo<Array<WorkItemsView>>(() => {
    if (!workItems) return undefined;
    return workItems.map((wi: WorkItemExpanded) => ({
      id: wi.id,
      order: wi["Microsoft.VSTS.Common.StackRank"],
      title: wi["System.Title"],
      url: `https://dev.azure.com/${organization}/${project}/_workitems/edit/${wi.id}`,
      state: wi["System.State"],
      iteration: wi.iteration,
      assignedTo: wi["System.AssignedTo"]?.displayName,
      storyPoints: wi["Microsoft.VSTS.Scheduling.StoryPoints"],
      tags: wi["System.Tags"],
    }));
  }, [workItems]);

  function handleMoveIteration(): void {
    console.log("handleMoveIteration:", selectionModel);
    setMoveIteration(true);
  }

  function handleCloseMoveIteration(): void {
    setMoveIteration(false);
  }

  function handleMoveIterationConfirm(newIteration: Picker): void {
    const it = iterations.find((it: Backlog) => it.id === newIteration.id);
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
            <Grid
              container
              direction="row"
              alignContent="space-between"
              justifyContent="space-between">
              <Grid
                item
                xs={8}
                sx={{
                  padding: theme.spacing(1, 0),
                }}>
                <Typography component="h3" gutterBottom variant="h4">
                  Backlog
                </Typography>
              </Grid>
            </Grid>
            {workItemsView ? (
              <>
                <Grid
                  container
                  item
                  xs={12}
                  sx={{
                    padding: theme.spacing(1, 0),
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
                    rows={workItemsView}
                    rowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
                    selectionModel={selectionModel}
                    onPageSizeChange={(newSize: number) => setPageSize(newSize)}
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
