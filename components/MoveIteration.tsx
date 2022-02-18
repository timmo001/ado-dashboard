import { ReactElement, useState } from "react";
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { Picker } from "pages/iteration";

interface MoveIterationProps {
  iterationsPicker: Array<Picker>;
  initialIteration: Picker;
  handleCloseMoveIteration: () => void;
  handleMoveIterationConfirm: (newIteration: Picker) => void;
}

function MoveIteration({
  iterationsPicker,
  initialIteration,
  handleCloseMoveIteration,
  handleMoveIterationConfirm,
}: MoveIterationProps): ReactElement {
  const [newIteration, setNewIteration] = useState<Picker>(initialIteration);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
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
        <Button
          onClick={() => {
            handleMoveIterationConfirm(newIteration);
          }}>
          Move
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MoveIteration;
