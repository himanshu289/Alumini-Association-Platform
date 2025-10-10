import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaGraduationCap, FaBriefcase, FaEnvelope, FaLinkedin, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface EmploymentHistory {
  companyName: string;
  role: string;
  companyLocation: string;
  durationFrom: string;
  durationTo: string | null;
  description?: string;
}

interface AlumniProfile {
  _id: string;
  name: string;
  profileImage: string;
  engineeringType: string;
  passoutYear: string;
  email: string;
  linkedin: string;
  employmentHistory: EmploymentHistory[];
}

export default function ViewAlumniProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEducationOpen, setIsEducationOpen] = useState(true);
  const [expandedJobIndex, setExpandedJobIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/view_alumni_profile/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const toggleEducation = () => {
    setIsEducationOpen(!isEducationOpen);
  };

  const toggleJobExpansion = (index: number) => {
    setExpandedJobIndex(expandedJobIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Profile not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 left-0 w-full bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md p-4 z-10">
        <div className="max-w-6xl mx-auto flex items-center">
          <motion.button
            onClick={handleBack}
            className="flex items-center bg-white text-indigo-600 px-4 py-2 rounded-full shadow hover:bg-indigo-50 transition"
            whileHover={{ x: -4 }}
          >
            <FaArrowLeft className="mr-2" />
            Back to Directory
          </motion.button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto pt-24 pb-8 px-4">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
        >
          <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-blue-500">
            <div className="absolute -bottom-16 left-6">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                {profile.profileImage ? (
                  <img 
                    src={profile.profileImage} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-20 px-6 pb-6">
            <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                {profile.engineeringType}
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Class of {profile.passoutYear}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-6">
              <motion.a
                href={`mailto:${profile.email}`}
                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                whileHover={{ scale: 1.05 }}
              >
                <FaEnvelope className="mr-2" />
                Contact
              </motion.a>
              {profile.linkedin && (
                <motion.a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  whileHover={{ scale: 1.05 }}
                >
                  <FaLinkedin className="mr-2" />
                  LinkedIn
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Education Section */}
        <motion.div 
          className="mt-8 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={toggleEducation}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
          >
            <div className="flex items-center">
              <FaGraduationCap className="mr-3 text-indigo-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-800">Education</h2>
            </div>
            {isEducationOpen ? <FaChevronUp className="text-indigo-600" /> : <FaChevronDown className="text-indigo-600" />}
          </button>
          
          {isEducationOpen && (
            <div className="px-4 pb-4">
              <div className="pl-11">
                <h3 className="font-medium text-gray-900">{profile.engineeringType}</h3>
                <p className="text-gray-600">Graduated in {profile.passoutYear}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Employment History */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <FaBriefcase className="mr-3 text-indigo-600 text-xl" />
            Professional Experience
          </h2>
          
          <div className="space-y-4">
            {profile.employmentHistory.map((emp, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition"
                whileHover={{ y: -2 }}
              >
                <button
                  onClick={() => toggleJobExpansion(index)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-indigo-600">{emp.role}</h3>
                      <p className="text-gray-700">{emp.companyName}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span className="mr-2">{emp.companyLocation}</span>
                        <span>•</span>
                        <span className="ml-2">
                          {new Date(emp.durationFrom).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })} - 
                          {emp.durationTo ? 
                            new Date(emp.durationTo).toLocaleDateString('en-US', { 
                              month: 'short', 
                              year: 'numeric' 
                            }) : 
                            'Present'}
                        </span>
                      </div>
                    </div>
                    {expandedJobIndex === index ? (
                      <FaChevronUp className="text-indigo-600 mt-1" />
                    ) : (
                      <FaChevronDown className="text-indigo-600 mt-1" />
                    )}
                  </div>
                </button>
                
                {expandedJobIndex === index && (
                  <div className="px-4 pb-4">
                    {emp.description && (
                      <p className="text-gray-600 mt-2">{emp.description}</p>
                    )}
                    <div className="mt-3">
                      <a 
                        href={`mailto:${profile.email}?subject=Regarding your position at ${emp.companyName}`}
                        className="inline-block bg-indigo-50 text-indigo-600 px-3 py-1 rounded text-sm hover:bg-indigo-100"
                      >
                        Contact about this role
                      </a>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}