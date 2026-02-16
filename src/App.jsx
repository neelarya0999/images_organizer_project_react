import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  MouseSensor,
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
import { Trash2, Edit2, Plus, ExternalLink } from 'lucide-react'; 
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
    cursor: 'grab'
  };

  const handleImageClick = (e) => {
    // Stop the drag event from triggering
    e.stopPropagation();
    window.open(item.imageUrl, '_blank');
  };

  return (
    <div ref={setNodeRef} style={style} className="card">
      <div className="card-image-container" {...attributes} {...listeners}>
        <img 
          src={item.imageUrl} 
          alt={item.title} 
          className="card-img"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Error'; }} 
        />
        
        {/* Overlay with Actions */}
        <div className="edit-overlay">
          {/* Open Link Button */}
          <button 
             className="btn-icon-overlay"
             onPointerDown={(e) => e.stopPropagation()}
             onClick={handleImageClick}
             title="Open Image"
          >
            <ExternalLink size={16} color="white"/>
          </button>

          {/* Edit Button */}
          <button 
            className="btn-edit-overlay"
            onPointerDown={(e) => e.stopPropagation()} 
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
          onPointerDown={(e) => e.stopPropagation()} 
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
  const [headerTitle, setHeaderTitle] = useState("Business Overview"); // State for Page Title
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState(''); // State for validation errors

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, 
      },
    })
  );

  // Load from Local Storage
  useEffect(() => {
    const savedData = localStorage.getItem('my-image-gallery');
    const savedTitle = localStorage.getItem('my-page-title'); // Restore title
    
    if (savedTitle) setHeaderTitle(savedTitle);

    if (savedData) {
      setItems(JSON.parse(savedData));
    } else {
      setItems([
        { id: '1', title: 'Short Overview', imageUrl: 'https://images.unsplash.com/photo-1559627756-c73e16b9d621?w=500&q=80', order: 0 },
        { id: '2', title: 'The Greatest Economic Story', imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&q=80', order: 1 },
        { id: '3', title: 'Full Overview', imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&q=80', order: 2 },
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
    if (newTitle && newTitle.trim() !== "") {
      setHeaderTitle(newTitle);
    }
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

  // --- Validation Logic ---
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSave = () => {
    setErrorMsg('');

    // 1. Basic Empty Check
    if (!titleInput.trim() || !urlInput.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    // 2. Valid URL Check
    if (!isValidUrl(urlInput)) {
      setErrorMsg("Please enter a valid URL (e.g., https://...)");
      return;
    }

    // 3. Duplicate URL Check (Skip if we are editing the same item)
    const isDuplicate = items.some(item => 
      item.imageUrl === urlInput && 
      (!editingItem || item.id !== editingItem.id)
    );

    if (isDuplicate) {
      setErrorMsg("This image URL already exists in your list.");
      return;
    }

    if (editingItem) {
      const updatedItems = items.map(item => {
        if (item.id === editingItem.id) {
          return { ...item, title: titleInput, imageUrl: urlInput };
        }
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
          <button className="btn btn-outline" onClick={handleEditTitle}>
             Edit Title
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Video
          </button>
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
            
            {/* Error Message Display */}
            {errorMsg && <div className="error-banner">{errorMsg}</div>}

            <div className="modal-body">
              <div className="modal-form">
                <div className="input-group">
                  <label>Title</label>
                  <input 
                    value={titleInput} 
                    onChange={(e) => setTitleInput(e.target.value)} 
                    placeholder="Enter image title"
                  />
                </div>
                
                <div className="input-group">
                  <label>Image URL</label>
                  <input 
                    value={urlInput} 
                    onChange={(e) => setUrlInput(e.target.value)} 
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              {/* LIVE PREVIEW SECTION */}
              <div className="preview-section">
                <label>Preview</label>
                <div className="preview-box">
                  {urlInput ? (
                    <img 
                      src={urlInput} 
                      alt="Preview" 
                      onError={(e) => {e.target.style.display='none'}}
                      onLoad={(e) => {e.target.style.display='block'}}
                    />
                  ) : (
                    <span style={{color: '#555', fontSize: '12px'}}>Image preview will appear here</span>
                  )}
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