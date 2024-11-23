import React, { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import * as XLSX from "xlsx"; // For saving data to Excel

function AttemptSurvey() {
  const { surveyTitle } = useParams();
  const location = useLocation();
  const survey = location.state?.survey || {};

  const [responses, setResponses] = useState(
    survey.questions ? survey.questions.map((q) => ({ id: q.id, response: "" })) : []
  );

  const handleResponseChange = (id, value) => {
    const updatedResponses = responses.map((r) =>
      r.id === id ? { ...r, response: value } : r
    );
    setResponses(updatedResponses);
  };

  const handleSubmit = () => {
    // Check if all mandatory questions are answered
    const allMandatoryAnswered = survey.questions.every(
      (q) => !q.mandatory || responses.some((r) => r.id === q.id && r.response)
    );

    if (!allMandatoryAnswered) {
      alert("Please answer all mandatory questions.");
      return;
    }

    // Prepare the data for Excel
    const headers = survey.questions.map((q) => q.questionText);
    const data = [headers];

    const responseRow = responses.map((r) => r.response);
    data.push(responseRow);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, "survey_responses.xlsx");

    alert("Survey responses saved to Excel!");
  };

  return (
    <div className="AttemptSurvey">
      <h2>{surveyTitle}</h2>
      {survey.questions &&
        survey.questions.map((question, index) => (
          <div key={question.id} className="question">
            <h4>
              {index + 1}. {question.questionText}
              {question.mandatory && <span style={{ color: "red" }}>*</span>}
            </h4>
            {question.type === "mcq" || question.type === "multi-select" ? (
              question.options.map((option, i) => (
                <div key={i}>
                  <input
                    type={question.type === "multi-select" ? "checkbox" : "radio"}
                    name={question.id}
                    value={option}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  />
                  {option}
                </div>
              ))
            ) : (
              <textarea
                value={responses.find((r) => r.id === question.id)?.response || ""}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                rows="4"
                style={{ width: "100%" }}
              />
            )}
          </div>
        ))}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default AttemptSurvey;
