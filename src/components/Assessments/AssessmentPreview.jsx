import React from "react";
import AssessmentForm from "./AssessmentForm";

export default function AssessmentPreview({ metadata, jobId }) {
  if (!metadata) return <div className="small">No assessment yet</div>;
  return (
    <div>
      <AssessmentForm metadata={metadata} readOnly={false} jobId={jobId} />
    </div>
  );
}
