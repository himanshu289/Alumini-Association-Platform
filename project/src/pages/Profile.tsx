import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaSave } from 'react-icons/fa';

interface EmploymentHistory {
  companyName: string;
  role: string;
  companyLocation: string;
  durationFrom: string;
  durationTo: string | null;
}

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    profileImage: '',
    engineeringType: '',
    passoutYear: '',
    email: '',
    linkedin: '',
    employmentHistory: [] as EmploymentHistory[],
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const email = localStorage.getItem('email');
      if (!email) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('/api/profile', {
          headers: {
            email: email,
          },
        });
        if (response.ok) {
          const data = await response.json();
          // Format dates in employment history
          const formattedEmploymentHistory = (data.employmentHistory || []).map((emp: EmploymentHistory) => ({
            ...emp,
            durationFrom: emp.durationFrom ? new Date(emp.durationFrom).toISOString().split('T')[0] : '',
            durationTo: emp.durationTo ? new Date(emp.durationTo).toISOString().split('T')[0] : null,
          }));
          
          setProfile({
            ...data,
            employmentHistory: formattedEmploymentHistory,
          });
        } else {
          setMessage('Failed to fetch profile');
        }
      } catch (error) {
        console.error('Fetch profile error:', error);
        setMessage('Error fetching profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmploymentChange = (index: number, field: keyof EmploymentHistory, value: string) => {
    setProfile((prev) => ({
      ...prev,
      employmentHistory: prev.employmentHistory.map((emp, i) =>
        i === index ? { ...emp, [field]: value } : emp
      ),
    }));
  };

  const addEmployment = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    setProfile((prev) => ({
      ...prev,
      employmentHistory: [
        {
          companyName: '',
          role: '',
          companyLocation: '',
          durationFrom: currentDate,
          durationTo: null,
        },
        ...prev.employmentHistory,
      ],
    }));
  };

  // Sort employment history by dates
  const sortedEmploymentHistory = [...profile.employmentHistory].sort((a, b) => {
    const dateA = new Date(a.durationFrom);
    const dateB = new Date(b.durationFrom);
    return dateB.getTime() - dateA.getTime(); // Sort in descending order (latest first)
  });

  const removeEmployment = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      employmentHistory: prev.employmentHistory.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const email = localStorage.getItem('email');
    if (!email) {
      navigate('/login');
      return;
    }

    // Validate employment history
    const hasInvalidEmployment = profile.employmentHistory.some(emp => {
      if (!emp.companyName || !emp.role || !emp.companyLocation || !emp.durationFrom) {
        return true;
      }
      return false;
    });

    if (hasInvalidEmployment) {
      setMessage('Please fill in all required fields for each employment experience');
      return;
    }

    try {
      // Format dates before sending to server
      const formattedProfile = {
        ...profile,
        employmentHistory: profile.employmentHistory.map(emp => ({
          ...emp,
          durationFrom: emp.durationFrom ? new Date(emp.durationFrom).toISOString() : null,
          durationTo: emp.durationTo ? new Date(emp.durationTo).toISOString() : null,
        })),
      };

      const response = await fetch('/api/update_profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          email: email,
        },
        body: JSON.stringify(formattedProfile),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Profile updated successfully');
        setIsEditing(false);
        // Refresh profile data
        const fetchResponse = await fetch('/api/profile', {
          headers: {
            email: email,
          },
        });
        if (fetchResponse.ok) {
          const profileData = await fetchResponse.json();
          // Format dates in employment history
          const formattedEmploymentHistory = (profileData.employmentHistory || []).map((emp: EmploymentHistory) => ({
            ...emp,
            durationFrom: emp.durationFrom ? new Date(emp.durationFrom).toISOString().split('T')[0] : '',
            durationTo: emp.durationTo ? new Date(emp.durationTo).toISOString().split('T')[0] : null,
          }));
          
          setProfile({
            ...profileData,
            employmentHistory: formattedEmploymentHistory,
          });
        }
      } else {
        setMessage(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage('Error updating profile');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          {!isEditing ? (
            <button
              onClick={toggleEditMode}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <FaEdit className="mr-2" />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center text-green-600 hover:text-green-800"
            >
              <FaSave className="mr-2" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Alumni Profile</h1>
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div>
                {profile.profileImage && (
                  <img src={profile.profileImage} alt="Profile" className="w-24 h-24 rounded-full mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-gray-600"
                  aria-label="Profile Image"
                />
              </div>
              <input
                type="text"
                name="engineeringType"
                value={profile.engineeringType}
                onChange={handleChange}
                placeholder="Engineering Type"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                name="passoutYear"
                value={profile.passoutYear}
                onChange={handleChange}
                placeholder="Passout Year"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                name="linkedin"
                value={profile.linkedin}
                onChange={handleChange}
                placeholder="LinkedIn Profile"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Employment History Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-700">Employment History</h2>
                  <button
                    type="button"
                    onClick={addEmployment}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Experience
                  </button>
                </div>
                
                {sortedEmploymentHistory.map((emp, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-700">Experience {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeEmployment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={emp.companyName}
                      onChange={(e) => handleEmploymentChange(index, 'companyName', e.target.value)}
                      placeholder="Company Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      value={emp.role}
                      onChange={(e) => handleEmploymentChange(index, 'role', e.target.value)}
                      placeholder="Role"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      value={emp.companyLocation}
                      onChange={(e) => handleEmploymentChange(index, 'companyLocation', e.target.value)}
                      placeholder="Company Location"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="date"
                        value={emp.durationFrom}
                        onChange={(e) => handleEmploymentChange(index, 'durationFrom', e.target.value)}
                        placeholder="Start Date"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <input
                        type="date"
                        value={emp.durationTo || ''}
                        onChange={(e) => handleEmploymentChange(index, 'durationTo', e.target.value)}
                        placeholder="End Date (Leave empty for current position)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                {profile.profileImage && (
                  <img src={profile.profileImage} alt="Profile" className="w-24 h-24 rounded-full" />
                )}
                <div>
                  <h2 className="text-2xl font-semibold">{profile.name}</h2>
                  <p className="text-gray-600">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-gray-500 text-sm">Engineering Type</h3>
                  <p className="font-medium">{profile.engineeringType}</p>
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Passout Year</h3>
                  <p className="font-medium">{profile.passoutYear}</p>
                </div>
              </div>

              {profile.linkedin && (
                <div>
                  <h3 className="text-gray-500 text-sm">LinkedIn</h3>
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {profile.linkedin}
                  </a>
                </div>
              )}

              {/* Employment History */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Employment History</h2>
                <div className="space-y-4">
                  {sortedEmploymentHistory.map((emp, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold">{emp.companyName}</h3>
                      <p className="text-gray-600">{emp.role}</p>
                      <p className="text-gray-500">{emp.companyLocation}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(emp.durationFrom).toLocaleDateString()} - 
                        {emp.durationTo ? new Date(emp.durationTo).toLocaleDateString() : 'Present'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={`mt-4 text-center ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;