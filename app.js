import React, { useEffect, useMemo, useRef, useState } from "react";

// Single‑file React To‑Do app
// Features: add, edit, delete, complete, search, filter, keyboard shortcuts, localStorage persistence
// Styling: Tailwind CSS (no external UI libs required)

function classNames(...cls) {
  return cls.filter(Boolean).join(" ");
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

function Icon({ name, className = "w-4 h-4" }) {
  const icons = {
    plus: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12h14" />
      </svg>
    ),
    edit: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4h6a2 2 0 012 2v6M16 8l-9 9-4 1 1-4 9-9" />
      </svg>
    ),
    trash: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a2 2 0 012-2h2a2 2 0 012 2v2" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
    x: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
    ),
  };
  return icons[name] ?? null;
}

function TaskRow({ task, onToggle, onDelete, onStartEdit }) {
  return (
    <li className="group flex items-center gap-3 rounded-xl border border-zinc-200/70 bg-white p-3 shadow-sm transition hover:shadow">
      <button
        aria-label={task.completed ? "Mark as not done" : "Mark as done"}
        onClick={() => onToggle(task.id)}
        className={classNames(
          "grid place-items-center rounded-md border p-1 transition",
          task.completed
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
        )}
      >
        <Icon name={task.completed ? "check" : "plus"} />
      </button>

      <span
        className={classNames(
          "flex-1 text-[15px] leading-tight",
          task.completed ? "text-zinc-400 line-through" : "text-zinc-800"
        )}
      >
        {task.text}
      </span>

      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => onStartEdit(task.id)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
        >
          <span className="inline-flex items-center gap-1"><Icon name="edit" /> Edit</span>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          <span className="inline-flex items-center gap-1"><Icon name="trash" /> Delete</span>
        </button>
      </div>
    </li>
  );
}

export default function TodoApp() {
  const [tasks, setTasks] = useLocalStorage("todoapp-v1", []);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | done
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const inputRef = useRef(null);
  const editRef = useRef(null);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) =>
        filter === "all" ? true : filter === "active" ? !t.completed : t.completed
      )
      .filter((t) => t.text.toLowerCase().includes(query.trim().toLowerCase()));
  }, [tasks, filter, query]);

  function addTask() {
    const val = text.trim();
    if (!val) return;
    const newTask = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: val,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks([newTask, ...tasks]);
    setText("");
    inputRef.current?.focus();
  }

  function toggleTask(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setTasks((prev) => prev.filter((t) => !t.completed));
  }

  function startEdit(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id);
    setEditingText(t.text);
  }

  function saveEdit() {
    const val = editingText.trim();
    if (!val) {
      setEditingId(null);
      setEditingText("");
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, text: val } : t)));
    setEditingId(null);
    setEditingText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") addTask();
  }

  const remaining = tasks.filter((t) => !t.completed).length;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">To‑Do List</h1>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
          {remaining} {remaining === 1 ? "task" : "tasks"} left
        </span>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new task and press Enter…"
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[15px] outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
            aria-label="New task"
          />
          <button
            onClick={addTask}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            <Icon name="plus" className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "done", label: "Completed" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={classNames(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  filter === f.key
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                )}
                aria-pressed={filter === f.key}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400">
                <Icon name="search" />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks…"
                className="w-56 rounded-xl border border-zinc-200 bg-white pl-8 pr-3 py-2 text-[15px] outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
                aria-label="Search tasks"
              />
            </div>
            <button
              onClick={clearCompleted}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Clear completed
            </button>
          </div>
        </div>
      </div>

      <ul className="grid gap-2">
        {filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500">
            No tasks yet. Add your first one above!
          </li>
        )}

        {filtered.map((task) => (
          <div key={task.id} className="relative">
            {editingId === task.id ? (
              <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
                <input
                  ref={editRef}
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditingText("");
                    }
                  }}
                  className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-blue-200"
                  aria-label="Edit task"
                />
                <button
                  onClick={saveEdit}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditingText("");
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <TaskRow
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onStartEdit={startEdit}
              />
            )}
          </div>
        ))}
      </ul>

      {tasks.length > 0 && (
        <div className="mt-6 text-center text-xs text-zinc-500">
          Pro‑tip: Press <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1">Enter</kbd> to add, <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1">Esc</kbd> to cancel edits.
        </div>
      )}
    </div>
  );
}
