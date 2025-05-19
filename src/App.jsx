import { useReducer, useEffect, useState } from "react";
import jsPDF from "jspdf";
import defaultScheduleData from "../defaultSchedule.json";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const reducer = (state, action) => {
  const { scheduleData, tempEditingData } = state || {};
  switch (action.type) {
    case "LoadInitial":
      return { ...action.payload };

    case "EditMeal":
      return {
        ...state,
        activity: "Editing",
        tempEditingData: { ...scheduleData[action.id] },
        editIndex: action.id,
      };

    case "ChangeInput":
      const updatedField = { ...tempEditingData };
      if (action.field === "Food") {
        updatedField.food = action.payload.split("\n");
      } else {
        updatedField[action.field.toLowerCase()] = Number(action.payload);
      }
      return { ...state, tempEditingData: updatedField };

    case "SubmitMealData":
      const updatedSchedule = [...scheduleData];
      updatedSchedule[state.editIndex] = state.tempEditingData;
      return {
        ...state,
        scheduleData: updatedSchedule,
        activity: "NotEditing",
        tempEditingData: null,
        editIndex: null,
      };

    case "Close":
      return { ...state, activity: "NotEditing" };

    case "Undo":
      return {
        ...state,
        tempEditingData: {
          ...tempEditingData,
          food: [],
          calories: "",
          carbs: "",
          protein: "",
          fats: "",
        },
      };

    default:
      return state;
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, null);
  const [loading, setLoading] = useState(true);
  const userId = "defaultUser"; // Replace with dynamic ID later if using auth

  const { scheduleData, activity, tempEditingData, editIndex } = state || {};

  // Load from Firestore on mount
  useEffect(() => {
    const loadInitial = async () => {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      const initialState = {
        scheduleData: docSnap.exists()
          ? docSnap.data().scheduleData
          : defaultScheduleData.defaultSchedule,
        activity: "NotEditing",
        tempEditingData: null,
        editIndex: null,
      };
      dispatch({ type: "LoadInitial", payload: initialState });
      setLoading(false);
    };
    loadInitial();
  }, []);

  // Save to Firestore when scheduleData changes
  useEffect(() => {
    if (!loading && state?.scheduleData) {
      const saveToFirebase = async () => {
        const docRef = doc(db, "users", userId);
        await setDoc(docRef, { scheduleData: state.scheduleData });
      };
      saveToFirebase();
    }
  }, [state?.scheduleData]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Daily Meal Schedule", 20, 20);

    let y = 30;
    state.scheduleData.forEach((meal, i) => {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(`${i + 1}. ${meal.type} - ${meal.time}`, 20, y);
      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      if (meal.food.length) doc.text(`Food: ${meal.food.join(", ")}`, 25, y);
      y += 6;
      doc.text(`Calories: ${meal.calories || 0} kcal`, 25, y);
      y += 6;
      doc.text(
        `Carbs: ${meal.carbs || 0}g | Protein: ${meal.protein || 0}g | Fats: ${
          meal.fats || 0
        }g`,
        25,
        y
      );
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, "-");
    doc.save(`Meal-Schedule-${dateStr}_${timeStr}.pdf`);
  };

  if (loading || !state) return <div>Loading...</div>;

  return (
    <>
      {activity === "NotEditing" ? (
        <div className="meal-container">
          <h1 className="meal-heading">Daily Meal Schedule</h1>
          <div className="meal-grid">
            {scheduleData.map((meal, index) => (
              <div
                key={index}
                className="meal-card"
                onClick={() => dispatch({ type: "EditMeal", id: index })}
              >
                <div className="meal-header">
                  <strong>{meal.type}</strong> - {meal.time}
                </div>
                <div className="macro-values">
                  <span>Calories: {meal.calories || 0}</span>
                  <span>Carbs: {meal.carbs || 0}</span>
                  <span>Protein: {meal.protein || 0}g</span>
                  <span>Fats: {meal.fats || 0}g</span>
                </div>
                <div className="food-preview">
                  {meal.food.filter((f) => f.trim() !== "").length > 0 && (
                    <em>
                      Food: &nbsp;
                      {meal.food.filter((f) => f.trim() !== "").join(", ")}
                    </em>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="download-btn-wrapper">
            <button className="download-btn" onClick={downloadPDF}>
              Download PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="overlay">
          <div className="preview-box-left">
            <div className="meal-card">
              <div className="meal-header">
                <strong>{scheduleData[editIndex].type}</strong> -{" "}
                {scheduleData[editIndex].time}
              </div>
              <div className="macro-values">
                <span>Calories: {scheduleData[editIndex].calories || 0}</span>
                <span>Carbs: {scheduleData[editIndex].carbs || 0}</span>
                <span>Protein: {scheduleData[editIndex].protein || 0}g</span>
                <span>Fats: {scheduleData[editIndex].fats || 0}g</span>
              </div>
              <div className="food-preview">
                {scheduleData[editIndex].food.length > 0 && (
                  <>
                    <p> Food: </p>
                    <ul>
                      {scheduleData[editIndex].food.map((item, index) =>
                        item !== "" ? <li key={index}>{item}</li> : null
                      )}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="editing-box">
            <div className="editing-header">
              <div className="header-left">
                <h2>
                  {tempEditingData.type} - {tempEditingData.time}
                </h2>
                <button
                  className="undo-btn"
                  onClick={() => dispatch({ type: "Undo" })}
                >
                  &#8630;
                </button>
              </div>
              <button
                className="header-right"
                onClick={() => dispatch({ type: "Close" })}
              >
                &times;
              </button>
            </div>
            <form
              className="meal-data"
              onSubmit={(e) => {
                e.preventDefault();
                dispatch({ type: "SubmitMealData" });
              }}
            >
              <label>
                Food:
                <textarea
                  placeholder="Food Items..."
                  value={tempEditingData.food.join("\n")}
                  className="meal-input"
                  rows={tempEditingData.food.length + 1}
                  onChange={(event) =>
                    dispatch({
                      type: "ChangeInput",
                      field: "Food",
                      payload: event.target.value,
                    })
                  }
                ></textarea>
              </label>

              <label>
                Calories (kcal):
                <input
                  type="number"
                  value={tempEditingData.calories || ""}
                  className="meal-input"
                  onChange={(event) =>
                    dispatch({
                      type: "ChangeInput",
                      field: "Calories",
                      payload: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Carbs (g):
                <input
                  type="number"
                  value={tempEditingData.carbs || ""}
                  className="meal-input"
                  onChange={(event) =>
                    dispatch({
                      type: "ChangeInput",
                      field: "Carbs",
                      payload: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Protein (g):
                <input
                  type="number"
                  value={tempEditingData.protein || ""}
                  className="meal-input"
                  onChange={(event) =>
                    dispatch({
                      type: "ChangeInput",
                      field: "Protein",
                      payload: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Fats (g):
                <input
                  type="number"
                  value={tempEditingData.fats || ""}
                  className="meal-input"
                  onChange={(event) =>
                    dispatch({
                      type: "ChangeInput",
                      field: "Fats",
                      payload: event.target.value,
                    })
                  }
                />
              </label>

              <div className="submit-btn-wrapper">
                <button type="submit" className="submit-btn">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
