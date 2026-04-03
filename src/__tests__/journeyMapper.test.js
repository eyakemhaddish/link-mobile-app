import { formatVisitForDisplay } from "../utils/journeyMapper";

describe("journeyMapper", () => {
  it("uses journey_timeline as source of truth for current stage", () => {
    const visit = {
      id: "visit-1",
      status: "registered",
      provider: "User",
      journey_timeline: [
        {
          stage: "registered",
          timestamp: "2026-04-02T12:52:23.554755Z",
        },
        {
          stage: "at_triage",
          timestamp: "2026-04-02T13:05:00.000Z",
        },
      ],
    };

    const formatted = formatVisitForDisplay(visit);
    const registrationStep = formatted.journeySteps.find(
      (step) => step.stage === "registered",
    );
    const triageStep = formatted.journeySteps.find(
      (step) => step.stage === "at_triage",
    );

    expect(formatted.currentStageRaw).toBe("at_triage");
    expect(registrationStep?.status).toBe("completed");
    expect(triageStep?.status).toBe("active");
    expect(triageStep?.time).not.toBe("--");
    expect(triageStep?.time).not.toBe("In Progress");
  });

  it("supports timeline entries that use arrived_at/completed_at", () => {
    const visit = {
      id: "visit-2",
      status: "at_lab",
      journey_timeline: [
        {
          stage: "with_doctor",
          arrived_at: "2026-04-02T14:00:00.000Z",
          completed_at: "2026-04-02T14:20:00.000Z",
        },
        {
          stage: "at_lab",
          arrived_at: "2026-04-02T14:30:00.000Z",
          completed_at: null,
        },
      ],
    };

    const formatted = formatVisitForDisplay(visit);
    const doctorStep = formatted.journeySteps.find(
      (step) => step.stage === "with_doctor",
    );
    const labStep = formatted.journeySteps.find(
      (step) => step.stage === "at_lab",
    );

    expect(formatted.currentStageRaw).toBe("at_lab");
    expect(doctorStep?.time).not.toBe("--");
    expect(labStep?.status).toBe("active");
    expect(labStep?.time).not.toBe("--");
  });
});
