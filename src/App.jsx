import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Edit2, Plus, GripVertical, ExternalLink } from 'lucide-react'; 
import './App.css';

// --- Sortable Item Component ---
function SortableItem({ id, item, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1, 
    // IMPORTANT: 'pan-y' allows the user to scroll vertically when touching the card
    touchAction: 'pan-y' 
  };

  const handleImageClick = (e) => {
    // Prevent bubbling so it doesn't trigger other things
    e.stopPropagation();
    window.open(item.imageUrl, '_blank');
  };

  return (
    <div ref={setNodeRef} style={style} className="card">
      
      {/* --- IMAGE AREA --- */}
      <div className="card-image-container">
        <img 
          src={item.imageUrl} 
          alt={item.title} 
          className="card-img"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Error'; }} 
          // Feature Restored: Click image to open
          onClick={handleImageClick}
        />
        
        {/* --- DRAG HANDLE (The ONLY place you can drag from) --- */}
        <div className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={24} color="#ffffff" />
        </div>

        {/* --- HOVER OVERLAY (Feature Restored) --- */}
        <div className="edit-overlay">
           <button 
             className="btn-icon-overlay"
             onClick={handleImageClick}
             title="Open Image"
           >
             <ExternalLink size={20} color="white"/>
           </button>
           
           <button 
             className="btn-edit-overlay" 
             onClick={(e) => { e.stopPropagation(); onEdit(item); }}
           >
             <Edit2 size={16} style={{marginRight:5}} /> Edit
           </button>
        </div>
      </div>
      
      {/* --- CONTENT AREA --- */}
      <div className="card-content">
        <div className="card-title">{item.title}</div>
        
        <div className="card-actions">
            <button className="btn-action edit" onClick={() => onEdit(item)}>
                <Edit2 size={16} /> Edit
            </button>
            <button className="btn-action delete" onClick={() => onDelete(item.id)}>
                <Trash2 size={16} /> Delete
            </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Application ---
function App() {
  const [items, setItems] = useState([]);
  const [headerTitle, setHeaderTitle] = useState("Business Overview");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- SENSORS ---
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { 
        activationConstraint: { delay: 0, tolerance: 5 } 
    })
  );

  // Load from Local Storage
  useEffect(() => {
    const savedData = localStorage.getItem('my-image-gallery');
    const savedTitle = localStorage.getItem('my-page-title');
    if (savedTitle) setHeaderTitle(savedTitle);
    
    if (savedData) {
      setItems(JSON.parse(savedData));
    } else {
      setItems([
        { id: '1', title: 'Short Overview', imageUrl: 'https://images.unsplash.com/photo-1559627756-c73e16b9d621?w=500&q=80' },
        { id: '2', title: 'Economic Story', imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&q=80' },
        { id: '3', title: 'Full Overview', imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&q=80' },
      ]);
    }
  }, []);

  // Save to Local Storage
  useEffect(() => {
    localStorage.setItem('my-image-gallery', JSON.stringify(items));
    localStorage.setItem('my-page-title', headerTitle);
  }, [items, headerTitle]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const openAddModal = () => {
    setEditingItem(null); setTitleInput(''); setUrlInput(''); setErrorMsg(''); setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item); setTitleInput(item.title); setUrlInput(item.imageUrl); setErrorMsg(''); setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!titleInput.trim() || !urlInput.trim()) return setErrorMsg("Fill all fields");
    
    if (items.some(i => i.imageUrl === urlInput && i.id !== editingItem?.id)) {
        return setErrorMsg("Duplicate Image URL");
    }

    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...i, title: titleInput, imageUrl: urlInput } : i));
    } else {
      setItems([...items, { id: Math.random().toString(36).substr(2, 9), title: titleInput, imageUrl: urlInput }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>{headerTitle}</h1>
        <div className="header-buttons">
          <button className="btn btn-outline" onClick={() => {
              const t = prompt("New Title:", headerTitle); 
              if(t) setHeaderTitle(t);
          }}>Edit Title</button>
          <button className="btn btn-primary" onClick={openAddModal}><Plus size={18} /> Add Image</button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div className="grid-container">
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id} item={item} onEdit={openEditModal} onDelete={(id) => {
                  if(window.confirm("Delete?")) setItems(items.filter(i => i.id !== id));
              }} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? "Edit Video" : "Add Video"}</h3>
            {errorMsg && <div className="error-msg">{errorMsg}</div>}
            
            <div className="modal-content-stack">
                <div className="modal-inputs">
                    <label>Title</label>
                    <input value={titleInput} onChange={e => setTitleInput(e.target.value)} placeholder="Title" />
                    
                    <label>Image URL</label>
                    <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." />
                </div>
                
                <div className="modal-preview">
                    {urlInput ? <img src={urlInput} alt="Preview" /> : <div className="no-img">Preview</div>}
                </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;