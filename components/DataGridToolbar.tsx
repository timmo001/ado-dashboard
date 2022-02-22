import { ReactElement } from "react";
import { Button, useTheme } from "@mui/material";
import {
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarColumnsButton,
} from "@mui/x-data-grid";
import Icon from "@mdi/react";
import { mdiUndoVariant } from "@mdi/js";

interface DataGridToolbarProps {
  onResetFilter: () => void;
}

function DataGridToolbar({
  onResetFilter,
}: DataGridToolbarProps): ReactElement {
  const theme = useTheme();

  return (
    <GridToolbarContainer style={{ padding: theme.spacing(0.5, 1) }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <Button color="primary" size="medium" onClick={onResetFilter}>
        <Icon
          path={mdiUndoVariant}
          size={0.8}
          style={{ marginRight: theme.spacing(0.5) }}
        />
        Reset
      </Button>
    </GridToolbarContainer>
  );
}

export default DataGridToolbar;
