import React from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InstructionsToggle, hasInstructions } from './ExerciseInstructions';

function SortableExercise({ ex, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="exercise-item">
      <button type="button" className="drag-handle" {...attributes} {...listeners}>
        ⠿
      </button>
      <div className="exercise-info">
        <div className="exercise-name">{ex.name}</div>
        <div className="exercise-detail">
          {ex.sets} סטים × {ex.reps} חזרות{ex.weight > 0 && ` · ${ex.weight} ק"ג`}
        </div>
        {hasInstructions(ex.instructions) && <InstructionsToggle instructions={ex.instructions} />}
      </div>
      <button type="button" className="btn btn-danger" onClick={() => onRemove(ex.id)}>הסר</button>
    </div>
  );
}

export default function SortableExerciseList({ exercises, onReorder, onRemove }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = exercises.findIndex(e => e.id === active.id);
    const newIndex = exercises.findIndex(e => e.id === over.id);
    onReorder(arrayMove(exercises, oldIndex, newIndex));
  };

  if (exercises.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
        {exercises.map(ex => (
          <SortableExercise key={ex.id} ex={ex} onRemove={onRemove} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
