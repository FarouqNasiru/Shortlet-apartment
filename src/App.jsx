import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from '@studio-freight/lenis';

// Register the ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const container = useRef(null);
  const videoRef = useRef(null);
  const heroLogo = useRef(null);
  const scrollIndicator = useRef(null);
  const sectionRef = useRef(null);

  // State to track when the video knows its own duration
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Smooth Scrolling Setup (Lenis + GSAP sync)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    return () => lenis.destroy();
  }, []);

  useGSAP(() => {


    // Universal parallax effect for backgrounds
    gsap.utils.toArray('.parallax-bg').forEach((bg) => {
      gsap.fromTo(bg,
        { yPercent: -15 },
        {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: bg.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    });
  }, { dependencies: [isVideoLoaded] });

  const handleMouseMove = (e) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    sectionRef.current.style.setProperty('--mouse-x', `${x}px`);
    sectionRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    if (!sectionRef.current) return;
    sectionRef.current.style.setProperty('--mouse-x', `75%`);
    sectionRef.current.style.setProperty('--mouse-y', `50%`);
  };

  const centerTextRef = useRef(null);

  const [galleryIdx, setGalleryIdx] = useState(0);
  const galleryRef = useRef(null);

  const galleryItems = [
    { title: 'LIVING', image: '/living.jpg' },
    { title: 'KITCHEN', image: '/kitchen.jpg' },
    { title: 'BEDROOM', image: '/bedroom.jpg' },
    { title: 'BALCONY VIEW', image: '/balcony.jpg' },
  ];

  const amenitiesData = [
    { title: 'Clubhouse', image: '/clubhouse.jpg' },
    { title: 'Residencial swimming pool', image: '/pool.jpg' },
    { title: 'Outdoor Gym', image: '/gym.jpg' },
    { title: 'Tennis Court', image: '/marbella.jpg' },
    { title: 'Spa & Wellness', image: '/living.jpg' },
  ];

  const amenitiesCarouselRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (amenitiesCarouselRef.current) {
        const carousel = amenitiesCarouselRef.current;
        const scrollAmount = window.innerWidth > 768 ? window.innerWidth * 0.3 : window.innerWidth * 0.9;
        
        if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 10) {
          carousel.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGallerySelect = (newIdx) => {
    if (newIdx === galleryIdx || !galleryRef.current) return;
    const direction = newIdx > galleryIdx ? 1 : -1;
    const oldImg = galleryRef.current.querySelector(`.gallery-img-${galleryIdx}`);
    const newImg = galleryRef.current.querySelector(`.gallery-img-${newIdx}`);

    gsap.set(newImg, { zIndex: 10 });
    gsap.set(oldImg, { zIndex: 5 });

    // New image sweeps in elastically
    gsap.fromTo(newImg, 
      { xPercent: 100 * direction, scaleX: 1.15, skewX: direction * 5, opacity: 1 },
      { xPercent: 0, scaleX: 1, skewX: 0, opacity: 1, duration: 1.5, ease: 'elastic.out(1, 0.65)' }
    );

    // Old image sweeps out elastically
    gsap.fromTo(oldImg,
      { xPercent: 0, scaleX: 1, skewX: 0, opacity: 1 },
      { xPercent: -100 * direction, scaleX: 0.85, skewX: direction * -5, opacity: 0, duration: 1.5, ease: 'elastic.out(1, 0.65)' }
    );

    setGalleryIdx(newIdx);
  };

  useGSAP(() => {
    // Do not run the animation until the video metadata is ready
    if (!isVideoLoaded) return;

    // Set initial position of the logo so it's perfectly centered
    gsap.set(heroLogo.current, {
      top: '50%',
      left: '50%',
      x: 0,
      y: 0,
      xPercent: -50,
      yPercent: -50,
      transformOrigin: 'left top',
    });

    // Make sure center text is visible but characters start hidden (handled by fromTo)
    gsap.set(centerTextRef.current, {
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      opacity: 1,
    });

    // Create a master timeline that pins the section
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=400%', // Increased scroll distance so the video plays out longer before unpinning
        scrub: true, // Reverted to true (instant) because the video is now all-keyframes and Lenis already provides smooth scroll interpolation
        pin: true, // This pins the container so the page doesn't scroll down until it finishes
      },
    });

    // 1. Video scrub effect: Play video to the end
    tl.to(videoRef.current, {
      currentTime: videoRef.current.duration - 0.1, // Scrub to the exact end of the video
      ease: 'none',
      duration: 1, // Takes up 100% of the timeline
    }, 0);

    // 2. Logo animation: Shrink and move to the top left
    const isMobile = window.innerWidth < 768;
    tl.to(heroLogo.current, {
      top: isMobile ? '20px' : '30px',
      left: isMobile ? '20px' : '40px',
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
      scale: isMobile ? 0.35 : 0.18, // Don't shrink as much on mobile
      ease: 'power2.inOut',
      duration: 0.3, // Finishes in the first 30% of the scroll timeline
    }, 0);

    // 3. Center text animation: Fade in and zoom out randomly
    tl.fromTo('.center-char', 
      {
        opacity: 0,
        scale: 4, // Start heavily zoomed in
      },
      {
        opacity: 1,
        scale: 1, // End at normal size
        ease: 'power2.out',
        duration: 0.8,
        stagger: {
          amount: 0.8, // Spread the animation over 0.8 seconds of the timeline
          from: "random"
        }
      }, 0.2 // Start slightly after the scroll begins
    );

    // 4. Fade out the scroll indicator quickly as the user starts scrolling
    if (scrollIndicator.current) {
      tl.to(scrollIndicator.current, {
        opacity: 0,
        ease: 'power1.out',
        duration: 0.1 // Explicitly set to 0.1 so it finishes in the first 10% of the scroll
      }, 0);
    }

  }, { scope: container, dependencies: [isVideoLoaded] });

  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 400; // scroll by roughly one card width
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const processContainerRef = useRef(null);

  useGSAP(() => {
    if (!isVideoLoaded || !processContainerRef.current) return;
    const processCards = gsap.utils.toArray('.process-card');
    
    // Set all cards except the first one to be pushed down off-screen
    gsap.set(processCards.slice(1), { yPercent: 100 });

    const tlProcess = gsap.timeline({
      scrollTrigger: {
        trigger: processContainerRef.current,
        start: 'top top',
        end: `+=${(processCards.length - 1) * 100}%`, 
        pin: true,
        scrub: true, 
      }
    });

    processCards.slice(1).forEach((card) => {
      tlProcess.to(card, {
        yPercent: 0,
        ease: 'none',
      });
    });
  }, { scope: processContainerRef, dependencies: [isVideoLoaded] });

  const processes = [
    { num: '01', title: 'Consultation', desc: 'We begin by understanding your vision, preferences, and lifestyle to tailor a bespoke architectural experience. Our team of experts works closely with you to align on every detail.' },
    { num: '02', title: 'Design & Planning', desc: 'Our architects craft meticulous blueprints, integrating classic Spanish aesthetics with modern luxury and cutting-edge sustainability. Every corner is meticulously planned.' },
    { num: '03', title: 'Development', desc: 'Master craftsmen bring the design to life, using premium materials to ensure flawless execution. We manage the construction process with uncompromising standards.' },
    { num: '04', title: 'Handover', desc: 'We present you with the keys to your new sanctuary, fully finished and ready for you to step into luxury. Your dream home, realized.' },
  ];

  const cardsData = [
    { time: '10', title: 'Shopping Mall Miramar', image: '/mall.jpg' },
    { time: '20', title: 'Marbella', image: '/marbella.jpg' },
    { time: '5', title: 'Restaurant SOLLO (One Michelin Star)', image: '/restaurant.jpg' },
    { time: '30', title: 'Malaga Fortress "Alcazaba"', image: '/fortress.jpg' },
    { time: '35', title: 'Picasso Museum', image: '/marbella.jpg' }, // filler extra card
  ];

  return (
    <main className="font-sans bg-[#DFD8CF] text-zinc-900 overflow-x-hidden">

      {/* Hero Section */}
      <section
        ref={container}
        className="relative h-screen w-full flex overflow-hidden bg-black"
      >
        {/* Video Background */}
        <video
          ref={videoRef}
          src="/lagos-skyline-scrub.mp4"
          className="absolute inset-0 w-full h-full object-cover z-10"
          muted       // Must be muted to interact programmatically on many browsers
          playsInline // Prevents iOS from forcing full screen
          preload="auto"
          onLoadedMetadata={() => setIsVideoLoaded(true)} // Triggers GSAP setup
        />

        {/* Dark gradient layer at the bottom of the video */}
        <div className="absolute bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none" />

        {/* Scroll Indicator */}
        <div 
          ref={scrollIndicator}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="flex flex-col items-center animate-bounce">
            <span className="text-white text-sm uppercase tracking-[0.3em] mb-3 font-medium drop-shadow-md">Scroll Down</span>
            <div className="w-[1px] h-16 bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        {/* Top Right Menu */}
        <div className="absolute top-6 md:top-10 right-4 md:right-14 z-50 flex items-center gap-2 md:gap-8 pl-4 md:pl-8 pr-2 py-2 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-full font-luxury font-normal text-xs md:text-sm uppercase tracking-[0.2em] text-white">
          <a href="#home" className="hidden md:inline-block hover:text-white/80 transition-colors drop-shadow-md">Home</a>
          <a href="#about" className="hidden md:inline-block hover:text-white/80 transition-colors drop-shadow-md">About Us</a>
          <a href="#contact" className="hidden md:inline-block hover:text-white/80 transition-colors drop-shadow-md">Contact</a>
          
          <button 
            className="md:hidden flex flex-col justify-center items-center gap-[4px] px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <div className="w-5 h-[1.5px] bg-white"></div>
            <div className="w-5 h-[1.5px] bg-white"></div>
          </button>

          <a 
            href="#booking" 
            className="bg-[#DFD8CF] text-zinc-900 px-6 md:px-8 py-2 md:py-3 rounded-full font-bold hover:bg-white hover:scale-105 transition-all drop-shadow-none"
          >
            Make Booking
          </a>
        </div>

        {/* Mobile Full Screen Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col justify-center items-center font-serif text-3xl md:text-5xl uppercase tracking-widest text-[#DFD8CF]">
             <button 
               className="absolute top-10 right-8 text-sm tracking-[0.2em] font-sans font-bold hover:opacity-70 transition-opacity"
               onClick={() => setIsMobileMenuOpen(false)}
             >
               CLOSE [X]
             </button>
             <div className="flex flex-col gap-12 items-center">
               <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white transition-colors">Home</a>
               <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white transition-colors">About Us</a>
               <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white transition-colors">Contact</a>
             </div>
          </div>
        )}
        {/* Hero Logo */}
        <h1
          ref={heroLogo}
          className="absolute z-30 text-[25vw] md:text-[18vw] font-brand tracking-widest uppercase text-white m-0 drop-shadow-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          ÌTỤRÀ
        </h1>

        {/* Animated Center Text */}
        <div 
          ref={centerTextRef}
          className="absolute z-30 flex flex-wrap justify-center text-center w-full max-w-5xl gap-x-3 md:gap-x-6 gap-y-2 md:gap-y-4 text-white text-lg md:text-5xl font-serif uppercase tracking-[0.4em] font-light drop-shadow-2xl pointer-events-none opacity-0 px-4"
        >
          {"WELCOME TO LUXURY LIVING IN THE HEART OF SPAIN".split(' ').map((word, wIdx) => (
            <div key={wIdx} className="flex">
              {word.split('').map((char, cIdx) => (
                <span key={`${wIdx}-${cIdx}`} className="center-char inline-block opacity-0">
                  {char}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Content section with Spotlight Hover Effect */}
      <section 
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="elastic-warp origin-center relative h-[100vh] md:h-[120vh] p-8 md:p-20 flex flex-col justify-center items-start overflow-hidden bg-[#DFD8CF]"
      >
        {/* Hidden Background Image with Parallax */}
        <div 
          className="parallax-bg absolute -top-[20%] -left-[5%] w-[110%] h-[140%] bg-[url('/lagos-streets.jpg')] bg-cover bg-center bg-no-repeat z-0"
        />
        
        {/* Dynamic Spotlight Overlay */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none transition-all duration-300"
          style={{
            background: 'radial-gradient(circle 500px at var(--mouse-x, 75%) var(--mouse-y, 50%), rgba(223, 216, 207, 0.45) 0%, rgba(223, 216, 207, 1) 100%)'
          }}
        />

        {/* Left-Aligned Text Content */}
        <div className="relative z-20 max-w-4xl font-serif text-[#2a302e]">
          <h2 className="text-4xl md:text-5xl leading-snug font-medium mb-12 uppercase tracking-wide">
            Prime Location <span className="text-xl md:text-2xl">between</span><br />
            Mijas, Benalmadena,<br />
            <span className="text-2xl">and</span> Fuengirola <span className="text-2xl">on the</span><br />
            Picturesque <span className="text-2xl">coastline of</span><br />
            Spain
          </h2>
          <a 
            href="#map" 
            className="inline-block bg-[#33423f] text-[#DFD8CF] px-8 py-4 font-sans text-xs tracking-[0.3em] uppercase font-bold hover:bg-black transition-colors"
          >
            See on Map
          </a>
        </div>

      </section>

      {/* Destination Cards Section */}
      <section className="relative w-full bg-[#DFD8CF] group/slider border-t border-[#c4bdaf]">
        {/* Navigation Buttons (Far Left / Right) */}
        <button 
          onClick={() => scrollCarousel('left')}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-40 w-14 h-14 bg-white/60 hover:bg-white rounded-full flex items-center justify-center backdrop-blur shadow-xl transition-all opacity-0 group-hover/slider:opacity-100 cursor-pointer"
        >
          <svg className="w-5 h-5 fill-zinc-800" viewBox="0 0 320 512"><path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg>
        </button>
        <button 
          onClick={() => scrollCarousel('right')}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-40 w-14 h-14 bg-white/60 hover:bg-white rounded-full flex items-center justify-center backdrop-blur shadow-xl transition-all opacity-0 group-hover/slider:opacity-100 cursor-pointer"
        >
          <svg className="w-5 h-5 fill-zinc-800" viewBox="0 0 320 512"><path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"/></svg>
        </button>

        {/* Scrolling Container */}
        <div 
          ref={carouselRef}
          className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide py-10 md:py-0"
        >
          {cardsData.map((card, i) => (
             <div key={i} className="snap-start shrink-0 relative min-w-[280px] md:min-w-[380px] h-[300px] md:h-[340px] bg-[#d7cfc5] border-r border-[#c4bdaf] flex flex-col justify-between p-6 md:p-8 group overflow-hidden cursor-pointer">
               {/* The hidden image that reveals and zooms out on hover (visible by default on mobile) */}
               <img 
                 src={card.image} 
                 alt={card.title}
                 className="absolute inset-0 w-full h-full object-cover opacity-100 md:opacity-0 group-hover:opacity-100 scale-100 md:scale-[1.15] group-hover:scale-100 transition-all duration-700 ease-out z-0"
               />
               {/* Dark gradient on hover to keep text readable over the image */}
               <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
           
               {/* Top Content (Time & Label) */}
               <div className="relative z-20 flex items-start gap-4 transition-colors duration-500 text-white md:text-[#2a302e] group-hover:text-white">
                 <span className="text-6xl md:text-8xl font-serif leading-none tracking-tighter -mt-2">{card.time}</span>
                 <span className="text-[0.65rem] tracking-[0.2em] font-sans uppercase mt-2 w-20 leading-tight">MIN DRIVE BY CAR</span>
               </div>
               
               {/* Bottom Content (Title & Icon) */}
               <div className="relative z-20 flex justify-between items-end transition-colors duration-500 text-white md:text-[#2a302e] group-hover:text-white">
                 <span className="font-serif text-2xl leading-tight max-w-[200px]">{card.title}</span>
                 <div className="w-10 h-10 rounded-full border border-current flex items-center justify-center opacity-100 md:opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                    {/* Simple pin icon */}
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 384 512"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>
                 </div>
               </div>
             </div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section 
        ref={processContainerRef}
        className="relative h-screen w-full bg-limewash overflow-hidden flex flex-col items-center justify-end"
      >
        <div className="relative w-full h-screen">
          {processes.map((process, i) => (
             <div 
               key={i} 
               className={`process-card elastic-warp origin-bottom absolute bottom-0 left-0 w-full h-screen border-t border-[#c4bdaf] shadow-[0_-15px_40px_rgba(0,0,0,0.1)] pt-20 px-6 md:pt-32 md:px-24 flex flex-col`}
               style={{ 
                 backgroundColor: i % 2 === 0 ? '#DFD8CF' : '#d7cfc5',
                 zIndex: i * 10
               }}
             >
               <div className="flex flex-col md:flex-row justify-between items-start w-full relative">
                  {/* Heading & Subheading (Top Left) */}
                  <div className="max-w-4xl text-left relative z-20 mt-16 md:mt-0">
                     <h3 className="text-4xl md:text-7xl font-serif text-[#2a302e] mb-6 md:mb-10 uppercase tracking-widest">{process.title}</h3>
                     <p className="text-xl md:text-3xl font-sans font-light text-[#2a302e]/80 leading-relaxed tracking-wide">{process.desc}</p>
                  </div>
                  {/* Huge Number (Top Right) */}
                  <span className="text-[10rem] md:text-[18rem] font-serif leading-none tracking-tighter text-[#2a302e] opacity-20 md:opacity-90 absolute right-0 top-0 md:relative md:-mt-10 z-10">{process.num}</span>
               </div>
             </div>
          ))}
        </div>
      </section>

      {/* Interior Gallery Section */}
      <section ref={galleryRef} className="elastic-warp origin-top relative w-full h-screen overflow-hidden bg-black text-white">
        {/* Images Container */}
        {galleryItems.map((item, i) => (
          <div 
            key={i} 
            className={`gallery-img-${i} absolute inset-0 w-full h-full origin-center`}
            style={{ 
              opacity: i === 0 ? 1 : 0, 
              zIndex: i === 0 ? 10 : 0,
            }}
          >
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            {/* Dark gradient to make text readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent pointer-events-none" />
          </div>
        ))}

        {/* UI Overlay */}
        <div className="absolute inset-0 z-20 p-16 md:p-24 flex flex-col justify-between pointer-events-none">
          {/* Top Left Pills */}
          <div className="flex items-center gap-6">
            <span className="px-6 py-2 border border-white/40 rounded-full text-xs tracking-[0.3em] uppercase font-sans font-medium backdrop-blur-sm">Residence</span>
            <span className="text-xs tracking-[0.3em] uppercase font-sans font-medium">Interior</span>
          </div>

          {/* Bottom Left Titles */}
          <div className="flex flex-col items-start pointer-events-auto">
            {galleryItems.map((item, i) => (
              <button 
                key={i}
                onClick={() => handleGallerySelect(i)}
                className={`font-serif text-5xl md:text-[5.5rem] leading-[0.9] uppercase tracking-wide transition-all duration-500 text-left ${
                  i === galleryIdx 
                    ? 'opacity-100 scale-100 text-white' 
                    : 'opacity-40 scale-95 text-white hover:opacity-70 hover:translate-x-4'
                }`}
                style={{ transformOrigin: 'left center' }}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="elastic-warp relative w-full bg-[#e3ded6] text-[#2a302e] flex flex-col pt-32 overflow-hidden border-t border-[#2a302e]/10">
        {/* Heading */}
        <div className="text-center font-serif text-3xl md:text-5xl uppercase font-light tracking-wide leading-[1.1] mb-24 z-10 px-6">
          <p>Blend <span className="text-xl md:text-3xl">of</span> Modern</p>
          <p>Amenities Designed <span className="text-xl md:text-3xl">to</span></p>
          <p>Enhance Lifestyle</p>
        </div>

        {/* Info Bar */}
        <div className="flex justify-between items-center px-12 md:px-24 mb-10 z-10">
          {/* Pill */}
          <div className="flex items-center gap-4 px-6 py-2 border border-[#2a302e]/20 rounded-full text-xs tracking-[0.2em] font-sans font-medium">
            <span>RESIDENCES</span>
            <span className="text-[#2a302e]/40">|</span>
            <span className="text-[#2a302e]/60">PRIVATE SPACE</span>
          </div>
          {/* Progress Line */}
          <div className="w-48 h-[1px] bg-[#2a302e]/20 relative">
             <div className="absolute top-0 left-0 h-full w-1/3 bg-[#2a302e]"></div>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative w-full border-t border-[#2a302e]/10">
          <div 
            ref={amenitiesCarouselRef}
            className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          >
            {amenitiesData.map((item, i) => (
              <div 
                key={i} 
                className="snap-start shrink-0 w-[90vw] md:w-[45vw] lg:w-[30vw] border-r border-[#2a302e]/10 flex flex-col"
              >
                {/* Image */}
                <div className="w-full aspect-[4/3] p-8 pb-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                {/* Text & Button */}
                <div className="flex justify-between items-center p-8 pt-6">
                  <span className="font-serif text-3xl font-light">{item.title}</span>
                  <button className="w-10 h-10 shrink-0 rounded-full border border-[#2a302e]/20 flex items-center justify-center hover:bg-[#2a302e] hover:text-[#e3ded6] transition-colors">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section - Negative Footer Style */}
      <section className="elastic-warp relative w-full bg-[#DFD8CF] pt-20">
        <footer className="relative w-full rounded-t-[2rem] md:rounded-t-[3rem] overflow-hidden flex flex-col shadow-[0_-15px_40px_rgba(0,0,0,0.05)]">
          
          {/* Top Half: Massive Logo Block */}
          <div className="w-full bg-[#2a302e] text-[#DFD8CF] flex items-center justify-center overflow-hidden h-[30vh] md:h-[45vh]">
            <h2 
              className="font-brand uppercase tracking-tighter leading-none text-center flex items-center justify-center m-0"
              style={{ fontSize: 'clamp(8rem, 25vw, 25rem)', transform: 'translateY(15%)' }}
            >
              ÌTỤRÀ
            </h2>
          </div>

          {/* Bottom Half: Links and Info */}
          <div className="w-full bg-[#f4f2ef] text-[#2a302e] flex flex-col p-10 md:p-20">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-16 w-full">
              
              {/* Left Column: Brand Statement & Newsletter */}
              <div className="flex flex-col gap-6 max-w-sm">
                <h3 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
                  Crafted with restraint.<br />Built to outlive trends.
                </h3>
                <p className="font-sans text-[0.65rem] uppercase tracking-[0.2em] font-bold">
                  Classic Spanish aesthetics shaped into<br />modern luxury living.
                </p>
                
                <div className="mt-4 flex flex-col gap-3">
                  <span className="font-sans font-bold text-sm">Enter the ÌTỤRÀ Journal</span>
                  <div className="flex w-full bg-[#e3ded6] rounded-md overflow-hidden">
                    <input 
                      type="email" 
                      placeholder="type your email" 
                      className="bg-transparent px-4 py-3 text-sm outline-none w-full placeholder-[#2a302e]/60 font-sans"
                    />
                  </div>
                  <div className="flex gap-4 mt-2">
                    {/* Fake social icons */}
                    <a href="#" className="w-6 h-6 rounded-full border border-[#2a302e]/30 flex items-center justify-center hover:bg-[#2a302e] hover:text-[#f4f2ef] transition-colors"><span className="text-[10px] font-serif">f</span></a>
                    <a href="#" className="w-6 h-6 rounded-full border border-[#2a302e]/30 flex items-center justify-center hover:bg-[#2a302e] hover:text-[#f4f2ef] transition-colors"><span className="text-[10px] font-serif">in</span></a>
                    <a href="#" className="w-6 h-6 rounded-full border border-[#2a302e]/30 flex items-center justify-center hover:bg-[#2a302e] hover:text-[#f4f2ef] transition-colors"><span className="text-[10px] font-serif">x</span></a>
                  </div>
                </div>
              </div>

              {/* Right Columns: Links */}
              <div className="flex flex-col md:flex-row gap-12 md:gap-24 font-sans text-xs">
                {/* Navigation */}
                <div className="flex flex-col gap-4">
                  <span className="font-bold mb-2 text-[0.8rem]">Navigation</span>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Gallery</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Amenities</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Process</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Archive Notes</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">About</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Contact</a>
                </div>

                {/* Support */}
                <div className="flex flex-col gap-4">
                  <span className="font-bold mb-2 text-[0.8rem]">Support</span>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Shipping & Returns</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Care Guide</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Trade Program</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Warranty</a>
                </div>

                {/* Material Focus */}
                <div className="flex flex-col gap-4">
                  <span className="font-bold mb-2 text-[0.8rem]">Material Focus</span>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Solid Oak</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Natural Walnut</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Hand-Finished Surfaces</a>
                  <a href="#" className="opacity-80 hover:opacity-100 font-medium transition-opacity">Sustainable Timber</a>
                </div>
                
                {/* Circular Badge Logo Placeholder */}
                <div className="hidden lg:flex items-start justify-center">
                   <div className="w-16 h-16 rounded-full border-[1.5px] border-[#2a302e] flex items-center justify-center p-[2px]">
                      <div className="w-full h-full rounded-full border border-[#2a302e] flex items-center justify-center font-brand text-[0.6rem] font-bold -rotate-12 tracking-widest">
                         ÌTỤRÀ
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="w-full mt-20 pt-6 border-t border-[#2a302e]/20 flex flex-col md:flex-row justify-between items-center text-[0.65rem] font-sans font-medium opacity-80">
              <span>&copy; {new Date().getFullYear()} ÌTỤRÀ Atelier. Rooted in craft, refined through time.</span>
            </div>
          </div>
        </footer>
      </section>

      {/* Floating WhatsApp Button */}
      <a 
        href="#" 
        className="fixed bottom-10 right-10 z-50 flex items-center justify-center w-16 h-16 bg-[#25D366] rounded-full hover:scale-110 transition-transform shadow-lg cursor-pointer group"
      >
        {/* Emanating circular lines */}
        <div className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-75 duration-1000" />
        <div className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-[ping_2s_ease-in-out_infinite] opacity-50" />
        
        {/* WhatsApp SVG Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          className="w-9 h-9 fill-white relative z-10"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 413.3c-33.1 0-65.5-8.9-94-25.7l-6.7-4-69.8 18.3L72 334.3l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.8 0-101.9 82.9-184.8 184.6-184.8 54.4 0 105.4 21.2 143.9 59.7 38.5 38.5 59.7 89.6 59.7 144.1 0 101.9-82.9 184.8-184.6 184.8zM324.7 274.6c-5.5-2.8-32.6-16.1-37.7-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-2.1-3.6 2.1-3.2 7.6-14.2 2.8-5.5 1.4-10.3 0-13.1-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.6-13.3 37.2-26.2 4.6-12.9 4.6-24 3.2-26.2-1.4-2.2-5.1-3.6-10.6-6.4z" />
        </svg>
      </a>

    </main>
  );
}