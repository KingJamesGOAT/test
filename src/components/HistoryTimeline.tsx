import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  X, 
  History as HistoryIcon, // <--- Renommé pour éviter le conflit !
  User, 
  ScrollText, 
  Crown,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';
import { COUNCILS, SAINTS, POPES, TimelineEvent, LocalizedString } from '../lib/data/timelineData';

export default function HistoryTimeline() { // Le composant s'appelle HistoryTimeline
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'council' | 'saint' | 'pope'>('all');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // Fusionner et trier toutes les données
  const allEvents = useMemo(() => {
    const events: (TimelineEvent & { type: 'council' | 'saint' | 'pope' })[] = [
      ...COUNCILS.map(e => ({ ...e, type: 'council' as const })),
      ...SAINTS.map(e => ({ ...e, type: 'saint' as const })),
      ...POPES.map(e => ({ ...e, type: 'pope' as const }))
    ];
    return events.sort((a, b) => a.year - b.year);
  }, []);

  // Filtrer les données
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Filtre par type
      if (selectedType !== 'all' && event.type !== selectedType) return false;

      // Filtre par recherche
      const searchLower = searchQuery.toLowerCase();
      const name = event.name[language].toLowerCase();
      const description = event.description ? event.description[language].toLowerCase() : '';
      const year = event.year.toString();

      return name.includes(searchLower) || 
             description.includes(searchLower) || 
             year.includes(searchLower);
    });
  }, [allEvents, searchQuery, selectedType, language]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'council': return <ScrollText size={20} className="text-indigo-400" />;
      case 'saint': return <User size={20} className="text-amber-400" />;
      case 'pope': return <Crown size={20} className="text-red-400" />;
      default: return <HistoryIcon size={20} className="text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'council': return translations.timeline?.council?.[language] || "Council";
      case 'saint': return translations.timeline?.saint?.[language] || "Saint";
      case 'pope': return translations.timeline?.pope?.[language] || "Pope";
      default: return type;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'council': return "border-indigo-500/50 bg-indigo-900/10 hover:bg-indigo-900/20";
      case 'saint': return "border-amber-500/50 bg-amber-900/10 hover:bg-amber-900/20";
      case 'pope': return "border-red-500/50 bg-red-900/10 hover:bg-red-900/20";
      default: return "border-gray-700 bg-gray-800/50";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <HistoryIcon size={32} className="text-amber-500" />
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              {translations.timeline?.title?.[language] || "Church Timeline"}
            </h1>
          </motion.div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {translations.timeline?.subtitle?.[language] || "A journey through 2000 years of Catholic history, saints, and councils."}
          </p>
        </div>

        {/* Controls: Search & Filter */}
        <div className="sticky top-20 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border border-gray-800 rounded-xl p-4 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder={translations.timeline?.searchPlaceholder?.[language] || "Search events, years..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              <Filter size={18} className="text-gray-500 mr-2 shrink-0" />
              {(['all', 'council', 'saint', 'pope'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                    selectedType === type
                      ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  {type === 'all' 
                    ? (translations.timeline?.filterAll?.[language] || "All") 
                    : getTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

          <div className="space-y-8">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                No events found matching your search.
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`relative flex items-center md:justify-between ${
                    index % 2 === 0 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Center Dot */}
                  <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-[#0a0a0a] border-2 border-amber-500 rounded-full -translate-x-1/2 z-20 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />

                  {/* Spacer for Desktop Alignment */}
                  <div className="hidden md:block w-5/12" />

                  {/* Card */}
                  <div className="w-full md:w-5/12 pl-12 md:pl-0">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`p-5 rounded-xl border cursor-pointer group relative overflow-hidden ${getEventColor(event.type)}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {/* Year Badge */}
                      <div className="absolute top-4 right-4 text-2xl font-bold text-gray-500/20 group-hover:text-amber-500/20 transition-colors">
                        {event.year}
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        {getIcon(event.type)}
                        <span className="text-xs uppercase tracking-wider font-bold text-gray-400">
                          {getTypeLabel(event.type)}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                        {event.name[language]}
                      </h3>

                      {event.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {event.description[language]}
                        </p>
                      )}

                      <div className="mt-3 flex items-center text-amber-500/50 text-xs font-medium group-hover:text-amber-500 transition-colors">
                        <span>Read more</span>
                        <ChevronRight size={14} className="ml-1" />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl relative"
            >
              {/* Header Image or Gradient */}
              <div className="h-32 bg-gradient-to-r from-amber-900/40 to-blue-900/40 relative">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-4 left-6">
                  <span className="px-3 py-1 bg-black/60 rounded-full text-amber-400 text-sm font-bold border border-amber-500/30">
                    {selectedEvent.year} AD
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  {getIcon(selectedEvent.type)}
                  <span className="text-sm text-gray-400 uppercase tracking-widest font-semibold">
                    {getTypeLabel(selectedEvent.type)}
                  </span>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6">
                  {selectedEvent.name[language]}
                </h2>

                <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-gray-300 leading-relaxed">
                    {selectedEvent.description ? selectedEvent.description[language] : "No description available."}
                  </p>
                  
                  {selectedEvent.details && (
                    <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Key Details</h4>
                      <p className="text-gray-300 text-sm">
                        {selectedEvent.details[language]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}