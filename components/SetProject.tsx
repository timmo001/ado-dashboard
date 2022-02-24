import { ChangeEvent, ReactElement, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
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

import { AzureDevOps } from "lib/azureDevOps";
import { AreaPath, Project } from "lib/types/azureDevOps";

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
  const [areaPaths, setAreaPaths] = useState<Array<AreaPath>>();
  const [currentStep, setCurrentStep] = useState<Step>(steps[0]);
  const [newQuery, setNewQuery] = useState<NodeJS.Dict<string>>();
  const [projects, setProjects] = useState<Array<Project>>();

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

  useEffect(() => {
    if (!newQuery || !newQuery.personalAccessToken || !newQuery.organization)
      return;
    const azureDevOps = new AzureDevOps(
      newQuery.personalAccessToken,
      newQuery.organization
    );
    azureDevOps.getProjects().then((result: Array<Project>) => {
      setProjects(result);
    });
  }, [newQuery]);

  useEffect(() => {
    if (
      !newQuery ||
      !newQuery.personalAccessToken ||
      !newQuery.organization ||
      !newQuery.project
    )
      return;
    const azureDevOps = new AzureDevOps(
      newQuery.personalAccessToken,
      newQuery.organization,
      newQuery.project
    );
    azureDevOps.getAreaPaths().then((result: Array<AreaPath>) => {
      setAreaPaths(result);
    });
  }, [newQuery]);

  const currentStepIndex = useMemo<number>(
    () => steps.findIndex((step: Step) => step.value === currentStep.value),
    [currentStep]
  );

  const projectsPicker = useMemo<Array<string>>(() => {
    if (!projects) return undefined;
    return projects.map((project: Project) => project.name);
  }, [projects]);

  const areaPathPicker = useMemo<Array<string>>(() => {
    if (!areaPaths) return undefined;
    return areaPaths.map((areaPath: AreaPath) => areaPath.path);
  }, [areaPaths]);

  function handleCloseSetProject(): void {
    setTimeout(() => router.reload(), 500);
  }

  function handleConfirmSetProject(): void {
    const nq = {};
    Object.assign(nq, newQuery);
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
                {currentStep.label === "Project" && projectsPicker ? (
                  <Autocomplete
                    disableClearable
                    fullWidth
                    options={projectsPicker}
                    value={newQuery[currentStep.value]}
                    onChange={(_event, newValue: string) => {
                      setNewQuery({
                        ...newQuery,
                        [currentStep.value]: newValue,
                      });
                    }}
                    renderInput={(params): JSX.Element => (
                      <TextField {...params} label={currentStep.label} />
                    )}
                  />
                ) : currentStep.label === "Area Path" && areaPathPicker ? (
                  <Autocomplete
                    disableClearable
                    fullWidth
                    options={areaPathPicker}
                    value={newQuery[currentStep.value]}
                    onChange={(_event, newValue: string) => {
                      setNewQuery({
                        ...newQuery,
                        [currentStep.value]: newValue,
                      });
                    }}
                    renderInput={(params): JSX.Element => (
                      <TextField {...params} label={currentStep.label} />
                    )}
                  />
                ) : (
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
                )}
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
