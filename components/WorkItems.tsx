import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/router";
import { Chip, CircularProgress, Grid, Link, useTheme } from "@mui/material";
import { blue, red, indigo, orange, yellow, cyan } from "@mui/material/colors";
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
import {
  mdiBook,
  mdiBookLockOutline,
  mdiBookOpenPageVariantOutline,
  mdiBookVariantMultiple,
  mdiBug,
  mdiCheckAll,
  mdiCheckboxMarked,
  mdiCheckCircle,
  mdiCheckOutline,
  mdiClipboardList,
  mdiFlask,
  mdiFlaskRoundBottom,
  mdiMessage,
  mdiMessageDraw,
  mdiNewspaperVariantOutline,
  mdiProgressClock,
  mdiProgressPencil,
  mdiSignCaution,
  mdiTestTube,
} from "@mdi/js";
// eslint-disable-next-line import/no-named-as-default
import Icon from "@mdi/react";

import { State } from "lib/types/azureDevOps";
import DataGridToolbar from "components/DataGridToolbar";

export interface CustomFieldMap {
  [field: string]: {
    key: string;
    title: string;
  };
}

export interface WorkItemsView {
  id: number;
  order: number;
  title: string;
  url: string;
  type: string;
  iteration?: string;
  state: string;
  assignedTo: string;
  storyPoints: number;
  tags: string;
  areaPath: string;
  blocked: string;
  [custom: string]: boolean | number | string;
}

interface WorkItemsProps {
  backlog?: boolean;
  customFieldMap: CustomFieldMap;
  selectionModel: GridSelectionModel;
  states: Array<State>;
  workItemsView: Array<WorkItemsView>;
  setSelectionModel: Dispatch<SetStateAction<GridSelectionModel>>;
}

export interface TypeMap {
  [type: string]: {
    color: string;
    icon: string;
  };
}

export interface StateIconMap {
  [state: string]: string;
}

export interface StateColorMap {
  [state: string]: string;
}

export const typeMap: TypeMap = {
  Bug: { color: red[400], icon: mdiBug },
  "Enabler Story": { color: cyan[400], icon: mdiBookOpenPageVariantOutline },
  Epic: { color: orange[400], icon: mdiBookVariantMultiple },
  Feature: { color: indigo[400], icon: mdiBookVariantMultiple },
  Task: { color: yellow[400], icon: mdiClipboardList },
  "Test Case": { color: indigo[400], icon: mdiFlask },
  "User Story": { color: blue[400], icon: mdiBook },
};

export const stateIconMap: StateIconMap = {
  Active: mdiProgressPencil,
  Closed: mdiBookLockOutline,
  Done: mdiCheckOutline,
  "On Hold": mdiSignCaution,
  "In Code Review": mdiMessageDraw,
  "In Development": mdiProgressPencil,
  "In Review": mdiMessage,
  "In Test": mdiTestTube,
  "In UAT": mdiFlaskRoundBottom,
  New: mdiNewspaperVariantOutline,
  Ready: mdiProgressClock,
  "Ready for Release": mdiCheckCircle,
  Released: mdiCheckAll,
  Resolved: mdiCheckboxMarked,
};

function WorkItems({
  backlog,
  customFieldMap,
  selectionModel,
  states,
  workItemsView,
  setSelectionModel,
}: WorkItemsProps): ReactElement {
  const [pageSize, setPageSize] = useState<number>(50);

  const router = useRouter();
  const { columnsVisible, filter, sort } = router.query as NodeJS.Dict<string>;

  const initialState = useMemo<GridInitialState>(() => {
    const defaultVisibleColumns = {
      url: false,
      iteration: backlog ? true : false,
      areaPath: false,
    };
    for (const field of Object.values(customFieldMap))
      defaultVisibleColumns[field.key] = false;

    const columnVisibilityModel: GridColumnVisibilityModel =
      columnsVisible && columnsVisible !== ""
        ? JSON.parse(columnsVisible)
        : defaultVisibleColumns;
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

  const statesColorMap = useMemo<StateColorMap>(() => {
    if (!states) return undefined;
    const s = {};
    states.forEach((state: State) => {
      s[state.name] = `#${state.color}`;
    });
    return s;
  }, [states]);

  const columns = useMemo<Array<GridColDef>>(() => {
    if (!states || !statesColorMap) return undefined;
    const cols = [
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
        field: "type",
        headerName: "Type",
        width: 140,
        renderCell: (params: GridRenderCellParams): ReactElement => (
          <>
            {typeMap[params.value] ? (
              <Icon
                color={typeMap[params.value]?.color}
                path={typeMap[params.value]?.icon}
                size={1}
                style={{ marginRight: theme.spacing(0.25) }}
              />
            ) : (
              ""
            )}
            <span>{params.value}</span>
          </>
        ),
      },
      {
        field: "iteration",
        headerName: "Iteration",
        width: 220,
      },
      {
        field: "state",
        headerName: "State",
        width: 160,
        renderCell: (params: GridRenderCellParams): ReactElement => (
          <>
            {stateIconMap[params.value] ? (
              <Icon
                color={statesColorMap[params.value]}
                path={stateIconMap[params.value]}
                size={1}
                style={{ marginRight: theme.spacing(0.25) }}
              />
            ) : (
              ""
            )}
            <span style={{ color: statesColorMap[params.value] }}>
              {params.value}
            </span>
          </>
        ),
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
      {
        field: "areaPath",
        headerName: "Area Path",
        width: 320,
      },
      {
        field: "blocked",
        headerName: "Blocked",
        width: 100,
      },
    ];
    for (const field of Object.values(customFieldMap))
      cols.push({
        field: field.key,
        headerName: field.title,
        width: 400,
      });

    return cols;
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
                  const q = {};
                  Object.assign(q, router.query);
                  delete q["columnsVisible"];
                  delete q["sort"];
                  delete q["filter"];
                  router.push({
                    pathname: router.pathname,
                    query: q,
                  });
                  setTimeout(() => router.reload(), 500);
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
