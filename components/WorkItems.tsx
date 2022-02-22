import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/router";
import { Chip, CircularProgress, Grid, Link, useTheme } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridColumnVisibilityModel,
  GridFilterModel,
  GridInitialState,
  GridRenderCellParams,
  GridSelectionModel,
  GridSortModel,
} from "@mui/x-data-grid";

import { State } from "lib/types/azureDevOps";
import DataGridToolbar from "./DataGridToolbar";

export interface WorkItemsView {
  id: number;
  order: number;
  title: string;
  url: string;
  state: string;
  iteration?: string;
  assignedTo: string;
  storyPoints: number;
  type: string;
  tags: string;
  components: string;
  functions: string;
  exportList: string;
  tables: string;
  fields: string;
  scripts: string;
  files: string;
  misc: string;
  releaseDetails: string;
}

interface WorkItemsProps {
  backlog?: boolean;
  selectionModel: GridSelectionModel;
  setSelectionModel: Dispatch<SetStateAction<GridSelectionModel>>;
  states: Array<State>;
  workItemsView: Array<WorkItemsView>;
}

function WorkItems({
  backlog,
  selectionModel,
  setSelectionModel,
  states,
  workItemsView,
}: WorkItemsProps): ReactElement {
  const [pageSize, setPageSize] = useState<number>(50);

  const router = useRouter();
  const { columnsVisible, filter, sort } = router.query as NodeJS.Dict<string>;

  const initialState = useMemo<GridInitialState>(() => {
    const columnVisibilityModel: GridColumnVisibilityModel =
      columnsVisible && columnsVisible !== ""
        ? JSON.parse(columnsVisible)
        : {
            url: false,
            iteration: backlog ? true : false,
            components: false,
            functions: false,
            exportList: false,
            tables: false,
            fields: false,
            scripts: false,
            files: false,
            misc: false,
            releaseDetails: false,
          };
    const filterModel: GridFilterModel =
      filter && filter !== "" ? JSON.parse(filter) : undefined;
    const sortModel: GridSortModel =
      sort && sort !== ""
        ? JSON.parse(sort)
        : [
            {
              field: "order",
              sort: "asc",
            },
          ];
    return {
      columns: {
        columnVisibilityModel: columnVisibilityModel,
      },
      sorting: {
        sortModel: sortModel,
      },
      filter: {
        filterModel: filterModel,
      },
    };
  }, [columnsVisible, filter, sort]);

  const columns = useMemo<Array<GridColDef>>(() => {
    if (!states) return undefined;
    return [
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
        headerName: "URL",
        width: 400,
      },
      {
        field: "iteration",
        headerName: "Iteration",
        width: 140,
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
        field: "type",
        headerName: "Type",
        width: 120,
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
      {
        field: "components",
        headerName: "Components",
        width: 320,
      },
      {
        field: "functions",
        headerName: "Functions",
        width: 320,
      },
      {
        field: "exportList",
        headerName: "Export List",
        width: 240,
      },
      {
        field: "tables",
        headerName: "Tables",
        width: 320,
      },
      {
        field: "fields",
        headerName: "Fields",
        width: 320,
      },
      {
        field: "scripts",
        headerName: "Scripts",
        width: 320,
      },
      {
        field: "files",
        headerName: "Files",
        width: 320,
      },
      {
        field: "misc",
        headerName: "Misc",
        width: 320,
      },
      {
        field: "releaseDetails",
        headerName: "Release Details",
        width: 400,
      },
    ];
  }, [backlog, states]);

  const theme = useTheme();

  return (
    <>
      {columns && initialState ? (
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
            components={{ Toolbar: DataGridToolbar }}
            componentsProps={{
              toolbar: {
                onResetFilter: () => {
                  router.push({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      columnsVisible: undefined,
                      sort: undefined,
                      filter: undefined,
                    },
                  });
                  router.reload();
                },
              },
            }}
            initialState={initialState}
            pageSize={pageSize}
            rows={workItemsView}
            rowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
            selectionModel={selectionModel}
            onColumnVisibilityModelChange={(
              newColumnVisibilityModel: GridColumnVisibilityModel
            ) => {
              router.push({
                pathname: router.pathname,
                query: {
                  ...router.query,
                  columnsVisible: JSON.stringify(newColumnVisibilityModel),
                },
              });
            }}
            onPageSizeChange={(newSize: number) => setPageSize(newSize)}
            onSelectionModelChange={(
              newSelectionModel: GridSelectionModel
            ): void => setSelectionModel(newSelectionModel)}
            onSortModelChange={(newSortModel: GridSortModel) => {
              router.push({
                pathname: router.pathname,
                query: {
                  ...router.query,
                  sort: JSON.stringify(newSortModel),
                },
              });
            }}
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
      ) : (
        <Grid
          container
          alignContent="space-around"
          justifyContent="space-around">
          <CircularProgress color="primary" />
        </Grid>
      )}
    </>
  );
}

export default WorkItems;
