import { useState, useEffect } from "react";
import { Search, MapPin, Building2, Mail, Linkedin, Download, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx"; // Import xlsx for Excel file generation
import { useNavigate } from "react-router-dom";

interface Alumni {
  _id: string;
  name: string;
  profileImage: string;
  engineeringType: string;
  passoutYear: number;
  email: string;
  linkedin?: string;
  employmentHistory: {
    companyName: string;
    role: string;
    companyLocation: string;
    durationFrom: string;
    durationTo: string | null;
  }[];
}

interface FilterOptions {
  name: string;
  passoutYear: string;
  engineeringType: string;
  companyName: string;
  location: string;
  role: string;
}

export default function AlumniDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [alumniData, setAlumniData] = useState<Alumni[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    name: "",
    passoutYear: "all",
    engineeringType: "all",
    companyName: "",
    location: "",
    role: "",
  });
  const [uniqueEngineeringTypes, setUniqueEngineeringTypes] = useState<string[]>([]);
  const navigate = useNavigate();
  const alumniPerPage = 6;

  // Fetch unique engineering types
  useEffect(() => {
    const fetchEngineeringTypes = async () => {
      try {
        const response = await fetch('/api/get_alumni');
        const data = await response.json();
        const types = [...new Set(data.map((alumni: Alumni) => alumni.engineeringType))];
        setUniqueEngineeringTypes(types);
      } catch (error) {
        console.error('Error fetching engineering types:', error);
      }
    };
    fetchEngineeringTypes();
  }, []);

  useEffect(() => {
    // Fetch user role from localStorage
    const role = localStorage.getItem("role") || "";
    setUserRole(role);

    const fetchAlumni = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: alumniPerPage.toString(),
          search: searchTerm,
          year: selectedYear,
          ...filters,
        });

        const response = await fetch(
          `/api/get_alumni_paginated?${queryParams}`,
          { credentials: "include" } // Include credentials for authentication
        );
        const data = await response.json();

        if (response.ok) {
          setAlumniData(data.alumni);
          setTotalPages(data.pages);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Error fetching alumni:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, [currentPage, searchTerm, selectedYear, filters]);

  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  const goToPage = (page: number) => setCurrentPage(page);

  const handleDownloadAlumni = async () => {
    try {
      // Fetch all alumni data without pagination for download
      const response = await fetch("/api/get_alumni", { credentials: "include" });
      const data = await response.json();

      if (response.ok) {
        const worksheetData = data.map((alumni: Alumni) => ({
          Name: alumni.name,
          "Engineering Type": alumni.engineeringType,
          "Passout Year": alumni.passoutYear,
          Role: alumni.employmentHistory[0]?.role || "N/A",
          "Company Name": alumni.employmentHistory[0]?.companyName || "N/A",
          "Company Location": alumni.employmentHistory[0]?.companyLocation || "N/A",
          Email: alumni.email,
          "LinkedIn": alumni.linkedin || "N/A",
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Alumni");
        XLSX.writeFile(workbook, "Alumni_List.xlsx");
      } else {
        console.error("Failed to fetch all alumni:", data.message);
      }
    } catch (error) {
      console.error("Error downloading alumni:", error);
    }
  };

  const handleAlumniClick = (alumniId: string) => {
    navigate(`/profile/${alumniId}`);
  };

  // Get latest experience for an alumni
  const getLatestExperience = (alumni: Alumni) => {
    if (!alumni.employmentHistory || alumni.employmentHistory.length === 0) {
      return null;
    }
    return alumni.employmentHistory[0]; // Already sorted by date in backend
  };

  const handleFilterChange = (field: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      passoutYear: "all",
      engineeringType: "all",
      companyName: "",
      location: "",
      role: "",
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <motion.h1
            className="text-4xl font-bold text-center text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Alumni Directory
          </motion.h1>
          <div className="flex gap-4">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </motion.button>
            {userRole === "faculty" && (
              <motion.button
                onClick={handleDownloadAlumni}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="h-5 w-5 mr-2" />
                Download Alumni
              </motion.button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-8"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Filter Options</h2>
              <button
                onClick={clearFilters}
                className="flex items-center text-red-600 hover:text-red-700"
              >
                <X className="h-5 w-5 mr-1" />
                Clear Filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Filter by name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passout Year</label>
                <select
                  value={filters.passoutYear}
                  onChange={(e) => handleFilterChange('passoutYear', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Years</option>
                  {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => 2000 + i)
                    .reverse()
                    .map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engineering Type</label>
                <select
                  value={filters.engineeringType}
                  onChange={(e) => handleFilterChange('engineeringType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Types</option>
                  {uniqueEngineeringTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={filters.companyName}
                  onChange={(e) => handleFilterChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Filter by company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Filter by location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Filter by role"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-12">
          <motion.div
            className="relative w-full sm:w-2/3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name or course..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-full shadow-md border-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </motion.div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-gray-600 animate-pulse">
            Loading alumni...
          </div>
        )}

        {/* Alumni Grid */}
        {!loading && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {alumniData.map((alumni) => {
              const latestExperience = getLatestExperience(alumni);
              return (
                <motion.div
                  key={alumni._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-500 transform transition-all duration-300 hover:shadow-2xl cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  onClick={() => handleAlumniClick(alumni._id)}
                >
                  <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                    <img
                      src={alumni.profileImage}
                      alt={alumni.name}
                      className="h-24 w-24 rounded-full object-cover border-4 border-white mx-auto transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 text-center">
                      {alumni.name}
                    </h3>
                    <p className="text-sm text-gray-600 text-center mt-1">
                      {alumni.engineeringType} • {alumni.passoutYear}
                    </p>
                    {latestExperience && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-center text-sm text-gray-700">
                          <Building2 className="h-5 w-5 mr-2 text-indigo-500" />
                          <span>
                            {latestExperience.role} at {latestExperience.companyName}
                          </span>
                        </div>
                        <div className="flex items-center justify-center text-sm text-gray-700">
                          <MapPin className="h-5 w-5 mr-2 text-indigo-500" />
                          <span>{latestExperience.companyLocation}</span>
                        </div>
                      </div>
                    )}
                    <div className="mt-6 flex justify-center gap-4">
                      <motion.a
                        href={`mailto:${alumni.email}`}
                        className="p-2 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors duration-300"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking email
                      >
                        <Mail className="h-5 w-5" />
                      </motion.a>
                      {alumni.linkedin && (
                        <motion.a
                          href={alumni.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors duration-300"
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking LinkedIn
                        >
                          <Linkedin className="h-5 w-5" />
                        </motion.a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <motion.button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white rounded-full shadow-md text-gray-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Previous
            </motion.button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <motion.button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-4 py-2 rounded-full shadow-md transition-all duration-300 ${
                    currentPage === page
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 hover:bg-indigo-50"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {page}
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white rounded-full shadow-md text-gray-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
            </motion.button>
          </div>
        )}

        {/* No Results */}
        {!loading && alumniData.length === 0 && (
          <motion.div
            className="mt-12 text-center text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            No alumni found matching your criteria.
          </motion.div>
        )}
      </div>
    </div>
  );
}