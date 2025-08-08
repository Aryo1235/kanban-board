import { useState } from "react";
import "./App.css";

function App() {
  const [coloumns, setColumns] = useState({
    todo: {
      name: "To Do",
      items: [
        { id: 1, content: "Task 1" },
        { id: 2, content: "Task 2" },
      ],
    },
    inProgress: {
      name: "In Progress",
      items: [
        { id: 3, content: "Task 3" },
        { id: 4, content: "Task 4" },
      ],
    },
    done: {
      name: "Done",
      items: [
        { id: 5, content: "Task 5" },
        { id: 6, content: "Task 6" },
      ],
    },
  });

  const [newTask, setNewTask] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("todo");
  const [draggedItem, setDraggedItem] = useState(null);

  const addNewTask = () => {
    if (newTask.trim() === "") return;

    const updatedColumns = { ...coloumns };

    updatedColumns[selectedColumn].items.push({
      id: Date.now().toString(),
      content: newTask,
    });

    setColumns(updatedColumns);
    setNewTask("");
  };

  const removeTask = (coloumnId, taskId) => {
    const updatedColumns = { ...coloumns };

    updatedColumns[coloumnId].items = updatedColumns[coloumnId].items.filter(
      (item) => item.id !== taskId
    );
    setColumns(updatedColumns);
  };

  const handleDragStart = (columnId, item) => {
    setDraggedItem({ columnId, item });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { columnId: sourceColumnId, item } = draggedItem;
    if (sourceColumnId === columnId) return;

    const updatedColumns = { ...coloumns };

    updatedColumns[sourceColumnId].items = updatedColumns[
      sourceColumnId
    ].items.filter((items) => items.id !== item.id);
    updatedColumns[columnId].items.push(item);
    setColumns(updatedColumns);
    setDraggedItem(null);
  };

  const columnStyles = {
    todo: {
      header: "bg-gradient-to-r from-sky-500 to-sky-700 ",
      border: "border-sky-500",
    },
    inProgress: {
      header: "bg-gradient-to-r from-amber-500 to-amber-700 ",
      border: "border-amber-500",
    },
    done: {
      header: "bg-gradient-to-r from-emerald-500 to-emerald-700 ",
      border: "border-emerald-500",
    },
  };

  return (
    <>
      <div className="p-6 bg-gradient-to-t from-gray-950 to-gray-900 min-h-screen flex justify-center items-center">
        <div className="max-w-6xl w-full flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-yellow-400 via-pink-400 mb-8">
            Kanban Board
          </h1>
          <div className="mb-8 flex max-w-lg w-full overflow-hidden ">
            <input
              className="flex-grow p-3 bg-gray-800 border border-gray-700 border-r-0 rounded-l text-white"
              placeholder="Add new task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNewTask()}
            />

            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className=" bg-gray-800 text-white border-gray-700 border-1 border-l-0 rounded-r "
            >
              <option value="todo">To Do</option>
              <option value="inProgress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <button
              onClick={addNewTask}
              className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 transition-colors cursor-pointer ml-2"
              aria-label="Add Task"
            >
              {/* Plus icon SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 w-full justify-center items-start">
            {Object.entries(coloumns).map(([columnId, column]) => (
              <div
                key={columnId}
                className={`flex-shrink-0 w-80 p-3 bg-gray-800 rounded-lg border-t-4 min-h-40 ${columnStyles[columnId].border}`}
                onDragOver={(e) => handleDragOver(e, columnId)}
                onDrop={(e) => handleDrop(e, columnId)}
              >
                <div
                  className={`p-4 text-white font-bold text-xl mb-4 rounded-t-md ${columnStyles[columnId].header}`}
                >
                  {coloumns[columnId].name}

                  <span className="ml-4 bg-gray-900 rounded-full px-2 py-1 text-sm bg-opacity-30">
                    {coloumns[columnId].items.length}
                  </span>
                </div>

                {/* Render tasks */}
                <div className="space-y-2">
                  {coloumns[columnId].items.length === 0 && (
                    <div className="text-gray-500 text-center p-3">
                      No tasks available
                    </div>
                  )}
                  {column.items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(columnId, item)}
                      className="bg-gray-700 text-white p-3 rounded-md cursor-move hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span>{item.content}</span>
                        <button
                          onClick={() => removeTask(columnId, item.id)}
                          className="text-red-400 hover:text-red-300 ml-2 cursor-pointer"
                          aria-label="Delete"
                        >
                          {/* Trash icon SVG */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
