import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import * as XLSX from "xlsx"; // For saving data to Excel

function AttemptSurvey() {
  const { surveyTitle } = useParams();
  const location = useLocation();
  const survey = location.state?.survey || {};

  const [responses, setResponses] = useState(
    survey.questions ? survey.questions.map((q) => ({ id: q.id, response: q.type === "multi-select" ? [] : "" })) : []
  );

  const [timeTaken, setTimeTaken] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [mouseMovements, setMouseMovements] = useState([]);

  // Start the survey timer
  useEffect(() => {
    setStartTime(Date.now());
    const mouseTracker = (e) => {
      setMouseMovements((prev) => [
        ...prev,
        {
          x: e.clientX,
          y: e.clientY,
          elapsedTime: ((Date.now() - startTime) / 1000).toFixed(2),
        },
      ]);
    };
    window.addEventListener("mousemove", mouseTracker);
    return () => window.removeEventListener("mousemove", mouseTracker);
  }, [startTime]);

  const handleResponseChange = (id, value, isMultiSelect = false) => {
    const question = survey.questions.find((q) => q.id === id);
    if (!question) {
      console.error("Question not found");
      return;
    }

    const questionIndex = survey.questions.findIndex((q) => q.id === id);
    if (!timeTaken[questionIndex]) {
      const currentTime = Date.now();
      const timeDiff = currentTime - startTime;
      const updatedTime = [...timeTaken];
      updatedTime[questionIndex] = { question: id, timeTaken: timeDiff, startTime: currentTime };
      setTimeTaken(updatedTime);
    }

    const updatedResponses = responses.map((r) => {
      if (r.id === id) {
        if (isMultiSelect) {
          const currentResponses = r.response;
          const updatedResponse = currentResponses.includes(value)
            ? currentResponses.filter((res) => res !== value)
            : [...currentResponses, value];
          return { ...r, response: updatedResponse };
        } else {
          return { ...r, response: value };
        }
      }
      return r;
    });

    setResponses(updatedResponses);
  };

  const validateResponses = () => {
    const missingMandatory = survey.questions.filter(
      (q) => q.mandatory && (q.type === "multi-select" ? !responses.find((r) => r.id === q.id)?.response.length : !responses.find((r) => r.id === q.id)?.response)
    );
    return missingMandatory;
  };

  const handleSubmit = () => {
    const missingMandatory = validateResponses();
    if (missingMandatory.length > 0) {
      alert("Please answer all mandatory questions before submitting.");
      return;
    }

    const headers = survey.questions.map((q) => q.questionText);
    const responseRow = responses.map((r) => {
      const question = survey.questions.find((q) => q.id === r.id);
      if (question.type === "mcq" || question.type === "multi-select") {
        const options = question.options;
        if (Array.isArray(r.response)) {
          return r.response
            .map((res) => String.fromCharCode(97 + options.indexOf(res)))
            .join(", ");
        }
        return String.fromCharCode(97 + options.indexOf(r.response));
      }
      return r.response;
    });

    const sheet1Data = [headers, responseRow];
    const timeHeaders = survey.questions.map((q, index) => `Q${index + 1} (seconds)`);
    const timeRow = timeTaken.map((t) => (t?.timeTaken / 1000).toFixed(2));
    const sheet2Data = [timeHeaders, timeRow];

    const mouseHeader = ["Elapsed Time (seconds)", "X-Y Coordinate"];
    const mouseData = mouseMovements.map((m) => [m.elapsedTime, `${m.x},${m.y}`]);
    const sheet3Data = [mouseHeader, ...mouseData];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(wb, ws1, "Responses");

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
    XLSX.utils.book_append_sheet(wb, ws2, "Time Taken");

    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
    XLSX.utils.book_append_sheet(wb, ws3, "Mouse Movement");

    XLSX.writeFile(wb, "survey_responses.xlsx");
    alert("Survey responses saved to Excel sheet!");
  };

  return (
    <div className="AttemptSurvey">
      <h2>{surveyTitle}</h2>
      {survey.questions &&
        survey.questions.map((question, index) => (
          <div key={question.id} className="question">
            <h4>
              {index + 1}. {question.questionText} {question.mandatory && <span style={{ color: "red" }}>*</span>}
            </h4>
            {question.type === "mcq" || question.type === "multi-select" ? (
              question.options.map((option, i) => (
                <div key={i}>
                  <input
                    type={question.type === "multi-select" ? "checkbox" : "radio"}
                    name={question.id}
                    value={option}
                    onChange={(e) => handleResponseChange(question.id, option, question.type === "multi-select")}
                  />
                  {String.fromCharCode(97 + i)}. {option}
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
