import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, MapPin, Users, PlusCircle, Edit2, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';

// Cursor styles
const cursorStyles = `
  .cursor-tracker {
    position: fixed;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.3);
    pointer-events: none;
    z-index: 9999;
    transition: transform 0.1s ease-out;
  }
  
  .cursor-tracker.hover {
    transform: scale(1.5);
    background: rgba(99, 102, 241, 0.5);
  }
`;

type Event = {
  _id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  type: 'reunion' | 'workshop' | 'networking' | 'other';
  image: string;
  createdBy: string;
};

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    date: '',
    location: '',
    description: '',
    type: 'other',
    image: '',
    createdBy: 'faculty'
  });
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [, setIsHovering] = useState(false);

  axios.defaults.baseURL = 'http://localhost:5000';

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = cursorStyles;
    document.head.appendChild(styleSheet);

    const cursor = document.createElement('div');
    cursor.classList.add('cursor-tracker');
    document.body.appendChild(cursor);

    const moveCursor = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX - 10}px`;
      cursor.style.top = `${e.clientY - 10}px`;
    };

    const handleMouseEnter = () => {
      cursor.classList.add('hover');
      setIsHovering(true);
    };
    
    const handleMouseLeave = () => {
      cursor.classList.remove('hover');
      setIsHovering(false);
    };

    window.addEventListener('mousemove', moveCursor);

    const interactiveElements = document.querySelectorAll('button, input, select, textarea');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    });

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') || '';
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    fetchEvents();

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
      document.body.removeChild(cursor);
      document.head.removeChild(styleSheet);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/get_events');
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = { ...newEvent, createdBy: userRole === 'faculty' ? 'faculty' : 'user' };
      await axios.post('/api/post_events', eventData);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      await axios.put(`/api/edit_event/${editingEvent._id}`, editingEvent);
      setEditingEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Failed to edit event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`/api/delete_event/${eventId}`);
        fetchEvents();
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const startEditing = (event: Event) => {
    setEditingEvent(event);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      date: '',
      location: '',
      description: '',
      type: 'other',
      image: '',
      createdBy: 'faculty'
    });
    setShowAddForm(false);
    setEditingEvent(null);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reunion': return 'bg-purple-100 text-purple-800';
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'networking': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-white-50 to-gray-100 p-6 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
          <motion.h1
            className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 120 }}
          >
            Upcoming Events
          </motion.h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>

            
            {(userRole === 'alumni' || userRole === 'faculty') && isLoggedIn && !editingEvent && (
              <motion.button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                {showAddForm ? 'Cancel' : 'Add Event'}
              </motion.button>
            )}
          </div>
        </div>

        {(showAddForm || editingEvent) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => resetForm()}
            />
            
            {/* Centered Form */}
            <motion.div 
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 m-4 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -50 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h2>
              <form onSubmit={editingEvent ? handleEditEvent : handleAddEvent} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="Event Title"
                      value={editingEvent ? editingEvent.title : newEvent.title || ''}
                      onChange={(e) => {
                        if (editingEvent) setEditingEvent({ ...editingEvent, title: e.target.value });
                        else setNewEvent({ ...newEvent, title: e.target.value });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={editingEvent ? editingEvent.date.split('T')[0] : newEvent.date || ''}
                      onChange={(e) => {
                        if (editingEvent) setEditingEvent({ ...editingEvent, date: e.target.value });
                        else setNewEvent({ ...newEvent, date: e.target.value });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="Location"
                      value={editingEvent ? editingEvent.location : newEvent.location || ''}
                      onChange={(e) => {
                        if (editingEvent) setEditingEvent({ ...editingEvent, location: e.target.value });
                        else setNewEvent({ ...newEvent, location: e.target.value });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={editingEvent ? editingEvent.type : newEvent.type || 'other'}
                      onChange={(e) => {
                        if (editingEvent) setEditingEvent({ ...editingEvent, type: e.target.value as Event['type'] });
                        else setNewEvent({ ...newEvent, type: e.target.value as Event['type'] });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="reunion">Reunion</option>
                      <option value="workshop">Workshop</option>
                      <option value="networking">Networking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={editingEvent ? editingEvent.image : newEvent.image || ''}
                      onChange={(e) => {
                        if (editingEvent) setEditingEvent({ ...editingEvent, image: e.target.value });
                        else setNewEvent({ ...newEvent, image: e.target.value });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Event Description"
                    value={editingEvent ? editingEvent.description : newEvent.description || ''}
                    onChange={(e) => {
                      if (editingEvent) setEditingEvent({ ...editingEvent, description: e.target.value });
                      else setNewEvent({ ...newEvent, description: e.target.value });
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-32 transition-all"
                    required
                  />
                </div>
                <div className="flex gap-4 justify-end">
                  <motion.button
                    type="button"
                    onClick={() => resetForm()}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="px-4 py-2 text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 transition-all"
                    whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {editingEvent ? 'Save Changes' : 'Add Event'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <motion.div
              key={event._id}
              className="bg-white rounded-2xl border-2 border-purple-500 shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              {event.image && (
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-56 object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => (e.target as HTMLImageElement).src = '/placeholder-image.jpg'}
                />
              )}
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{event.title}</h3>
                  {/* Allow both alumni and faculty to edit/delete their own events */}
                  {(userRole === 'faculty' || (userRole === 'alumni' && event.createdBy === userRole)) && isLoggedIn && (
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => startEditing(event)}
                        className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                        whileHover={{ rotate: 90 }}
                      >
                        <Edit2 className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                        whileHover={{ rotate: 90 }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </motion.button>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-5 w-5 mr-2 text-indigo-500" />
                    {event.location}
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="h-5 w-5 mr-2 text-indigo-500" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-gray-600 text-sm line-clamp-2">{event.description}</p>
              </div>
            </motion.div>
          ))}
          {filteredEvents.length === 0 && (
            <p className="text-center text-gray-500 col-span-full">No events found matching your search.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}