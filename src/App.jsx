import { useReducer, useEffect } from "react";
import jsPDF from "jspdf";
import scheduleData from "../defaultSchedule.json";

const getInitialState = () => {
  const localData = localStorage.getItem("mealScheduleData");
  return {
    scheduleData: localData
      ? JSON.parse(localData)
      : scheduleData.defaultSchedule,
    activity: "NotEditing",
    tempEditingData: null,
    editIndex: null,
  };
};

function reducer(state, action) {
  const { scheduleData, tempEditingData } = state;
  switch (action.type) {
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
}

function App() {
  const [state, dispatch] = useReducer(reducer, null, getInitialState);
  const { scheduleData, activity, tempEditingData, editIndex } = state;

  useEffect(() => {
    localStorage.setItem("mealScheduleData", JSON.stringify(scheduleData));
  }, [scheduleData]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Daily Meal Schedule", 20, 20);

    let y = 30;
    scheduleData.forEach((meal, i) => {
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
                  {meal.food.length > 0 && (
                    <em> Food: {meal.food.join(", ")}</em>
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
          {console.log(scheduleData[editIndex].food)}
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
                      {scheduleData[editIndex].food.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
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
                  placeholder="Calories (kcal)"
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
                  placeholder="Carbs (g)"
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
                  placeholder="Protein (g)"
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
                  placeholder="Fats (g)"
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
