import React from "react";
import { useParams } from "react-router-dom";

export default function JobDetail() {
  const { jobId } = useParams();
  return (
    <div>
      <h2>Job {jobId}</h2>
      <p>Full job detail / candidates for this job — to be implemented as needed.</p>
    </div>
  );
}
