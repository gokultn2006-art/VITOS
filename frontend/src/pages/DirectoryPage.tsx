import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Clock,
  MapPin,
  Navigation2,
  Phone,
  Mail,
  ExternalLink,
  Activity,
  Printer,
  CreditCard,
  Briefcase,
  Home,
  GraduationCap,
  Trophy,
  ChevronRight,
  ArrowLeft,
  Building,
  ShieldCheck,
  Zap,
  Droplets,
  Wifi,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { directoryService } from '../services/api';
import type { DirectoryEntry } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

export const DirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<DirectoryEntry | null>(null);

  // Determine current view from pathname:
  // /directory -> 'root'
  // /directory/hostels -> 'hostels'
  // /directory/hostels/mens -> 'hostels-mens'
  // /directory/hostels/ladies -> 'hostels-ladies'
  // /directory/schools -> 'schools'
  // /directory/sports -> 'sports'
  const subPath = location.pathname.replace(/^\/directory\/?/, '').replace(/\/$/, '');

  useEffect(() => {
    let isMounted = true;
    directoryService.getEntries().then((data) => {
      if (isMounted) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    'all',
    'Medical Services',
    'Academic Buildings',
    'Academic Facilities',
    'Schools',
    'Hostels',
    'Administrative Offices',
    'Sports',
    'Dining & Food Courts',
    'Banking & ATMs',
    'Student Utilities',
    'Auditoriums',
    'Gates & Access',
  ];

  // Helper icons for categories
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Medical Services':
        return <Activity className="w-5 h-5 text-emerald-600" />;
      case 'Academic Facilities':
      case 'Library':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'Schools':
        return <GraduationCap className="w-5 h-5 text-indigo-600" />;
      case 'Hostels':
        return <Home className="w-5 h-5 text-[#DC2F02]" />;
      case 'Sports':
        return <Trophy className="w-5 h-5 text-amber-600" />;
      case 'Student Utilities':
        return <Printer className="w-5 h-5 text-purple-600" />;
      case 'Banking & ATMs':
        return <CreditCard className="w-5 h-5 text-amber-600" />;
      case 'Administrative Offices':
      case 'Career & Placements':
        return <Briefcase className="w-5 h-5 text-[#9D0208]" />;
      default:
        return <Building className="w-5 h-5 text-[#DC2F02]" />;
    }
  };

  // Pre-filter hierarchical sets
  const mhSubgroup = useMemo(() => entries.find((e) => e.name === "Men's Hostel"), [entries]);
  const lhSubgroup = useMemo(() => entries.find((e) => e.name === "Ladies' Hostel"), [entries]);
  const schoolsGroup = useMemo(() => entries.find((e) => e.name === 'Academic Schools'), [entries]);
  const sportsGroup = useMemo(() => entries.find((e) => e.name === 'Sports & Fitness Facilities'), [entries]);

  const mhBlocks = useMemo(() => entries.filter((e) => e.parent === mhSubgroup?.id || (mhSubgroup && String(e.parent) === String(mhSubgroup.id))), [entries, mhSubgroup]);
  const lhBlocks = useMemo(() => entries.filter((e) => e.parent === lhSubgroup?.id || (lhSubgroup && String(e.parent) === String(lhSubgroup.id))), [entries, lhSubgroup]);
  const schoolEntries = useMemo(() => entries.filter((e) => e.parent === schoolsGroup?.id || (schoolsGroup && String(e.parent) === String(schoolsGroup.id))), [entries, schoolsGroup]);
  const sportsEntries = useMemo(() => entries.filter((e) => e.parent === sportsGroup?.id || (sportsGroup && String(e.parent) === String(sportsGroup.id))), [entries, sportsGroup]);

  // Global Search Filter (combines active search query and category filter)
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((e) => {
      // Must match active category filter when not 'all'
      const matchesCategory =
        selectedCategory === 'all' ||
        e.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchesCategory) return false;

      const matchName = e.name.toLowerCase().includes(q);
      const matchShort = e.short_name?.toLowerCase().includes(q);
      const matchCat = e.category.toLowerCase().includes(q);
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchLoc = (e.location_name || e.locationName || '').toLowerCase().includes(q);
      const matchBuilding = (e.building || e.building_code || '').toLowerCase().includes(q);
      const matchKeywords = e.search_keywords?.some((k) => k.toLowerCase().includes(q));
      const matchAliases = e.aliases?.some((a) => a.toLowerCase().includes(q));
      const matchSubcat = e.subcategory?.toLowerCase().includes(q);
      const matchFacilities = e.facilities?.some((f) => f.toLowerCase().includes(q));
      const matchGender = e.gender_target?.toLowerCase().includes(q);

      // Gender query enhancement (e.g. searching 'women', 'female', 'ladies')
      const isWomenQuery = q === 'women' || q === 'female' || q === 'ladies';
      const matchWomen = isWomenQuery && (
        (e.name + ' ' + (e.subcategory || '') + ' ' + (e.gender_target || '') + ' ' + (e.description || '')).toLowerCase().includes('women') ||
        (e.name + ' ' + (e.subcategory || '') + ' ' + (e.gender_target || '') + ' ' + (e.description || '')).toLowerCase().includes('female') ||
        (e.name + ' ' + (e.subcategory || '') + ' ' + (e.gender_target || '') + ' ' + (e.description || '')).toLowerCase().includes('ladies')
      );

      return (
        matchName ||
        matchShort ||
        matchCat ||
        matchDesc ||
        matchLoc ||
        matchBuilding ||
        matchKeywords ||
        matchAliases ||
        matchSubcat ||
        matchFacilities ||
        matchGender ||
        matchWomen
      );
    });
  }, [entries, searchQuery, isSearching, selectedCategory]);

  // Root view entries (top-level groups + root-level individual services)
  const rootEntries = useMemo(() => {
    return entries.filter((e) => {
      // Include top-level items (parent is null)
      const isRoot = e.parent === null || e.parent === undefined;
      const matchesCategory = selectedCategory === 'all' || e.category.toLowerCase() === selectedCategory.toLowerCase();
      return isRoot && matchesCategory;
    });
  }, [entries, selectedCategory]);

  const navigateToMap = (entry: DirectoryEntry) => {
    if (entry.latitude == null || entry.longitude == null) return;
    const params = new URLSearchParams({
      destId: String(entry.id),
      destName: entry.name,
      lat: String(entry.latitude),
      lng: String(entry.longitude),
      loc: entry.location_name || entry.locationName || entry.building || ''
    });
    navigate(`/map?${params.toString()}`);
  };

  // Breadcrumbs generator
  const renderBreadcrumbs = () => {
    const items = [{ label: 'Campus Directory', path: '/directory' }];

    if (subPath.startsWith('hostels')) {
      items.push({ label: 'VIT Hostels', path: '/directory/hostels' });
      if (subPath === 'hostels/mens') {
        items.push({ label: "Men's Hostel", path: '/directory/hostels/mens' });
      } else if (subPath === 'hostels/ladies') {
        items.push({ label: "Ladies' Hostel", path: '/directory/hostels/ladies' });
      }
    } else if (subPath === 'schools') {
      items.push({ label: 'Academic Schools', path: '/directory/schools' });
    } else if (subPath === 'sports') {
      items.push({ label: 'Sports & Fitness', path: '/directory/sports' });
    }

    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4 overflow-x-auto py-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={item.path}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              {isLast ? (
                <span className="text-[#9D0208] font-bold">{item.label}</span>
              ) : (
                <Link to={item.path} className="hover:text-[#9D0208] hover:underline flex items-center gap-1 transition-colors">
                  {idx === 0 && <ArrowLeft className="w-3.5 h-3.5 mr-0.5" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs (if subpage) */}
      {subPath !== '' && renderBreadcrumbs()}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#370617] via-[#6A040F] to-[#9D0208] rounded-3xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#FFBA08] mb-2">
              <BookOpen className="w-3.5 h-3.5 text-[#FFBA08]" />
              <span>Official VIT Vellore Directory</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {subPath === 'hostels' && 'VIT Hostels & Residential Facilities'}
              {subPath === 'hostels/mens' && "Men's Hostel Blocks (MH)"}
              {subPath === 'hostels/ladies' && "Ladies' Hostel Blocks (LH)"}
              {subPath === 'schools' && 'Academic Schools & Dean Offices'}
              {subPath === 'sports' && 'Sports & Fitness Infrastructure'}
              {subPath === '' && 'Campus Services & Places Directory'}
            </h1>
            <p className="text-xs md:text-sm text-stone-200 mt-1 max-w-2xl">
              {subPath === 'hostels' && "Explore 29 verified men's and ladies' hostel blocks, amenities, room configurations, and administration."}
              {subPath === 'hostels/mens' && "Verified residential blocks accommodating over 17,000 residents in the North Campus."}
              {subPath === 'hostels/ladies' && "Secure residential enclave accommodating over 4,700 residents in the South Campus."}
              {subPath === 'schools' && 'Dean offices, academic departments, research specializations, and faculty contacts.'}
              {subPath === 'sports' && 'Athletics stadium, Olympic swimming pool, indoor sports complex, floodlit courts, and gymnasiums.'}
              {subPath === '' && 'Search academic buildings, schools, hostels, emergency medical services, printing cells, ATMs, and amenities.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-[#FFBA08]">Verified Campus Records</span>
            <p className="text-2xl font-black text-white">{entries.length || 86}</p>
          </div>
        </div>
      </div>

      {/* Global Search Bar & Category Filter (shown on root and subpages) */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any building, hostel block (e.g. MH-Q), school (SCOPE), clinic, ATM, gate..."
            className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs md:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills (Root view only) */}
        {!isSearching && subPath === '' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#6A040F] to-[#9D0208] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat === 'all' ? 'All Services & Groups' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center text-stone-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#9D0208] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading verified campus directory...</span>
        </div>
      )}

      {/* SEARCH RESULTS VIEW (When query is present) */}
      {!loading && isSearching && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-stone-600">
            <span>Search Results for "{searchQuery}"</span>
            <span>{searchResults.length} places found</span>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {searchResults.map((entry) => (
                <Card
                  key={entry.id}
                  className="flex flex-col justify-between hover:border-[#DC2F02]/60 transition-all cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200/70">
                          {getCategoryIcon(entry.category)}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#DC2F02] uppercase tracking-wider">
                            {entry.category}
                          </span>
                          <h3 className="font-bold text-[#03071E] text-sm leading-snug">{entry.name}</h3>
                        </div>
                      </div>

                      {entry.entry_type === 'group' && (
                        <span className="text-[10px] font-extrabold bg-amber-100 text-[#9D0208] px-2 py-0.5 rounded-full border border-amber-300">
                          Group
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{entry.description}</p>

                    {(entry.location_name || entry.locationName || entry.building) && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 pt-1 border-t border-stone-100">
                        <MapPin className="w-3.5 h-3.5 text-[#9D0208] shrink-0" />
                        <span className="truncate">{entry.location_name || entry.locationName || entry.building}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntry(entry);
                      }}
                      className="text-xs font-bold text-[#9D0208] hover:underline"
                    >
                      Details & Info
                    </button>

                    {entry.latitude != null && entry.longitude != null ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Navigation2 className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToMap(entry);
                        }}
                      >
                        Open in Map
                      </Button>
                    ) : (
                      entry.entry_type === 'group' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (entry.name.includes('Hostel')) navigate('/directory/hostels');
                            else if (entry.name.includes('School')) navigate('/directory/schools');
                            else if (entry.name.includes('Sports')) navigate('/directory/sports');
                          }}
                        >
                          Explore Group →
                        </Button>
                      )
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matching campus records"
              description={`We couldn't find any verified places matching "${searchQuery}". Try searching by block code, school acronym, or category.`}
              actionText="Clear Search"
              onAction={() => setSearchQuery('')}
            />
          )}
        </div>
      )}

      {/* VIEW 1: ROOT DIRECTORY (/directory) */}
      {!loading && !isSearching && subPath === '' && (
        <div className="space-y-6">
          {/* Top-Level Grid (Groups + Root Services) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Hierarchical Group Card: VIT HOSTELS */}
            {(selectedCategory === 'all' || selectedCategory.toLowerCase() === 'hostels') && grp_hostels_card()}

            {/* Hierarchical Group Card: ACADEMIC SCHOOLS */}
            {(selectedCategory === 'all' || selectedCategory.toLowerCase() === 'schools') && grp_schools_card()}

            {/* Hierarchical Group Card: SPORTS & FITNESS */}
            {(selectedCategory === 'all' || selectedCategory.toLowerCase() === 'sports') && grp_sports_card()}

            {/* Root Individual Services */}
            {rootEntries
              .filter((e) => e.entry_type !== 'group')
              .map((entry) => renderEntryCard(entry))}
          </div>

          {/* Empty state if category has no entries */}
          {rootEntries.length === 0 &&
            selectedCategory !== 'all' &&
            selectedCategory.toLowerCase() !== 'hostels' &&
            selectedCategory.toLowerCase() !== 'schools' &&
            selectedCategory.toLowerCase() !== 'sports' && (
              <EmptyState
                title="No directory records in this category"
                description={`There are currently no active directory entries filed under "${selectedCategory}".`}
                actionText="View All Services"
                onAction={() => setSelectedCategory('all')}
              />
            )}
        </div>
      )}

      {/* VIEW 2: HOSTELS OVERVIEW (/directory/hostels) */}
      {!loading && !isSearching && subPath === 'hostels' && renderHostelsOverview()}

      {/* VIEW 3: MEN'S HOSTELS GRID (/directory/hostels/mens) */}
      {!loading && !isSearching && subPath === 'hostels/mens' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">Men's Hostel Blocks ({mhBlocks.length})</h2>
            <span className="text-xs text-slate-500 font-semibold">North Campus • Accommodating 17,000+ Students</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mhBlocks.map((block) => renderEntryCard(block))}
          </div>
        </div>
      )}

      {/* VIEW 4: LADIES' HOSTELS GRID (/directory/hostels/ladies) */}
      {!loading && !isSearching && subPath === 'hostels/ladies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">Ladies' Hostel Blocks ({lhBlocks.length})</h2>
            <span className="text-xs text-slate-500 font-semibold">South Campus • Secure Residential Enclave</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lhBlocks.map((block) => renderEntryCard(block))}
          </div>
        </div>
      )}

      {/* VIEW 5: ACADEMIC SCHOOLS GRID (/directory/schools) */}
      {!loading && !isSearching && subPath === 'schools' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">Academic Schools ({schoolEntries.length})</h2>
            <span className="text-xs text-slate-500 font-semibold">Undergraduate & Postgraduate Faculties</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schoolEntries.map((school) => renderEntryCard(school))}
          </div>
        </div>
      )}

      {/* VIEW 6: SPORTS FACILITIES GRID (/directory/sports) */}
      {!loading && !isSearching && subPath === 'sports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">Sports & Fitness Facilities ({sportsEntries.length})</h2>
            <span className="text-xs text-slate-500 font-semibold">Department of Physical Education</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sportsEntries.map((facility) => renderEntryCard(facility))}
          </div>
        </div>
      )}

      {/* Entry Detail Modal (Verified Info, Contacts & Open in Map) */}
      {selectedEntry && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title={selectedEntry.name}
        >
          <div className="space-y-4 text-xs text-slate-600">
            {/* Category & Type Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[#9D0208] font-bold uppercase tracking-wider text-[10px]">
                {selectedEntry.category}
              </span>
              {selectedEntry.short_name && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                  {selectedEntry.short_name}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {selectedEntry.description}
            </p>

            {/* Location & Timings Details */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              {(selectedEntry.location_name || selectedEntry.locationName || selectedEntry.building) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#9D0208] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Location: </span>
                    <span>{selectedEntry.location_name || selectedEntry.locationName || selectedEntry.building}</span>
                    {selectedEntry.room_number && <span> (Room {selectedEntry.room_number})</span>}
                  </div>
                </div>
              )}

              {selectedEntry.opening_hours && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#DC2F02] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Operating Hours: </span>
                    <span>{selectedEntry.opening_hours}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Facilities / Amenities Chips */}
            {selectedEntry.facilities && selectedEntry.facilities.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 text-xs">Verified Facilities:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEntry.facilities.map((fac, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#9D0208]" />
                      <span>{fac}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information (Clickable) */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <span className="font-bold text-slate-700 text-xs">Official Contacts:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedEntry.phone ? (
                  <a
                    href={`tel:${selectedEntry.phone}`}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#9D0208] text-slate-700 hover:text-[#9D0208] flex items-center gap-2 transition-colors font-semibold"
                  >
                    <Phone className="w-4 h-4 text-[#9D0208]" />
                    <span className="truncate">{selectedEntry.phone}</span>
                  </a>
                ) : null}

                {selectedEntry.email ? (
                  <a
                    href={`mailto:${selectedEntry.email}`}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#9D0208] text-slate-700 hover:text-[#9D0208] flex items-center gap-2 transition-colors font-semibold"
                  >
                    <Mail className="w-4 h-4 text-[#9D0208]" />
                    <span className="truncate">{selectedEntry.email}</span>
                  </a>
                ) : null}

                {selectedEntry.website ? (
                  <a
                    href={selectedEntry.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#9D0208] text-slate-700 hover:text-[#9D0208] flex items-center gap-2 transition-colors font-semibold sm:col-span-2"
                  >
                    <ExternalLink className="w-4 h-4 text-[#9D0208]" />
                    <span className="truncate">Official Webpage</span>
                  </a>
                ) : null}
              </div>
            </div>

            {/* Source Verification Footer */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>Verified: {selectedEntry.last_verified || '2026-09-21'}</span>
              </span>
              {selectedEntry.source_url && (
                <a
                  href={selectedEntry.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-slate-500 font-medium"
                >
                  Source: {selectedEntry.source_name || 'vit.ac.in'}
                </a>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(null)}>
                Close
              </Button>

              {selectedEntry.latitude != null && selectedEntry.longitude != null && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Navigation2 className="w-4 h-4" />}
                  onClick={() => {
                    setSelectedEntry(null);
                    navigateToMap(selectedEntry);
                  }}
                >
                  Open in Map
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );

  // Helper renderers
  function renderEntryCard(entry: DirectoryEntry) {
    const hasCoords = entry.latitude != null && entry.longitude != null;

    return (
      <Card
        key={entry.id}
        className="flex flex-col justify-between hover:border-[#9D0208]/50 transition-all cursor-pointer"
        onClick={() => setSelectedEntry(entry)}
      >
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60">
                {getCategoryIcon(entry.category)}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-[#9D0208] uppercase tracking-wider">
                    {entry.category}
                  </span>
                  {entry.gender_target && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      entry.gender_target === 'Women' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      entry.gender_target === 'Men' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {entry.gender_target}
                    </span>
                  )}
                  {entry.facility_count && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {entry.facility_count} {entry.facility_count > 1 ? 'Units' : 'Unit'}
                    </span>
                  )}
                  {entry.source_type === 'osm_verified' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      OSM
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 text-base leading-snug">{entry.name}</h3>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-2">{entry.description}</p>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
            {(entry.location_name || entry.locationName || entry.building) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#9D0208] shrink-0" />
                <span className="truncate">{entry.location_name || entry.locationName || entry.building}</span>
              </div>
            )}
            {entry.opening_hours && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#DC2F02] shrink-0" />
                <span className="truncate">{entry.opening_hours}</span>
              </div>
            )}
            {entry.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{entry.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEntry(entry);
            }}
            className="text-xs font-bold text-[#9D0208] hover:underline"
          >
            Details
          </button>

          {hasCoords ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Navigation2 className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                navigateToMap(entry);
              }}
            >
              Open in Map
            </Button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No GPS coordinates</span>
          )}
        </div>
      </Card>
    );
  }

  function grp_hostels_card() {
    return (
      <Card
        className="p-6 border-2 border-amber-200 bg-gradient-to-br from-amber-50/70 to-white flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
        onClick={() => navigate('/directory/hostels')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#9D0208] uppercase tracking-wider flex items-center gap-1.5">
              <Home className="w-4 h-4 text-[#DC2F02]" />
              <span>Hostels</span>
            </span>
            <span className="text-xs font-bold bg-[#9D0208] text-white px-2.5 py-0.5 rounded-full">
              29 Blocks
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-800">VIT Hostels</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Explore men's and ladies' hostel blocks, dining messes, gymnasiums, solar water heating, and administration contacts.
          </p>
        </div>

        <div className="pt-4 border-t border-amber-100 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/directory/hostels');
            }}
          >
            Explore Hostels →
          </Button>
        </div>
      </Card>
    );
  }

  function grp_schools_card() {
    return (
      <Card
        className="p-6 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
        onClick={() => navigate('/directory/schools')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Schools</span>
            </span>
            <span className="text-xs font-bold bg-indigo-700 text-white px-2.5 py-0.5 rounded-full">
              12 Schools
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-800">Academic Schools</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Undergraduate and postgraduate engineering schools (SCOPE, SENSE, SELECT, SMEC, SCE), Science (SAS), Languages (SSL), and Business School.
          </p>
        </div>

        <div className="pt-4 border-t border-indigo-100 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/directory/schools');
            }}
          >
            Explore Schools →
          </Button>
        </div>
      </Card>
    );
  }

  function grp_sports_card() {
    return (
      <Card
        className="p-6 border-2 border-amber-200 bg-gradient-to-br from-amber-50/60 to-white flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
        onClick={() => navigate('/directory/sports')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Sports</span>
            </span>
            <span className="text-xs font-bold bg-amber-600 text-white px-2.5 py-0.5 rounded-full">
              5 Facilities
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-800">Sports & Fitness</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Main Athletics Stadium, 50m Olympic swimming pool, indoor badminton & basketball courts, floodlit tennis, and central AC gymnasium.
          </p>
        </div>

        <div className="pt-4 border-t border-amber-100 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/directory/sports');
            }}
          >
            Explore Sports →
          </Button>
        </div>
      </Card>
    );
  }

  function renderHostelsOverview() {
    return (
      <div className="space-y-6">
        {/* Two Major Cards: Men's Hostel & Ladies' Hostel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Men's Hostel Card */}
          <Card
            className="p-6 border-2 border-[#9D0208]/40 bg-white hover:border-[#9D0208] hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#9D0208] uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full">
                  North Campus
                </span>
                <span className="text-xs font-bold bg-[#9D0208] text-white px-2.5 py-0.5 rounded-full">
                  {mhBlocks.length || 20} Blocks
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Men's Hostel</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                20 verified residential blocks (MH-A through MH-T) accommodating over 17,000 residents with single, double, and deluxe room configurations.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2">
                <Phone className="w-3.5 h-3.5 text-[#9D0208]" />
                <span>+91 416 220 2527 (Hostel Office)</span>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 mt-4 flex justify-end">
              <Button variant="primary" size="md" onClick={() => navigate('/directory/hostels/mens')}>
                View Men's Hostels →
              </Button>
            </div>
          </Card>

          {/* Ladies' Hostel Card */}
          <Card
            className="p-6 border-2 border-[#DC2F02]/40 bg-white hover:border-[#DC2F02] hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#DC2F02] uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full">
                  South Campus
                </span>
                <span className="text-xs font-bold bg-[#DC2F02] text-white px-2.5 py-0.5 rounded-full">
                  {lhBlocks.length || 9} Blocks
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Ladies' Hostel</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                9 verified residential blocks (LH-A through LH-J) including modern apartment-style blocks, beauty salon, pharmacy, and central dining halls.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2">
                <Phone className="w-3.5 h-3.5 text-[#DC2F02]" />
                <span>+91 416 220 2712 (Hostel Office)</span>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 mt-4 flex justify-end">
              <Button variant="primary" size="md" onClick={() => navigate('/directory/hostels/ladies')}>
                View Ladies' Hostels →
              </Button>
            </div>
          </Card>
        </div>

        {/* Compact Hostel Facilities Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-[#9D0208]" />
            <h3 className="font-extrabold text-slate-800 text-sm">Verified Hostel Facilities & Amenities</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
            {[
              { label: 'AC & Non-AC Rooms', icon: <Building className="w-4 h-4 text-[#DC2F02]" /> },
              { label: 'High-Speed Wi-Fi', icon: <Wifi className="w-4 h-4 text-blue-600" /> },
              { label: '24/7 Power Backup', icon: <Zap className="w-4 h-4 text-amber-600" /> },
              { label: 'RO Water Treatment', icon: <Droplets className="w-4 h-4 text-cyan-600" /> },
              { label: 'Mechanized Laundry', icon: <Printer className="w-4 h-4 text-purple-600" /> },
              { label: 'Indoor Gyms', icon: <Trophy className="w-4 h-4 text-emerald-600" /> },
              { label: 'First Aid & Ambulances', icon: <Activity className="w-4 h-4 text-rose-600" /> },
              { label: '24/7 Security & CCTV', icon: <ShieldCheck className="w-4 h-4 text-slate-700" /> },
            ].map((fac, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2.5">
                {fac.icon}
                <span className="text-xs font-bold text-slate-700">{fac.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hostel Administration Contacts Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4.5 h-4.5 text-[#9D0208]" />
            <h3 className="font-extrabold text-slate-800 text-sm">Hostel Administration & Contacts</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Men's Hostel Admin */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-extrabold text-[#9D0208] uppercase">Men's Hostel Administration</span>
              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div>
                  <span className="font-semibold text-slate-800">Director Office: </span>
                  <a href="tel:04162202520" className="text-[#9D0208] hover:underline font-mono">0416-220 2520</a>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Email: </span>
                  <a href="mailto:director.mh@vit.ac.in" className="text-[#9D0208] hover:underline">director.mh@vit.ac.in</a>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Hostel Office (24/7): </span>
                  <a href="tel:+914162202527" className="text-[#9D0208] hover:underline font-mono">+91 416 220 2527</a>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Chief Warden: </span>
                  <a href="mailto:cw.mh@vit.ac.in" className="text-[#9D0208] hover:underline">cw.mh@vit.ac.in</a>
                </div>
              </div>
            </div>

            {/* Ladies' Hostel Admin */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-extrabold text-[#DC2F02] uppercase">Ladies' Hostel Administration</span>
              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div>
                  <span className="font-semibold text-slate-800">Director Office: </span>
                  <a href="tel:04162202712" className="text-[#DC2F02] hover:underline font-mono">0416-220 2712</a>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Email: </span>
                  <a href="mailto:director.lh@vit.ac.in" className="text-[#DC2F02] hover:underline">director.lh@vit.ac.in</a>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Hostel Office: </span>
                  <a href="tel:04162202710" className="text-[#DC2F02] hover:underline font-mono">0416-220 2710</a>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Chief Warden: </span>
                  <a href="mailto:cw.lh@vit.ac.in" className="text-[#DC2F02] hover:underline">cw.lh@vit.ac.in</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
