import { Link, useNavigate } from "react-router-dom";
import { Users, Briefcase, Calendar, Heart, User, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// Define interfaces (unchanged)
interface NewsItem {
  title: string;
  date: string;
  excerpt: string;
  link: string;
  image: string;
}

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
  profileImage: string;
}

interface Stat {
  icon: JSX.Element;
  value: string;
  label: string;
}

// Cursor styles (unchanged)
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

// Animation variants for scrolling
const scrollVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

// Background image URL
const BACKGROUND_IMAGE = "https://commencement.ucsc.edu/files/2025/01/05-14-24_Elia_Patty_Naranjo-Best_Grad_Photo_17-2.jpg";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [logoutMessage, setLogoutMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setIsHovering] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<Stat[]>([
    { icon: <Users className="h-8 w-8 text-indigo-600" />, value: "Loading...", label: "Alumni Connected" },
    { icon: <Calendar className="h-8 w-8 text-indigo-600" />, value: "Loading...", label: "Events Hosted" },
    { icon: <Briefcase className="h-8 w-8 text-indigo-600" />, value: "Loading...", label: "Jobs Posted" },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    // ... (unchanged useEffect logic remains the same)
    const styleSheet = document.createElement("style");
    styleSheet.textContent = cursorStyles;
    document.head.appendChild(styleSheet);

    const cursor = document.createElement("div");
    cursor.classList.add("cursor-tracker");
    document.body.appendChild(cursor);

    const moveCursor = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX - 10}px`;
      cursor.style.top = `${e.clientY - 10}px`;
    };

    const handleMouseEnter = () => {
      cursor.classList.add("hover");
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      cursor.classList.remove("hover");
      setIsHovering(false);
    };

    window.addEventListener("mousemove", moveCursor);

    const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
    interactiveElements.forEach((element) => {
      element.addEventListener("mouseenter", handleMouseEnter);
      element.addEventListener("mouseleave", handleMouseLeave);
    });

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") || "";
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
    } else {
      setIsLoggedIn(false);
      const timer = setTimeout(() => {
        navigate("/login");
      }, 15000);
      return () => clearTimeout(timer);
    }

    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/get_events", { method: "GET", credentials: "include" });
        const data = await response.json();
        const firstTwoEvents = data.slice(0, 2).map((event: any) => ({
          title: event.title,
          date: new Date(event.date).toLocaleDateString(),
          excerpt: event.description || "No description available",
          link: event.link || `/events/${event._id}`,
          image: event.image || "https://via.placeholder.com/300x200",
        }));
        setNews(firstTwoEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        setNews([
          { title: "Annual Alumni Gala 2025", date: "March 25, 2025", excerpt: "Join us for an evening of celebration and networking at our annual gala.", link: "/events/gala-2025", image: "https://via.placeholder.com/300x200" },
          { title: "New Mentorship Program Launched", date: "March 10, 2025", excerpt: "Our new program pairs alumni with current students for career guidance.", link: "/news/mentorship-launch", image: "https://via.placeholder.com/300x200" },
        ]);
      }
    };

    const fetchAlumni = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/get_alumni", { method: "GET", credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch alumni");
        const data = await response.json();
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selectedAlumni = shuffled.slice(0, 2).map((alumni: any) => ({
          name: alumni.name || "Anonymous Alumni",
          role: `Class of ${alumni.passoutYear || "Unknown"}`,
          quote: alumni.testimonial || "Great experience with Alumni Connect!",
          rating: Math.random() < 0.5 ? 4 : 5,
          profileImage: alumni.profileImage || "https://via.placeholder.com/150x100",
        }));
        setTestimonials(selectedAlumni);
      } catch (error) {
        console.error("Error fetching alumni:", error);
        setTestimonials([
          { name: "Jane Doe", role: "Class of 2015", quote: "Alumni Connect helped me land my dream job through its amazing network!", rating: 5, profileImage: "https://via.placeholder.com/150x100" },
          { name: "John Smith", role: "Class of 2010", quote: "Reconnecting with old classmates at events has been a highlight of my year.", rating: 4, profileImage: "https://via.placeholder.com/150x100" },
        ]);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/get_stats", { method: "GET", credentials: "include" });
        const data = await response.json();
        setStats([
          { icon: <Users className="h-8 w-8 text-indigo-600" />, value: data.totalAlumni.toString(), label: "Alumni Connected" },
          { icon: <Calendar className="h-8 w-8 text-indigo-600" />, value: data.totalEvents.toString(), label: "Events Hosted" },
          { icon: <Briefcase className="h-8 w-8 text-indigo-600" />, value: data.totalJobs.toString(), label: "Jobs Posted" },
        ]);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats([
          { icon: <Users className="h-8 w-8 text-indigo-600" />, value: "10,000+", label: "Alumni Connected" },
          { icon: <Calendar className="h-8 w-8 text-indigo-600" />, value: "50+", label: "Events Hosted" },
          { icon: <Briefcase className="h-8 w-8 text-indigo-600" />, value: "1,200+", label: "Jobs Posted" },
        ]);
      }
    };

    fetchEvents();
    fetchAlumni();
    fetchStats();

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      interactiveElements.forEach((element) => {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
      });
      document.body.removeChild(cursor);
      document.head.removeChild(styleSheet);
    };
  }, [navigate]);

  const handleLogout = () => {
    setIsLoading(true);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setUserRole("");
    setLogoutMessage("Logout successful");
    setTimeout(() => {
      setLogoutMessage("");
      setIsLoading(false);
    }, 3000);
  };

  const features = [
    { icon: <Users className="h-6 w-6" />, title: "Alumni Network", description: "Connect with fellow alumni and build meaningful professional relationships.", link: "/alumni" },
    { icon: <Briefcase className="h-6 w-6" />, title: "Job Opportunities", description: "Explore career opportunities or post jobs for fellow alumni.", link: "/jobs" },
    { icon: <Calendar className="h-6 w-6" />, title: "Events & Reunions", description: "Stay updated with upcoming events and alumni gatherings.", link: "/events" },
    { icon: <Heart className="h-6 w-6" />, title: "Give Back", description: "Support your alma mater through donations and mentorship.", link: "/donate" },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} transition={{ duration: 0.5 }} className="relative">
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative">
          <img className="w-full h-[500px] object-cover" src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80" alt="University campus" />
          <motion.div className="absolute inset-0 bg-indigo-700 mix-blend-multiply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <motion.h1 className="text-5xl font-extrabold text-white sm:text-6xl" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }}>
              Welcome to Alumni Connect
            </motion.h1>
            <motion.p className="mt-6 text-xl text-indigo-100 max-w-2xl" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.8 }}>
              Join our vibrant community of graduates, stay connected, and unlock opportunities for growth and collaboration.
            </motion.p>
            {isLoggedIn && userRole === "alumni" && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1 }} className="mt-8">
                <Link to="/profile">
                  <motion.div whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 300 }} className="text-white hover:text-indigo-300">
                    <User className="h-8 w-8" />
                  </motion.div>
                </Link>
              </motion.div>
            )}
            {!isLoggedIn ? (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1 }} className="mt-8">
                <Link to="/login" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Login
                </Link>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1 }} className="mt-8">
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? "cursor-not-allowed opacity-70" : "hover:bg-indigo-700 hover:text-white"}`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging out...
                    </>
                  ) : (
                    "Logout"
                  )}
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Logout Message */}
        {logoutMessage && (
          <motion.div className="fixed inset-0 flex items-center justify-center z-50" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.5 }}>
            <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg text-center">🎉 {logoutMessage} 🎉</div>
          </motion.div>
        )}

        {/* Mission Statement Section */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-100 rounded-lg"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Our Mission</h2>
          <p className="text-lg text-gray-700 text-center max-w-3xl mx-auto">
            At Alumni Connect, we strive to foster a lifelong connection between our graduates and their alma mater. Our goal is to empower alumni through networking, career development, and opportunities to give back, creating a thriving community that supports each other and the next generation of leaders.
          </p>
        </motion.div>

        {/* Background Image Section with Space */}
        <div
          className="relative h-[600px] bg-fixed bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${BACKGROUND_IMAGE})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30" /> {/* Optional overlay for better text readability */}
          <div className="relative flex items-center justify-center h-full">
            <motion.h2
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-white text-center"
            >
              Celebrating Our Graduates
            </motion.h2>
          </div>
        </div>

        {/* Features Section */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Explore Our Features</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)" }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-gray-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-black"
              >
                <Link to={feature.link} className="flex flex-col items-center text-center">
                  <div className="text-indigo-600 mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-indigo-50"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Impact</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4">{stat.icon}</div>
                <p className="text-4xl font-bold text-indigo-700">{stat.value}</p>
                <p className="mt-2 text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials Section */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What Our Alumni Say</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.3 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden relative hover:shadow-xl transition-shadow duration-300"
              >
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <div className="p-6 flex flex-col items-center">
                  <img src={testimonial.profileImage} alt={testimonial.name} className="w-40 h-40 object-cover rounded-full mb-4 border-4 border-purple-500" />
                  <div className="flex items-center mb-3">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-5 w-5 fill-current ${i < testimonial.rating ? "text-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-gray-700 italic text-center mb-4">"{testimonial.quote}"</p>
                  <p className="text-lg font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link to="/alumni" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-1">
              Meet More Alumni
              <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>

        {/* Upcoming Events Section */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Upcoming Events Sneak Peek</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {news.map((event, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white p-6 rounded-lg shadow-md border-2 border-purple-500"
              >
                <Link to={event.link} className="flex flex-col sm:flex-row gap-4">
                  <img src={event.image} alt={event.title} className="w-full sm:w-48 h-48 object-cover rounded-md" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{event.date}</p>
                    <p className="mt-2 text-gray-600">{event.excerpt}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/events" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              View All Events
            </Link>
          </div>
        </motion.div>

        {/* Call to Action Footer */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-16 bg-indigo-700 py-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold">{isLoggedIn ? "Thank You" : "Ready to Join the Community?"}</h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto">Whether you're looking to network, find opportunities, or give back, Alumni Connect is here for you.</p>
          {!isLoggedIn && (
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }} className="mt-8">
              <Link to="/signup" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md bg-white text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Sign Up Now
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}