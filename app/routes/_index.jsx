import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  defaultAnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function DragHandle() {
  return (
    <svg 
      className="w-5 h-5 text-gray-400"
      viewBox="0 0 20 20" 
      fill="currentColor"
    >
      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
    </svg>
  );
}

const animateLayoutChanges = (args) => {
  const { isSorting, wasSorting } = args;

  if (isSorting || wasSorting) {
    return defaultAnimateLayoutChanges(args);
  }

  return true;
};

export default function Index() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Complete online JavaScript course", completed: false },
    { id: 2, text: "Jog around the park 3x", completed: false },
    { id: 3, text: "10 minutes meditation", completed: false },
    { id: 4, text: "Read for 1 hour", completed: false },
  ]);
  const [filter, setFilter] = useState('all'); //All, active and completed
  const [activeId, setActiveId] = useState(null);

  const addTask = (text) => {
    const newTask = {
      id: Date.now(),
      text,
      completed: false,
    };
    setTasks([...tasks, newTask]);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(task => !task.completed));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  return (
    <main className="flex flex-col items-center">
      <section className=" bg-red-500">
        <img src="/images/bg-mobile-light.jpg" alt="" srcSet="/images/bg-mobile-light.jpg 375w, /images/bg-desktop-light.jpg 1440w" />
      </section>
      <section className="mt-[-180px] sm:w-[500px]">
        <div className="container flex justify-between items-center mb-5">
          <h1 className="text-3xl font-bold tracking-wide text-white">TODO</h1>
          <button className="p-2">
            <span className="text-lg">
              <img src="/images/icon-moon.svg" alt="" />
            </span>
          </button>
        </div>
        <TaskInput onAdd={addTask} />
        <div className="mt-6 mb-3 bg-white rounded-lg shadow-md p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            modifiers={[restrictToVerticalAxis]}
          >
            <TaskList 
              tasks={filteredTasks} 
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
            <DragOverlay>
              {activeId ? <SortableTaskItem task={tasks.find(t => t.id === activeId)} /> : null}
            </DragOverlay>
          </DndContext>
          <Footer 
            tasks={tasks}
            filter={filter}
            onFilterChange={setFilter}
            onClearCompleted={clearCompleted}
          />
        </div>
        
      </section>
    </main>
  );
}

function TaskInput({ onAdd }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text);
      setText('');
    }
  };

  return (
    <div className="relative mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Create a new todo..."
          className="flex-1 p-4 rounded-lg shadow-sm text-gray-700 border border-gray-300 focus:outline-none focus:ring focus:ring-blue-200"
        />
        <button 
          type="submit"
          className="px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}

function TaskList({ tasks, onToggle, onDelete }) {
  return (
    <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
      <ul className="space-y-2 transition-all">
        {tasks.map((task) => (
          <SortableTaskItem 
            key={task.id} 
            task={task} 
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </SortableContext>
  );
}

function SortableTaskItem({ task, onToggle, onDelete }) {
  const sortableProps = useSortable({ 
    id: task.id,
    animateLayoutChanges,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortableProps;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li 
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center space-x-4 p-4 border-b-[1px] border-gray-200 
        bg-white rounded-lg select-none
        ${isDragging ? 'shadow-lg ring-2 ring-blue-400 opacity-50' : ''}
        transition-all duration-200
      `}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing hover:text-gray-600"
      >
        <DragHandle />
      </div>

      <button
        onClick={() => onToggle(task.id)}
        className={`
          w-6 h-6 flex-shrink-0 rounded-full border-2 
          transition-colors duration-200 ease-in-out
          ${task.completed 
            ? "bg-gradient-to-r from-blue-400 to-blue-500 border-transparent" 
            : "border-gray-300 hover:border-blue-400"
          }
        `}
      >
        {task.completed && (
          <svg 
            className="w-full h-full text-white p-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        )}
      </button>

      <span
        className={`
          flex-grow text-gray-700 transition-colors duration-200
          ${task.completed ? "line-through text-gray-400" : ""}
        `}
      >
        {task.text}
      </span>

      <button 
        onClick={() => onDelete(task.id)}
        className="
          opacity-0 group-hover:opacity-100 
          transition-opacity duration-200
          hover:text-red-500
        "
      >
        <img src="/images/icon-cross.svg" alt="Delete task" />
      </button>
    </li>
  );
}

function Footer({ tasks, filter, onFilterChange, onClearCompleted }) {
  const activeCount = tasks.filter(task => !task.completed).length;

  return (
    <footer className="mt-6 text-sm text-gray-500">
      <div className="flex justify-between items-center">
        <span>{activeCount} items left</span>
        <div className="space-x-4">
          <button 
            onClick={() => onFilterChange('all')}
            className={`${filter === 'all' ? 'text-blue-500 font-medium' : ''} hover:underline`}
          >
            All
          </button>
          <button 
            onClick={() => onFilterChange('active')}
            className={`${filter === 'active' ? 'text-blue-500 font-medium' : ''} hover:underline`}
          >
            Active
          </button>
          <button 
            onClick={() => onFilterChange('completed')}
            className={`${filter === 'completed' ? 'text-blue-500 font-medium' : ''} hover:underline`}
          >
            Completed
          </button>
        </div>
        <button 
          onClick={onClearCompleted}
          className="hover:underline"
        >
          Clear Completed
        </button>
      </div>
      <p className="mt-6 text-center">Drag and drop to reorder list</p>
    </footer>
  );
}

function DragOverlay({ children }) {
  return (
    <div className="bg-white shadow-lg rounded-lg ring-2 ring-blue-400">
      {children}
    </div>
  );
}
