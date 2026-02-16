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
import { Trash2, Edit2, Plus, ExternalLink, GripVertical } from 'lucide-react'; 
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
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none' 
  };

  return (
    <div ref={setNodeRef} style={style} className="card">
      <div className="card-image-container">
        <img 
          src={item.imageUrl} 
          alt={item.title} 
          className="card-img"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Error'; }} 
        />
        
        {/* --- DRAG HANDLE --- 
            We apply {attributes} and {listeners} HERE only.
            This allows normal scrolling on the image, but dragging on the icon.
        */}
        <div className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={24} color="#fff" />
        </div>

        {/* Overlay with Actions */}
        <div className="edit-overlay">
          <button 
             className="btn-icon-overlay"
             onClick={() => window.open(item.imageUrl, '_blank')}
             title="Open Image"
          >
            <ExternalLink size={18} color="white"/>
          </button>

          <button 
            className="btn-edit-overlay"
            onClick={() => onEdit(item)}
          >
            <Edit2 size={16} style={{marginRight: 5}}/> Edit
          </button>
        </div>
      </div>
      
      <div className="card-content">
        <div className="card-title" title={item.title}>{item.title}</div>
        <button 
          className="btn-delete"
          onClick={() => onDelete(item.id)}
        >
           <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
}

// --- Main Application Component ---
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
      // Touch sensor now works immediately because we are using a drag handle
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  );

  useEffect(() => {
    const savedData = localStorage.getItem('my-image-gallery');
    const savedTitle = localStorage.getItem('my-page-title');
    if (savedTitle) setHeaderTitle(savedTitle);
    if (savedData) {
      setItems(JSON.parse(savedData));
    } else {
      setItems([
        { id: '1', title: 'Short Overview', imageUrl: 'https://images.unsplash.com/photo-1559627756-c73e16b9d621?w=500&q=80', order: 0 },
        { id: '2', title: 'The Greatest Economic Story', imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&q=80', order: 1 },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('my-image-gallery', JSON.stringify(items));
    localStorage.setItem('my-page-title', headerTitle);
  }, [items, headerTitle]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this image?")) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleEditTitle = () => {
    const newTitle = prompt("Enter new Page Title:", headerTitle);
    if (newTitle && newTitle.trim() !== "") setHeaderTitle(newTitle);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setTitleInput('');
    setUrlInput('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setTitleInput(item.title);
    setUrlInput(item.imageUrl);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setErrorMsg('');
    if (!titleInput.trim() || !urlInput.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    
    // Duplicate Check
    const isDuplicate = items.some(item => 
      item.imageUrl === urlInput && 
      (!editingItem || item.id !== editingItem.id)
    );
    if (isDuplicate) {
      setErrorMsg("Duplicate image URL.");
      return;
    }

    if (editingItem) {
      const updatedItems = items.map(item => {
        if (item.id === editingItem.id) return { ...item, title: titleInput, imageUrl: urlInput };
        return item;
      });
      setItems(updatedItems);
    } else {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9), 
        title: titleInput,
        imageUrl: urlInput,
        order: items.length,
        createdAt: Date.now()
      };
      setItems([...items, newItem]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>{headerTitle}</h1>
        <div className="header-buttons">
          <button className="btn btn-outline" onClick={handleEditTitle}>Edit Title</button>
          <button className="btn btn-primary" onClick={openAddModal}><Plus size={18} /> Add Video</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>No images found</h3>
          <p>Click "Add Video" to create your first card.</p>
        </div>
      ) : (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={rectSortingStrategy}>
            <div className="grid-container">
              {items.map((item) => (
                <SortableItem 
                  key={item.id} 
                  id={item.id} 
                  item={item} 
                  onEdit={openEditModal} 
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? "Edit Image" : "Add New Image"}</h2>
            {errorMsg && <div className="error-banner">{errorMsg}</div>}
            
            <div className="modal-body">
              <div className="modal-form">
                <div className="input-group">
                  <label>Title</label>
                  <input value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder="Title"/>
                </div>
                <div className="input-group">
                  <label>Image URL</label>
                  <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..."/>
                </div>
              </div>
              
              <div className="preview-section">
                <label>Preview</label>
                <div className="preview-box">
                  {urlInput ? (
                    <img src={urlInput} alt="Preview" onError={(e) => {e.target.style.display='none'}}/>
                  ) : <span>No Image</span>}
                </div>
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