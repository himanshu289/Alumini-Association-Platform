import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, MapPin, Building2, Clock, Briefcase, PlusCircle, Edit2, Trash2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

const cursorStyles = `
  .cursor-tracker {
    position: fixed;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(79, 70, 229, 0.3);
    pointer-events: none;
    z-index: 9999;
    transition: transform 0.1s ease-out;
  }
  
  .cursor-tracker.hover {
    transform: scale(1.5);
    background: rgba(79, 70, 229, 0.5);
  }
`;

type Job = {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  postedBy: string;
  postedDate: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  postedByRole: 'alumni' | 'faculty';
  registerLink?: string;
};

export default function JobPortal() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: [],
    type: 'full-time',
    registerLink: '',
  });
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
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
    interactiveElements.forEach((element) => {
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
    fetchJobs();

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      interactiveElements.forEach((element) => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
      document.body.removeChild(cursor);
      document.head.removeChild(styleSheet);
    };
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/get_jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const jobData = {
        ...newJob,
        postedBy: localStorage.getItem('name') || 'Anonymous',
        postedByRole: userRole,
        postedDate: new Date().toISOString(),
        requirements: newJob.requirements?.length ? newJob.requirements : ['No specific requirements'],
      };
      await axios.post('/api/add_jobs', jobData);
      resetForm();
      fetchJobs();
    } catch (error) {
      console.error('Failed to add job:', error);
    }
  };

  const handleEditJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    try {
      await axios.put(`/api/update_jobs/${editingJob._id}`, editingJob);
      setEditingJob(null);
      fetchJobs();
    } catch (error) {
      console.error('Failed to edit job:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await axios.delete(`/api/delete_jobs/${jobId}`);
        fetchJobs();
      } catch (error) {
        console.error('Failed to delete job:', error);
      }
    }
  };

  const handleDownloadJobs = () => {
    const worksheetData = jobs.map(job => ({
      'Job Title': job.title,
      'Company': job.company,
      'Location': job.location,
      'Description': job.description,
      'Requirements': job.requirements.join(', '),
      'Type': job.type,
      'Posted By': job.postedBy,
      'Posted Date': new Date(job.postedDate).toLocaleDateString(),
      'Posted By Role': job.postedByRole,
      'Register Link': job.registerLink || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs');
    XLSX.writeFile(workbook, 'Job_List.xlsx');
  };

  const startEditing = (job: Job) => {
    setEditingJob(job);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setNewJob({
      title: '',
      company: '',
      location: '',
      description: '',
      requirements: [],
      type: 'full-time',
      registerLink: '',
    });
    setShowAddForm(false);
    setEditingJob(null);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || job.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div className="p-6 min-h-screen bg-white-100 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <motion.h1
            className="text-3xl font-bold text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Job Portal
          </motion.h1>
          <div className="flex gap-4">
            {(userRole === 'alumni' || userRole === 'faculty') && isLoggedIn && !editingJob && (
              <motion.button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                whileHover={{ scale: 1.05 }}
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                {showAddForm ? 'Cancel' : 'Add Job'}
              </motion.button>
            )}
            {userRole === 'faculty' && isLoggedIn && (
              <motion.button
                onClick={handleDownloadJobs}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                whileHover={{ scale: 1.05 }}
              >
                <Download className="h-5 w-5 mr-2" />
                Download Jobs
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="relative w-full sm:w-2/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by title or company..."
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        {(showAddForm || editingJob) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => resetForm()}
            />
            <motion.div
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 m-4 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -50 }}
            >
              <h2 className="text-xl font-semibold mb-4">
                {editingJob ? 'Edit Job' : 'Add New Job'}
              </h2>
              <form onSubmit={editingJob ? handleEditJob : handleAddJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={editingJob ? editingJob.title : newJob.title || ''}
                    onChange={(e) =>
                      editingJob
                        ? setEditingJob({ ...editingJob, title: e.target.value })
                        : setNewJob({ ...newJob, title: e.target.value })
                    }
                    className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={editingJob ? editingJob.company : newJob.company || ''}
                    onChange={(e) =>
                      editingJob
                        ? setEditingJob({ ...editingJob, company: e.target.value })
                        : setNewJob({ ...newJob, company: e.target.value })
                    }
                    className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={editingJob ? editingJob.location : newJob.location || ''}
                    onChange={(e) =>
                      editingJob
                        ? setEditingJob({ ...editingJob, location: e.target.value })
                        : setNewJob({ ...newJob, location: e.target.value })
                    }
                    className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <select
                    value={editingJob ? editingJob.type : newJob.type || 'full-time'}
                    onChange={(e) =>
                      editingJob
                        ? setEditingJob({ ...editingJob, type: e.target.value as Job['type'] })
                        : setNewJob({ ...newJob, type: e.target.value as Job['type'] })
                    }
                    className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <textarea
                  placeholder="Description"
                  value={editingJob ? editingJob.description : newJob.description || ''}
                  onChange={(e) =>
                    editingJob
                      ? setEditingJob({ ...editingJob, description: e.target.value })
                      : setNewJob({ ...newJob, description: e.target.value })
                  }
                  className="p-2 border rounded-lg w-full h-24 focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <textarea
                  placeholder="Requirements (comma-separated)"
                  value={
                    editingJob
                      ? editingJob.requirements.join(', ')
                      : newJob.requirements?.join(', ') || ''
                  }
                  onChange={(e) => {
                    const reqs = e.target.value.split(',').map((r) => r.trim());
                    editingJob
                      ? setEditingJob({ ...editingJob, requirements: reqs })
                      : setNewJob({ ...newJob, requirements: reqs });
                  }}
                  className="p-2 border rounded-lg w-full h-24 focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="url"
                  placeholder="Register Link (optional)"
                  value={editingJob ? editingJob.registerLink || '' : newJob.registerLink || ''}
                  onChange={(e) =>
                    editingJob
                      ? setEditingJob({ ...editingJob, registerLink: e.target.value })
                      : setNewJob({ ...newJob, registerLink: e.target.value })
                  }
                  className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => resetForm()}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingJob ? 'Save Changes' : 'Add Job'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <motion.div
              key={job._id}
              className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-purple-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white flex justify-between items-center">
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <span className="flex items-center px-3 py-1 rounded-full text-sm bg-white/20">
                  <Briefcase className="h-4 w-4 mr-1" />
                  {job.type}
                </span>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="mt-1 flex items-center text-sm text-gray-700">
                      <Building2 className="h-4 w-4 mr-1 text-indigo-500" />
                      {job.company}
                      <MapPin className="h-4 w-4 ml-4 mr-1 text-red-500" />
                      {job.location}
                    </div>
                  </div>
                  {userRole === job.postedByRole && isLoggedIn && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(job)}
                        className="p-2 text-gray-500 hover:text-indigo-600"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        className="p-2 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-gray-600">{job.description}</p>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Requirements:</h4>
                  <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1 inline text-blue-500" />
                    Posted on {new Date(job.postedDate).toLocaleDateString()} by {job.postedBy} (
                    {job.postedByRole})
                  </div>
                  {job.registerLink ? (
                    <a
                      href={job.registerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Register
                    </a>
                  ) : (
                    <button className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {filteredJobs.length === 0 && (
            <p className="text-center text-gray-500">No jobs found matching your criteria.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}