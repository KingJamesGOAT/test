import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  History as HistoryIcon, 
  User, 
  ScrollText, 
  Crown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CalendarArrowUp,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../lib/i18n/LanguageContext';

// Import data AND UI Translations
import { COUNCILS, SAINTS, POPES, TimelineEvent, TIMELINE_UI } from '../lib/data/timelineData'; 
import { cn } from './ui/utils'; 

// --- CONFIGURATION ---
const DATA_START_YEAR = 0;
const DATA_END_YEAR = 2100;
const LANE_HEIGHT = 90; 
const EVENT_GAP = 12;   

export default function HistoryTimeline() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'council' | 'saint' | 'pope'>('all');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  
  // Controls state
  const [pixelsPerYear, setPixelsPerYear] = useState(2); 
  const [targetYear, setTargetYear] = useState('');
  const [containerWidth, setContainerWidth] = useState(1000); 
  const [scrollLeft, setScrollLeft] = useState(0); 

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  
  // Dragging Refs
  const isDraggingMiniMap = useRef(false);
  const isDraggingMain = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  // --- 1. ZOOM LIMITS ---
  const minZoom = useMemo(() => {
    return containerWidth / (DATA_END_YEAR - DATA_START_YEAR);
  }, [containerWidth]);

  const maxZoom = useMemo(() => {
    return containerWidth / 100; 
  }, [containerWidth]);

  useEffect(() => {
    if (pixelsPerYear < minZoom) setPixelsPerYear(minZoom);
    if (pixelsPerYear > maxZoom) setPixelsPerYear(maxZoom);
  }, [minZoom, maxZoom, pixelsPerYear]);

  useEffect(() => {
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // --- 2. MINI-MAP LOGIC ---
  const totalContentWidth = (DATA_END_YEAR - DATA_START_YEAR) * pixelsPerYear;
  const safeTotalWidth = totalContentWidth || 1; 
  const thumbWidthPercent = Math.min(100, (containerWidth / safeTotalWidth) * 100);
  const thumbLeftPercent = (scrollLeft / safeTotalWidth) * 100;

  const handleMainScroll = () => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const handleSeek = (clientX: number) => {
    if (!miniMapRef.current || !scrollContainerRef.current) return;

    const rect = miniMapRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    
    let percentage = clickX / rect.width;
    percentage = Math.max(0, Math.min(1, percentage));

    const maxScroll = scrollContainerRef.current.scrollWidth - containerWidth;
    const newScrollLeft = percentage * maxScroll;

    scrollContainerRef.current.scrollLeft = newScrollLeft;
  };

  const handleMiniMapDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    isDraggingMiniMap.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    handleSeek(clientX);
  };

  // --- 3. MAIN TIMELINE DRAG LOGIC ---
  const handleMainMouseDown = (e: React.MouseEvent) => {
    // If clicking a card, don't start scroll drag
    if ((e.target as HTMLElement).closest('.event-card')) return;
    
    e.preventDefault(); 
    
    isDraggingMain.current = true;
    dragStartX.current = e.clientX;
    if (scrollContainerRef.current) {
      dragStartScroll.current = scrollContainerRef.current.scrollLeft;
    }
    
    document.body.style.cursor = 'grabbing';
  };

  useEffect(() => {
    const handleWindowMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;

      if (isDraggingMiniMap.current) {
        e.preventDefault(); 
        handleSeek(clientX);
      }

      if (isDraggingMain.current && scrollContainerRef.current) {
        e.preventDefault();
        const delta = clientX - dragStartX.current;
        scrollContainerRef.current.scrollLeft = dragStartScroll.current - delta;
      }
    };

    const handleWindowUp = () => {
      isDraggingMiniMap.current = false;
      isDraggingMain.current = false;
      document.body.style.cursor = ''; 
    };

    window.addEventListener('mousemove', handleWindowMove);
    window.addEventListener('mouseup', handleWindowUp);
    window.addEventListener('touchmove', handleWindowMove, { passive: false });
    window.addEventListener('touchend', handleWindowUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
      window.removeEventListener('touchmove', handleWindowMove);
      window.removeEventListener('touchend', handleWindowUp);
    };
  }, [containerWidth, totalContentWidth]);


  // --- 4. NAVIGATION HANDLERS ---
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    setPixelsPerYear(prev => {
      if (direction === 'reset') return minZoom; 
      const factor = 1.25;
      let newZoom = direction === 'in' ? prev * factor : prev / factor;
      return Math.min(Math.max(newZoom, minZoom), maxZoom);
    });
  };

  const jumpToYear = () => {
    const year = parseInt(targetYear);
    if (isNaN(year) || !scrollContainerRef.current) return;

    const safeYear = Math.min(Math.max(year, DATA_START_YEAR), DATA_END_YEAR);
    const pixelPos = (safeYear - DATA_START_YEAR) * pixelsPerYear;
    const centerOffset = containerWidth / 2;
    const scrollPos = Math.max(0, pixelPos - centerOffset);

    scrollContainerRef.current.scrollTo({
      left: scrollPos,
      behavior: 'smooth'
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      jumpToYear();
    }
  };

  // --- 5. FILTER DATA ---
  const filteredEvents = useMemo(() => {
    const councils = COUNCILS || [];
    const saints = SAINTS || [];
    const popes = POPES || [];

    const all = [
      ...councils.map(e => ({ ...e, type: 'council' as const })),
      ...saints.map(e => ({ ...e, type: 'saint' as const })),
      ...popes.map(e => ({ ...e, type: 'pope' as const }))
    ];
    
    return all.filter(event => {
      if (selectedType !== 'all' && event.type !== selectedType) return false;
      
      const searchLower = searchQuery.toLowerCase();
      const name = event.name?.[language]?.toLowerCase() || "";
      const description = event.description?.[language]?.toLowerCase() || "";
      const year = event.startYear?.toString() || "";
      
      return name.includes(searchLower) || description.includes(searchLower) || year.includes(searchLower);
    }).sort((a, b) => a.startYear - b.startYear);
  }, [selectedType, searchQuery, language]);

  // --- 6. LAYOUT ENGINE ---
  const { positionedEvents, totalLanes } = useMemo(() => {
    const lanes: number[] = []; 
    
    const positioned = filteredEvents.map(event => {
      // Ensure startYear exists
      if (event.startYear === undefined) return null;

      const startPixel = (event.startYear - DATA_START_YEAR) * pixelsPerYear;
      const duration = (event.endYear || event.startYear) - event.startYear;
      const widthPixel = Math.max(duration * pixelsPerYear, 140); 
      const endPixel = startPixel + widthPixel + 20;

      let laneIndex = -1;

      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] < startPixel) {
          laneIndex = i;
          lanes[i] = endPixel; 
          break;
        }
      }

      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push(endPixel);
      }

      return { 
        ...event, 
        lane: laneIndex,
        x: startPixel,
        width: widthPixel
      };
    }).filter(e => e !== null);

    return { positionedEvents: positioned, totalLanes: lanes.length };
  }, [filteredEvents, pixelsPerYear]);

  // --- 7. HELPER STYLES ---
  const getColors = (type: string) => {
    switch(type) {
      case 'council': return { 
        bg: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-white', hover: 'hover:bg-indigo-500' 
      };
      case 'saint': return { 
        bg: 'bg-amber-600', border: 'border-amber-400', text: 'text-white', hover: 'hover:bg-amber-500' 
      };
      case 'pope': return { 
        bg: 'bg-red-600', border: 'border-red-400', text: 'text-white', hover: 'hover:bg-red-500' 
      };
      default: return { 
        bg: 'bg-gray-700', border: 'border-gray-500', text: 'text-white', hover: 'hover:bg-gray-600' 
      };
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'council': return <ScrollText size={16} className="text-indigo-100" />;
      case 'saint': return <User size={16} className="text-amber-100" />;
      case 'pope': return <Crown size={16} className="text-red-100" />;
      default: return <HistoryIcon size={16} />;
    }
  };

  // --- 8. RENDER HELPERS ---
  const containerStyleHeight = Math.max(totalLanes * (LANE_HEIGHT + EVENT_GAP) + 150, 500);
  const tickInterval = pixelsPerYear < 2 ? 100 : pixelsPerYear < 5 ? 50 : pixelsPerYear < 10 ? 25 : 10;
  const ticks = [];
  for (let y = DATA_START_YEAR; y <= DATA_END_YEAR; y += tickInterval) {
    ticks.push(y);
  }

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white pt-24 px-4 pb-12 flex flex-col gap-6">
      
      {/* SCROLLBAR STYLE */}
      <style>{`
        .timeline-scrollbar::-webkit-scrollbar { height: 14px; background: #0a0a0a; }
        .timeline-scrollbar::-webkit-scrollbar-thumb { background-color: #3b82f6; border-radius: 7px; border: 3px solid #0a0a0a; }
        .timeline-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 7px; }
        .timeline-scrollbar { scrollbar-width: auto; scrollbar-color: #3b82f6 #1a1a1a; }
      `}</style>

      {/* 1. TITLE */}
      <div className="container mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3">
          <HistoryIcon className="text-blue-500" size={32} />
          {TIMELINE_UI.title[language]}
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base">
          {TIMELINE_UI.subtitle[language]}
        </p>
      </div>

      {/* 2. CONTROLS CONTAINER */}
      <div className="container mx-auto w-full max-w-7xl bg-[#121212] border border-gray-800 p-4 rounded-xl shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2">
             {(['all', 'council', 'saint', 'pope'] as const).map(type => (
               <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-3 py-1.5 text-xs md:text-sm rounded-lg transition-all capitalize font-medium border",
                  selectedType === type
                    ? type === 'all' ? "bg-blue-600 border-blue-500 text-white shadow-lg" 
                    : type === 'council' ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                    : type === 'saint' ? "bg-amber-600 border-amber-500 text-white shadow-lg"
                    : "bg-red-600 border-red-500 text-white shadow-lg"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                )}
               >
                 {TIMELINE_UI.filters[type][language]}
               </button>
             ))}
          </div>

          {/* Navigation Tools */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
            
            <div className="flex items-center bg-[#0a0a0a] rounded-lg border border-gray-700 px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all w-full md:w-auto">
              <CalendarArrowUp size={16} className="text-gray-500 shrink-0 mr-2" />
              <input 
                type="number" 
                placeholder="Year" 
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-16"
              />
              <button 
                onClick={jumpToYear}
                className="bg-gray-800 hover:bg-gray-700 rounded p-1 text-white transition-colors ml-1"
              >
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex items-center bg-[#0a0a0a] rounded-lg border border-gray-700 px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all flex-1 min-w-[200px]">
              <Search size={16} className="text-gray-500 shrink-0 mr-2" />
              <input 
                type="text" 
                placeholder={TIMELINE_UI.searchPlaceholder[language]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-[#0a0a0a] rounded-lg p-1 border border-gray-700 shrink-0">
              <button onClick={() => handleZoom('out')} disabled={pixelsPerYear <= minZoom} className="p-2 hover:bg-gray-800 disabled:opacity-30 rounded text-gray-300 transition-colors"><ZoomOut size={18}/></button>
              <button onClick={() => handleZoom('reset')} className="p-2 hover:bg-gray-800 rounded text-gray-300 transition-colors"><Maximize2 size={18}/></button>
              <button onClick={() => handleZoom('in')} disabled={pixelsPerYear >= maxZoom} className="p-2 hover:bg-gray-800 disabled:opacity-30 rounded text-gray-300 transition-colors"><ZoomIn size={18}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MINI-MAP (SCROLL BAR) */}
      <div className="container mx-auto w-full max-w-[98%] lg:max-w-7xl select-none">
        <div 
          className="w-full h-8 bg-[#121212] rounded-lg border border-gray-700 relative overflow-hidden cursor-pointer touch-none hover:border-blue-500/50 transition-colors"
          ref={miniMapRef}
          onMouseDown={handleMiniMapDown}
          onTouchStart={handleMiniMapDown}
        >
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none z-0">
             <span className="text-[10px] text-gray-500 font-mono font-bold">0 AD</span>
             <span className="text-[10px] text-gray-500 font-mono font-bold">2100</span>
          </div>

          <div 
            className="absolute top-0 bottom-0 bg-blue-600 border-x border-white/20 z-10 cursor-grab active:cursor-grabbing hover:bg-blue-500 transition-colors rounded-sm shadow-lg"
            style={{
              left: `${thumbLeftPercent}%`,
              width: `${thumbWidthPercent}%`
            }}
          />
        </div>
      </div>

      {/* 4. TIMELINE CONTAINER */}
      <div className="container mx-auto w-full max-w-[98%] lg:max-w-7xl flex-1 flex flex-col min-h-[60vh]">
        <div className="relative w-full h-full flex-1 border border-gray-700 rounded-xl bg-[#080808] shadow-2xl overflow-hidden flex flex-col select-none">
          
          <div 
            className="flex-1 w-full overflow-x-auto overflow-y-hidden relative timeline-scrollbar"
            ref={scrollContainerRef}
            onScroll={handleMainScroll}
            style={{ scrollBehavior: 'auto' }} 
          >
            {/* CRITICAL FIX: 
               onMouseDown is applied HERE (inner div), not on the scroll container.
               This allows the scrollbar (on parent) to be clicked without being blocked by preventDefault().
            */}
            <div 
              className="relative cursor-grab active:cursor-grabbing"
              style={{ width: `${totalContentWidth}px`, height: '100%', minHeight: `${containerStyleHeight}px` }}
              onMouseDown={handleMainMouseDown}
            >
              {/* Grid Background */}
              <div className="absolute inset-0 pointer-events-none opacity-20" 
                   style={{ 
                     backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px)`, 
                     backgroundSize: `${100 * pixelsPerYear}px 100%` 
                   }} 
              />

              {/* Sticky Axis */}
              <div className="sticky top-0 left-0 right-0 h-12 border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur-md z-30 flex items-end shadow-md pointer-events-none">
                 {ticks.map(year => (
                   <div 
                     key={year} 
                     className="absolute bottom-0 flex flex-col items-center"
                     style={{ left: `${(year - DATA_START_YEAR) * pixelsPerYear}px` }}
                   >
                     <div className="h-3 w-px bg-gray-500" />
                     <span className="text-xs text-gray-400 font-mono mb-1 transform -translate-x-1/2">
                       {year}
                     </span>
                   </div>
                 ))}
              </div>

              {/* Horizon Line */}
              <div className="sticky top-12 left-0 right-0 h-0.5 bg-blue-600/50 shadow-[0_0_10px_rgba(37,99,235,0.5)] z-20 pointer-events-none" />

              {/* Events */}
              <div className="absolute top-16 left-0 right-0 bottom-4">
                {positionedEvents.length === 0 && (
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500 text-lg">
                        No events found matching your filter.
                    </div>
                )}

                {positionedEvents.map((event) => {
                    const colors = getColors(event.type);
                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02, zIndex: 50 }}
                            onClick={() => setSelectedEvent(event as TimelineEvent)}
                            className={cn(
                                "absolute rounded-lg border flex flex-col justify-center px-4 cursor-pointer shadow-lg overflow-hidden transition-all z-10 event-card",
                                colors.bg,
                                colors.border,
                                colors.hover
                            )}
                            style={{
                                left: `${event.x}px`,
                                width: `${event.width}px`,
                                top: `${event.lane * (LANE_HEIGHT + EVENT_GAP)}px`,
                                height: `${LANE_HEIGHT}px`
                            }}
                        >
                            <div className="flex items-start gap-3 h-full pt-3">
                                <span className="shrink-0 mt-0.5">{getIcon(event.type)}</span>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-white shadow-black drop-shadow-md leading-tight whitespace-normal line-clamp-2">
                                        {event.name[language]}
                                    </span>
                                    <span className="text-[10px] truncate text-white/80 mt-1">
                                        {event.startYear} {event.endYear && event.endYear !== event.startYear ? `- ${event.endYear}` : ''}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-black/20" />
                        </motion.div>
                    );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL - UPDATED SIZE & CLOSE BUTTON */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111] border border-gray-700 rounded-2xl w-[90%] max-w-md shadow-2xl overflow-hidden relative"
            >
              <div className={cn("h-32 relative flex items-end p-6 border-b", getColors(selectedEvent.type).bg, getColors(selectedEvent.type).border)}>
                <button 
                  onClick={() => setSelectedEvent(null)} 
                  className="absolute top-4 right-4 bg-black/40 hover:bg-black/70 rounded-full p-2 text-white transition-colors z-50"
                >
                  <X size={20} />
                </button>
                <div className="relative z-10 w-full">
                  <div className="text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2 text-white/90">
                    {getIcon(selectedEvent.type)} {selectedEvent.type}
                  </div>
                  <h2 className="text-3xl font-bold text-white leading-none">{selectedEvent.name[language]}</h2>
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6 text-gray-400 font-mono text-sm border-b border-gray-800 pb-4">
                    <span className="text-white">Duration:</span>
                    {selectedEvent.startYear} 
                    {selectedEvent.endYear && selectedEvent.endYear !== selectedEvent.startYear ? ` - ${selectedEvent.endYear}` : ''} AD
                </div>

                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  {selectedEvent.description[language]}
                </p>
                
                {selectedEvent.details && (
                  <div className="bg-[#0a0a0a] rounded-xl p-5 border border-gray-800 text-sm text-gray-400 leading-relaxed">
                    {selectedEvent.details[language]}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}