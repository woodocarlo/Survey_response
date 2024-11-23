import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import AttemptSurvey from './AttemptSurvey';  // <-- Import AttemptSurvey
import * as XLSX from "xlsx"; // Import XLSX library for handling Excel files
const initialQuestions = [];

function SurveyBuilder({ saveSurvey, surveyTitle, setSurveyTitle, questions, setQuestions }) {
  const [excelUrl, setExcelUrl] = useState(""); // State to store the Excel URL

  const questionTypes = [
    { type: "mcq", label: "Multiple Choice" },
    { type: "subjective", label: "Subjective" },
    { type: "multi-select", label: "Multi-Select" },
    
  ];

  const addQuestion = (type, index = null) => {
    const newQuestion = {
      id: `question-${questions.length + 1}`,
      type,
      mandatory: false,
      questionText: "",
      options: type === "mcq" || type === "multi-select" ? ["Option 1"] : [],
    };

    if (index === null) {
      setQuestions([...questions, newQuestion]);
    } else {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index + 1, 0, newQuestion);
      setQuestions(updatedQuestions);
    }
  };
  const handleCopyScript = () => {
    const surveyData = {
      title: surveyTitle,
      questions,
      excelUrl,
    };
    navigator.clipboard.writeText(JSON.stringify(surveyData, null, 2))
      .then(() => alert("Survey script copied to clipboard!"))
      .catch((err) => alert("Failed to copy script: " + err));
  };


  const updateQuestion = (id, field, value) => {
    const updatedQuestions = questions.map((q) =>
      q.id === id ? { ...q, [field]: value } : q
    );
    setQuestions(updatedQuestions);
  };

  const deleteQuestion = (id) => {
    const updatedQuestions = questions.filter((q) => q.id !== id);
    setQuestions(updatedQuestions);
  };

  const handleSaveSurvey = () => {
    // Create the survey object with the excelUrl
    const surveyData = {
      title: surveyTitle,
      questions,
      excelUrl: excelUrl,
    };

    saveSurvey(surveyData);
  };

  const renderQuestion = (question, index) => (
    <div className="question-card" key={question.id}>
      <div className="question-header">
        <span className="question-number">{index + 1}.</span>
        <textarea
          placeholder="Enter your question here..."
          value={question.questionText}
          onChange={(e) =>
            updateQuestion(question.id, "questionText", e.target.value)
          }
          style={{
            width: "100%",
            minHeight: "50px", // Set a minimum height to ensure readability
            resize: "vertical", // Allow the user to resize the box
            wordWrap: "break-word", // Ensure text wraps inside the textarea
            whiteSpace: "pre-wrap", // Handle spaces and newlines properly
            overflowWrap: "break-word", // Handle overflow properly
            padding: "8px", // Add padding for better user experience
          }}
        />
        {question.mandatory && (
          <span style={{ color: "red" }}>*</span>
        )}
        <div className="actions">
          <label>
            <input
              type="checkbox"
              checked={question.mandatory}
              onChange={(e) =>
                updateQuestion(question.id, "mandatory", e.target.checked)
              }
            />
            Mandatory
          </label>
          <button onClick={() => deleteQuestion(question.id)}>Delete</button>
        </div>
      </div>

      {["mcq", "multi-select"].includes(question.type) && (
        <div className="options">
          {question.options.map((opt, i) => (
            <div key={i} className="option">
              <input
                type={question.type === "multi-select" ? "checkbox" : "radio"}
                value={opt}
                onChange={(e) => {
                  const updatedOptions = [...question.options];
                  updatedOptions[i] = e.target.value;
                  updateQuestion(question.id, "options", updatedOptions);
                }}
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const updatedOptions = [...question.options];
                  updatedOptions[i] = e.target.value;
                  updateQuestion(question.id, "options", updatedOptions);
                }}
              />
              <button
                onClick={() => {
                  const updatedOptions = question.options.filter(
                    (_, idx) => idx !== i
                  );
                  updateQuestion(question.id, "options", updatedOptions);
                }}
              >
                Delete
              </button>
            </div>
          ))}
          <button onClick={handleCopyScript}>Copy Script</button>

          <button
            onClick={() =>
              updateQuestion(question.id, "options", [
                ...question.options,
                `Option ${question.options.length + 1}`,
              ])
            }
          >
            Add Option
          </button>
        </div>
      )}

      <button className="add-after" onClick={() => addQuestion(question.type, index)}>
        Add Question After
      </button>
    </div>
  );

  return (
    <div className="SurveyBuilder">
      <input
        type="text"
        className="survey-title"
        value={surveyTitle}
        onChange={(e) => setSurveyTitle(e.target.value)}
      />
      <h1>{surveyTitle}</h1>

      {/* Excel File URL input */}
      <div className="excel-url">
        <label htmlFor="excel-url">Enter the Excel URL:</label>
        <input
          id="excel-url"
          type="url"
          value={excelUrl}
          onChange={(e) => setExcelUrl(e.target.value)}
          placeholder="Paste the Excel file URL here"
        />
      </div>

      <div className="toolbar">
        {questionTypes.map((qt) => (
          <button key={qt.type} onClick={() => addQuestion(qt.type)}>
            Add {qt.label}
          </button>
        ))}
      </div>

      <div className="questions-list">
        {questions.map((q, index) => renderQuestion(q, index))}
      </div>

      <button onClick={handleSaveSurvey}>Save Survey</button>
    </div>
  );
}

function SavedSurveys() {
  const navigate = useNavigate();
  const [savedSurveys, setSavedSurveys] = useState([]);
  const [customScript, setCustomScript] = useState("");

  useEffect(() => {
    const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
    setSavedSurveys(surveys);
  }, []);

  const deleteSurvey = (index) => {
    const updatedSurveys = savedSurveys.filter((_, i) => i !== index);
    localStorage.setItem("surveys", JSON.stringify(updatedSurveys));
    setSavedSurveys(updatedSurveys);
  };

  const attemptSurvey = (survey) => {
    navigate(`/attempt/${survey.title}`, { state: { survey } });
  };

  const handleAddCustomSurvey = () => {
    try {
      const newSurvey = JSON.parse(customScript);
      if (!newSurvey.title || !newSurvey.questions) {
        alert("Invalid survey script! Ensure it includes a title and questions.");
        return;
      }
      const updatedSurveys = [...savedSurveys, newSurvey];
      localStorage.setItem("surveys", JSON.stringify(updatedSurveys));
      setSavedSurveys(updatedSurveys);
      alert("Custom survey added successfully!");
      setCustomScript(""); // Clear the input
    } catch (error) {
      alert("Invalid JSON format. Please check the script and try again.");
    }
  };

  return (
    <div className="SavedSurveys">
      <h1>Saved Surveys</h1>
      <button className="create-survey-btn" onClick={() => navigate("/new")}>
        Create New Survey
      </button>
      
      {/* Add Custom Survey Section */}
      <div className="custom-survey">
        <h3>Add Custom Survey</h3>
        <textarea
          placeholder="Paste your survey script here..."
          value={customScript}
          onChange={(e) => setCustomScript(e.target.value)}
          style={{ width: "100%", minHeight: "100px" }}
        />
        <button onClick={handleAddCustomSurvey}>Submit Script</button>
      </div>

      <div className="survey-grid">
        {savedSurveys.map((survey, index) => (
          <div className="survey-card" key={index}>
            <h2>{survey.title}</h2>
            <p>Questions: {survey.questions.length}</p>
            <div className="survey-actions">
              <button className="delete-btn" onClick={() => deleteSurvey(index)}>
                Delete
              </button>
              <button className="attempt-btn" onClick={() => attemptSurvey(survey)}>
                Attempt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [questions, setQuestions] = useState(initialQuestions); // Set initialQuestions as the initial state
  const [surveyTitle, setSurveyTitle] = useState("New Survey");

  const saveSurvey = () => {
    const existingSurveys = JSON.parse(localStorage.getItem("surveys") || "[]");
    const newSurvey = { title: surveyTitle, questions };
    localStorage.setItem("surveys", JSON.stringify([...existingSurveys, newSurvey]));
    alert("Survey saved successfully!");
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SavedSurveys />} />
        <Route path="/new" element={
          <SurveyBuilder
            saveSurvey={saveSurvey}
            surveyTitle={surveyTitle}
            setSurveyTitle={setSurveyTitle}
            questions={questions}
            setQuestions={setQuestions}
          />
        } />
        <Route path="/attempt/:surveyTitle" element={<AttemptSurvey />} />
      </Routes>
    </Router>
  );
}
export default App;
