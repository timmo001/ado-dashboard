import { ChangeEvent, ReactElement, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@mui/lab";

interface Step {
  label: string;
  value: string;
}

const steps: Array<Step> = [
  { label: "Personal Access Token", value: "personalAccessToken" },
  { label: "Organization", value: "organization" },
  { label: "Project", value: "project" },
  { label: "Area Path", value: "areaPath" },
];

function SetProject(): ReactElement {
  const [newQuery, setNewQuery] = useState<NodeJS.Dict<string>>();
  const [currentStep, setCurrentStep] = useState<Step>(steps[0]);

  const router = useRouter();

  useEffect(() => {
    const { personalAccessToken, organization, project, areaPath } =
      router.query as NodeJS.Dict<string>;
    setNewQuery({
      personalAccessToken: personalAccessToken || "",
      organization: organization || "",
      project: project || "",
      areaPath: areaPath || "",
    });
  }, [router.query]);

  const currentStepIndex = useMemo<number>(
    () => steps.findIndex((step: Step) => step.value === currentStep.value),
    [currentStep]
  );

  function handleCloseSetProject(): void {
    setTimeout(() => router.reload(), 500);
  }

  function handleConfirmSetProject(): void {
    const nq = Object.assign(newQuery);
    for (const qk of Object.keys(nq)) {
      if (!nq[qk] || nq[qk] === "") delete nq[qk];
    }
    router.push({
      pathname: router.pathname,
      query: nq,
    });
    handleCloseSetProject();
  }

  function handleGoToPreviousStep(): void {
    setCurrentStep(steps[currentStepIndex - 1]);
  }

  function handleGoToNextStep(): void {
    setCurrentStep(steps[currentStepIndex + 1]);
  }

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      open
      scroll="body"
      onClose={handleCloseSetProject}>
      <DialogTitle>Change Project</DialogTitle>
      {newQuery ? (
        <>
          <DialogContent>
            {/* <DialogContentText>Lorem ipsum.</DialogContentText> */}
            <Grid container direction="row">
              <Grid
                item
                xs={5}
                container
                alignContent="center"
                justifyContent="flex-end">
                <Timeline position="alternate">
                  {steps.map((step: Step, key: number) => (
                    <TimelineItem key={key}>
                      <TimelineSeparator>
                        <TimelineDot
                          color={
                            currentStep.value === step.value
                              ? "primary"
                              : "grey"
                          }
                        />
                        {key < steps.length - 1 ? <TimelineConnector /> : ""}
                      </TimelineSeparator>
                      <TimelineContent>{step.label}</TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Grid>
              <Grid
                item
                xs
                container
                alignContent="center"
                justifyContent="center">
                <TextField
                  fullWidth
                  margin="dense"
                  label={currentStep.label}
                  value={newQuery[currentStep.value]}
                  onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                    setNewQuery({
                      ...newQuery,
                      [currentStep.value]: event.target.value,
                    });
                  }}
                />
                {/* <Autocomplete
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
                /> */}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSetProject}>Cancel</Button>
            {currentStepIndex === steps.length - 1 ? (
              <>
                <Button onClick={handleGoToPreviousStep}>Previous</Button>
                <Button onClick={handleConfirmSetProject}>Confirm</Button>
              </>
            ) : (
              <>
                {currentStepIndex > 0 ? (
                  <Button onClick={handleGoToPreviousStep}>Previous</Button>
                ) : (
                  ""
                )}
                <Button onClick={handleGoToNextStep}>Next</Button>
              </>
            )}
          </DialogActions>
        </>
      ) : (
        <Grid
          container
          alignContent="space-around"
          justifyContent="space-around">
          <CircularProgress color="primary" />
        </Grid>
      )}
    </Dialog>
  );
}

export default SetProject;
