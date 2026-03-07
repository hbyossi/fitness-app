import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InstructionsToggle, hasInstructions } from './ExerciseInstructions';
import { formatReps, parseReps, generateId } from '../utils/helpers';
import type { Exercise } from '../types';

interface SortableExerciseProps {
  ex: Exercise;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Exercise>) => void;
}

function SortableExercise({ ex, onRemove, onUpdate }: SortableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id });
  const [editing, setEditing] = useState(false);
  const [editSets, setEditSets] = useState(String(ex.sets));
  const [editReps, setEditReps] = useState(formatReps(ex.reps, ex.repsMax));
  const [editWeight, setEditWeight] = useState(String(ex.weight || 0));
  const [editRestTime, setEditRestTime] = useState(String(ex.restTime || 90));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const saveEdit = () => {
    const { reps, repsMax } = parseReps(editReps);
    onUpdate(ex.id, {
      sets: parseInt(editSets) || 3,
      reps,
      repsMax: repsMax || undefined,
      weight: parseFloat(editWeight) || 0,
      restTime: parseInt(editRestTime) || 90,
    });
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="exercise-item" onClick={(e) => e.stopPropagation()}>
      <button type="button" className="drag-handle" {...attributes} {...listeners}>
        ⠿
      </button>
      <div className="exercise-info">
        <div className="exercise-name">{ex.name}</div>
        {editing ? (
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
            <input
              className="form-input"
              type="number"
              min="1"
              value={editSets}
              onChange={(e) => setEditSets(e.target.value)}
              style={{ width: 60, padding: '0.3rem' }}
              placeholder="סטים"
            />
            <input
              className="form-input"
              type="text"
              value={editReps}
              onChange={(e) => setEditReps(e.target.value)}
              style={{ width: 70, padding: '0.3rem' }}
              placeholder="8-12"
            />
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.5"
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value)}
              style={{ width: 70, padding: '0.3rem' }}
              placeholder='ק"ג'
            />
            <input
              className="form-input"
              type="number"
              min="0"
              step="5"
              value={editRestTime}
              onChange={(e) => setEditRestTime(e.target.value)}
              style={{ width: 70, padding: '0.3rem' }}
              placeholder="מנוחה"
            />
            <button
              type="button"
              className="btn btn-success"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
              onClick={saveEdit}
            >
              ✅
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.3rem' }}
              onClick={() => setEditing(false)}
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <div className="exercise-detail">
              {ex.sets} סטים × {formatReps(ex.reps, ex.repsMax)} חזרות{ex.weight > 0 && ` · ${ex.weight} ק"ג`}
              {ex.restTime && ex.restTime !== 90 && ` · מנוחה ${ex.restTime}ש'`}
            </div>
            {hasInstructions(ex.instructions) && <InstructionsToggle instructions={ex.instructions} />}
          </>
        )}
      </div>
      {!editing && (
        <div style={{ display: 'flex', gap: '0.2rem', flexDirection: 'column' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '0.2rem' }}
            onClick={() => setEditing(true)}
          >
            ✏️
          </button>
          <button
            type="button"
            className="btn btn-danger"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            onClick={() => onRemove(ex.id)}
          >
            הסר
          </button>
        </div>
      )}
    </div>
  );
}

interface SortableExerciseListProps {
  exercises: Exercise[];
  onReorder: (exercises: Exercise[]) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Exercise>) => void;
  showSupersetLinks?: boolean;
}

export default function SortableExerciseList({ exercises, onReorder, onRemove, onUpdate, showSupersetLinks }: SortableExerciseListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = exercises.findIndex((e) => e.id === active.id);
    const newIndex = exercises.findIndex((e) => e.id === over.id);
    onReorder(arrayMove(exercises, oldIndex, newIndex));
  };

  if (exercises.length === 0) return null;

  const toggleSuperset = (idx: number) => {
    const exA = exercises[idx];
    const exB = exercises[idx + 1];
    if (!exA || !exB) return;
    if (exA.supersetGroup && exA.supersetGroup === exB.supersetGroup) {
      // Unlink: remove group from B (and from A if it was only linked to B)
      const groupMembers = exercises.filter((e) => e.supersetGroup === exA.supersetGroup);
      if (groupMembers.length <= 2) {
        onUpdate(exA.id, { supersetGroup: undefined });
        onUpdate(exB.id, { supersetGroup: undefined });
      } else {
        onUpdate(exB.id, { supersetGroup: undefined });
      }
    } else {
      // Link: use existing group or create new one
      const group = exA.supersetGroup || exB.supersetGroup || generateId();
      onUpdate(exA.id, { supersetGroup: group });
      onUpdate(exB.id, { supersetGroup: group });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        {exercises.map((ex, idx) => {
          const isFirstInGroup =
            ex.supersetGroup && (idx === 0 || exercises[idx - 1].supersetGroup !== ex.supersetGroup);
          const isInGroup = !!ex.supersetGroup;
          const isLastInGroup =
            ex.supersetGroup &&
            (idx === exercises.length - 1 || exercises[idx + 1].supersetGroup !== ex.supersetGroup);
          const showLink = showSupersetLinks && idx < exercises.length - 1;
          const isLinked =
            ex.supersetGroup && idx < exercises.length - 1 && exercises[idx + 1].supersetGroup === ex.supersetGroup;

          return (
            <React.Fragment key={ex.id}>
              {isFirstInGroup && <div className="superset-label">🔗 סופרסט</div>}
              <div className={isInGroup ? 'superset-group' : ''} style={!isLastInGroup && isInGroup ? { marginBottom: 0, paddingBottom: 0 } : {}}>
                <SortableExercise ex={ex} onRemove={onRemove} onUpdate={onUpdate} />
              </div>
              {showLink && (
                <button
                  type="button"
                  className={`superset-link-btn ${isLinked ? 'linked' : ''}`}
                  onClick={() => toggleSuperset(idx)}
                  title={isLinked ? 'הסר סופרסט' : 'צור סופרסט'}
                >
                  {isLinked ? '🔗 סופרסט' : '⋯ קשר סופרסט'}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </SortableContext>
    </DndContext>
  );
}
