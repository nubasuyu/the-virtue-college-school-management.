import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Award, Phone, Mail, MapPin, 
  ChevronRight, Menu, X, GraduationCap, Star, Calendar, Image
} from 'lucide-react';

// 👇 THIS IS WHERE YOU ADD YOUR CLOUDINARY PICTURE LINKS
const pastEvents = [
  {
    id: 1,
    title: "2025/2026 Annual End of The Session Events",
    date: "August 1, 2026",
    description: "2025/2026 Graduating Students Taking A Group Picture.",
    imageUrl: "https://res.cloudinary.com/n2j2fl2r/image/upload/v1786708344/20252026_GRADUATING_STUDENTS.jpg", // Replace with your Cloudinary URL
  },
  {
    id: 2,
    title: "Science & Innovation Fair",
    date: "May 10, 2025",
    description: "Young minds presenting their groundbreaking projects and winning prestigious awards.",
    imageUrl: "https://res.cloudinary.com/n2j2fl2r/image/upload/v1786709979/20252026_HEAD_BOY.jpg", 
  },
  {
    id: 3,
    title: "Celebration of Excellence",
    date: "October 22, 2024",
    description: "Certificate and Awaed of Excellence presented to a Student.",
    imageUrl: "https://res.cloudinary.com/n2j2fl2r/image/upload/v1786708341/CERTIFICATE_OF_EXCELLENCE.jpg", 
  },
  {
    id: 4,
    title: "Graduation Ceremony",
    date: "December 5, 2024",
    description: "Proud moments as our senior students receive their certificates and step into the future.",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800", 
  },
  {
    id: 5,
    title: "Inter-House Quiz Competition",
    date: "February 14, 2025",
    description: "A thrilling battle of wits and academic excellence among our brightest students.",
    imageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800", 
  },
  {
    id: 6,
    title: "Art & Creativity Exhibition",
    date: "April 2, 2025",
    description: "Showcasing the incredible painting, sculpting, and creative talents of our student body.",
    imageUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800", 
  },
];

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* ================= NAVBAR ================= */}
      <nav className="fixed w-full z-50 bg-[#5C4033] text-[#FFFDD0] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFFDD0] rounded-full flex items-center justify-center text-[#5C4033] font-bold text-xl">T</div>
              <div>
                <h1 className="text-xl font-bold leading-tight">The Virtue College</h1>
                <p className="text-xs text-[#FFFDD0]/80">Excellence in Education</p>
              </div>
            </div>
            
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#home" className="hover:text-white transition">Home</a>
              <a href="#about" className="hover:text-white transition">About</a>
              <a href="#programs" className="hover:text-white transition">Programs</a>
              <a href="#events" className="hover:text-white transition">Events</a> {/* 👈 ADDED */}
              <a href="#contact" className="hover:text-white transition">Contact</a>
              <Link to="/login" className="bg-[#FFFDD0] text-[#5C4033] px-6 py-2 rounded-full font-bold hover:bg-white transition shadow-md">
                Portal Login
              </Link>
            </div>

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#4B3621] px-4 py-4 space-y-3">
            <a href="#home" className="block hover:text-white" onClick={() => setIsMenuOpen(false)}>Home</a>
            <a href="#about" className="block hover:text-white" onClick={() => setIsMenuOpen(false)}>About</a>
            <a href="#programs" className="block hover:text-white" onClick={() => setIsMenuOpen(false)}>Programs</a>
            <a href="#events" className="block hover:text-white" onClick={() => setIsMenuOpen(false)}>Events</a> {/* 👈 ADDED */}
            <Link to="/login" className="block bg-[#FFFDD0] text-[#5C4033] px-4 py-2 rounded text-center font-bold" onClick={() => setIsMenuOpen(false)}>Portal Login</Link>
          </div>
        )}
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section id="home" className="relative pt-20 min-h-screen flex items-center justify-center text-center px-4 bg-gradient-to-br from-[#5C4033] via-[#6B4E3D] to-[#3E2A20] text-[#FFFDD0]">
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-[#FFFDD0]/20 border border-[#FFFDD0]/30 text-sm font-semibold mb-6 backdrop-blur-sm">
            Welcome to the 2026/2027 Academic Session
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Nurturing Minds, <br/> <span className="text-[#FFFDD0]">Building Futures.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#FFFDD0]/90 mb-10 max-w-2xl mx-auto">
            At The Virtue College, we combine academic excellence with moral integrity to raise the next generation of global leaders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact" className="bg-[#FFFDD0] text-[#5C4033] px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition shadow-lg flex items-center justify-center gap-2">
              Apply for Admission <ChevronRight size={20} />
            </a>
            <a href="#about" className="border-2 border-[#FFFDD0] text-[#FFFDD0] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#FFFDD0] hover:text-[#5C4033] transition flex items-center justify-center gap-2">
              Take a Virtual Tour
            </a>
          </div>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section className="py-12 bg-[#FFFDD0]">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '1,200+', label: 'Happy Students', icon: Users },
            { num: '98%', label: 'Exam Pass Rate', icon: Award },
            { num: '85+', label: 'Expert Teachers', icon: GraduationCap },
            { num: '25+', label: 'Years of Excellence', icon: Calendar },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <stat.icon className="w-10 h-10 text-[#5C4033] mb-3" />
              <h3 className="text-3xl md:text-4xl font-bold text-[#5C4033]">{stat.num}</h3>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= ABOUT SECTION ================= */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
              alt="Students learning" 
              className="rounded-2xl shadow-2xl w-full object-cover h-[400px]"
            />
          </div>
          <div>
            <span className="text-[#5C4033] font-bold tracking-wider uppercase text-sm">About Our School</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-6">A Legacy of Academic & Moral Excellence</h2>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              Founded on the principles of virtue and knowledge, The Virtue College has been a beacon of educational excellence for over two decades. We provide a holistic learning environment where students are encouraged to think critically, act compassionately, and lead confidently.
            </p>
            <ul className="space-y-4 mb-8">
              {['State-of-the-art Science & ICT Labs', 'Comprehensive Sports & Arts Programs', 'Dedicated Counseling & Mentorship', 'Secure & Conducive Learning Environment'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-[#5C4033] flex items-center justify-center text-white">
                    <ChevronRight size={14} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= PROGRAMS SECTION ================= */}
      <section id="programs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-[#5C4033] font-bold tracking-wider uppercase text-sm">Our Curriculum</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Academic Programs</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Early Years & Primary', desc: 'Building a strong foundation through play-based and structured learning for ages 3-10.', img: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80' },
              { title: 'Junior Secondary (JSS)', desc: 'A broad curriculum designed to help students discover their interests and core strengths.', img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80' },
              { title: 'Senior Secondary (SSS)', desc: 'Specialized streams in Sciences, Commercial, and Arts to prepare students for university and beyond.', img: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80' }
            ].map((prog, idx) => (
              <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 group">
                <div className="h-56 overflow-hidden">
                  <img src={prog.img} alt={prog.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{prog.title}</h3>
                  <p className="text-gray-600 mb-4">{prog.desc}</p>
                  <a href="#contact" className="text-[#5C4033] font-bold flex items-center gap-1 hover:gap-2 transition-all">Learn More <ChevronRight size={16} /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= NEW: EVENTS & GALLERY SECTION ================= */}
      <section id="events" className="py-20 bg-[#FFFDD0]/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-[#5C4033] font-bold tracking-wider uppercase text-sm">Campus Life</span>
            <h2 className="text-4xl font-bold text-[#5C4033] mt-2">Life at The Virtue College</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-lg">
              Explore memorable moments from our past events, celebrations, and academic milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                onMouseEnter={() => setHoveredEvent(event.id)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {/* Image Container with Zoom Effect */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Overlay on Hover */}
                  <div className={`absolute inset-0 bg-[#5C4033]/70 flex items-center justify-center transition-opacity duration-300 ${
                    hoveredEvent === event.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <p className="text-[#FFFDD0] font-semibold text-center px-4 flex items-center gap-2">
                      <Calendar size={18} /> {event.date}
                    </p>
                  </div>
                </div>

                {/* Text Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#5C4033] mb-2 group-hover:text-[#4B3621] transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-20 bg-[#5C4033] text-[#FFFDD0]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="font-bold tracking-wider uppercase text-sm text-[#FFFDD0]/80">Testimonials</span>
            <h2 className="text-4xl font-bold mt-2">What Parents & Students Say</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Mrs. Adebayo', role: 'Parent of Grade 8 Student', text: 'The transformation in my child since joining TVC has been remarkable. The teachers are incredibly dedicated and the new digital portal keeps me updated daily.' },
              { name: 'Michael O.', role: 'SSS 3 Graduate', text: 'TVC didn\'t just prepare me for my exams; it prepared me for life. The mentorship and facilities are truly world-class.' },
              { name: 'Dr. & Mrs. Johnson', role: 'Parents', text: 'We love the transparency. Being able to check attendance, grades, and pay fees online has made parenting so much easier.' }
            ].map((t, idx) => (
              <div key={idx} className="bg-[#4B3621] p-8 rounded-xl border border-[#FFFDD0]/10">
                <div className="flex text-[#FFFDD0] mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#FFFDD0" />)}
                </div>
                <p className="italic text-[#FFFDD0]/90 mb-6">"{t.text}"</p>
                <div>
                  <h4 className="font-bold text-lg">{t.name}</h4>
                  <p className="text-sm text-[#FFFDD0]/60">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER / CONTACT ================= */}
      <footer id="contact" className="bg-[#2C1E18] text-[#FFFDD0]/80 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <h2 className="text-3xl font-bold text-[#FFFDD0] mb-4">The Virtue College</h2>
            <p className="mb-6 max-w-md">Empowering the next generation with knowledge, virtue, and leadership skills for a globalized world.</p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#5C4033] flex items-center justify-center hover:bg-[#FFFDD0] hover:text-[#5C4033] cursor-pointer transition font-bold">FB</div>
              <div className="w-10 h-10 rounded-full bg-[#5C4033] flex items-center justify-center hover:bg-[#FFFDD0] hover:text-[#5C4033] cursor-pointer transition font-bold">IG</div>
              <div className="w-10 h-10 rounded-full bg-[#5C4033] flex items-center justify-center hover:bg-[#FFFDD0] hover:text-[#5C4033] cursor-pointer transition font-bold">X</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-[#FFFDD0] font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="hover:text-white transition">About Us</a></li>
              <li><a href="#programs" className="hover:text-white transition">Admissions</a></li>
              <li><a href="#events" className="hover:text-white transition">School Events</a></li>
              <li><Link to="/login" className="hover:text-white transition">Student Portal</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#FFFDD0] font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3"><MapPin size={20} className="shrink-0 mt-1" /> 123 Education Lane, Knowledge City, Nigeria</li>
              <li className="flex items-center gap-3"><Phone size={20} /> +234 800 123 4567</li>
              <li className="flex items-center gap-3"><Mail size={20} /> info@virtuecollege.edu</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[#FFFDD0]/10 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} The Virtue College. All rights reserved. | Powered by TVC Digital</p>
        </div>
      </footer>
    </div>
  );
}