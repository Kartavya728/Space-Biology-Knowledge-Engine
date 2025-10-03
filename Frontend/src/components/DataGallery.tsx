import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LoadingAnimation } from './LoadingAnimation';
import { DocBox, PaperProps } from './DocBox'; // Import DocBox and its PaperProps
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Calendar,
  Users,
  Sparkles,
  ExternalLink,
  FileText,
  Database,
  Clock, // For recently published
  Tag // For topic-based
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DataGallery({ userType, theme, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState<PaperProps[]>([]);
  const [recommendations, setRecommendations] = useState<PaperProps[]>([]);
  const [recentlyPublished, setRecentlyPublished] = useState<PaperProps[]>([]);
  const [topicBasedPapers, setTopicBasedPapers] = useState<PaperProps[]>([]); // New state for topic papers
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<PaperProps | null>(null);
  const [activeTab, setActiveTab] = useState('search');

  // Filters for topic-based research
  const [topicFilters, setTopicFilters] = useState({
    category: '',
    experimentType: '',
    dataFile: ''
  });

  const [searchFilters, setSearchFilters] = useState({
    year: '',
    institution: '',
    topic: '',
    minCitations: ''
  });

  // Mock Data for demonstration
  const mockPapers: PaperProps[] = [
    {
      id: 'mock_paper_1',
      title: 'Effects of Microgravity on Human Cardiovascular System',
      authors: ['Dr. Sarah Chen', 'Dr. Michael Rodriguez'],
      institution: 'NASA Johnson Space Center',
      publicationYear: 2024,
      abstract: 'This study investigates the cardiovascular adaptations that occur in astronauts during long-duration space missions, analyzing heart rate variability, blood pressure changes, and cardiac output under microgravity conditions. Key findings suggest significant transient adaptations that normalize post-flight.',
      tags: ['cardiovascular', 'microgravity', 'space medicine', 'human physiology'],
      citationCount: 127,
      relevanceScore: 0.95,
      downloadUrl: 'https://example.com/papers/mock_paper_1.pdf',
      externalUrl: 'https://nasa.gov/papers/mock_paper_1',
    },
    {
      id: 'mock_paper_2',
      title: 'Advanced Life Support Systems for Lunar Habitats',
      authors: ['Dr. Emily White', 'Dr. David Brown'],
      institution: 'Kennedy Space Center',
      publicationYear: 2023,
      abstract: 'Development and testing of closed-loop life support systems for sustainable lunar outposts. Focus on water recycling, atmospheric regeneration, and waste management to minimize resupply needs.',
      tags: ['life support', 'lunar mission', 'engineering', 'sustainability'],
      citationCount: 88,
      relevanceScore: 0.88,
      downloadUrl: 'https://example.com/papers/mock_paper_2.pdf',
      externalUrl: 'https://nasa.gov/papers/mock_paper_2',
    },
    {
      id: 'mock_paper_3',
      title: 'Plant Growth in Martian Regolith Simulant',
      authors: ['Dr. Kenji Tanaka', 'Dr. Lena Schmidt'],
      institution: 'Jet Propulsion Laboratory',
      publicationYear: 2024,
      abstract: 'Experimental investigation into the viability of growing various plant species in simulated Martian soil, focusing on nutrient uptake, biomass production, and genetic expression under low atmospheric pressure.',
      tags: ['astrobiology', 'plants', 'mars', 'agriculture', 'regolith'],
      citationCount: 65,
      relevanceScore: 0.92,
      downloadUrl: 'https://example.com/papers/mock_paper_3.pdf',
      externalUrl: 'https://nasa.gov/papers/mock_paper_3',
    },
    {
      id: 'mock_paper_4',
      title: 'Immunological Responses to Long-Duration Spaceflight',
      authors: ['Dr. Olivia Green', 'Dr. Noah Black'],
      institution: 'Baylor College of Medicine',
      publicationYear: 2023,
      abstract: 'A comprehensive review of immunological changes observed in astronauts during extended periods in space, including altered cytokine profiles, T-cell function, and viral reactivation risks.',
      tags: ['immunology', 'space medicine', 'human health', 'microbiology'],
      citationCount: 72,
      relevanceScore: 0.87,
      downloadUrl: 'https://example.com/papers/mock_paper_4.pdf',
      externalUrl: 'https://nasa.gov/papers/mock_paper_4',
    },
    {
      id: 'mock_paper_5',
      title: 'Development of Advanced Radiation Shielding Materials',
      authors: ['Dr. Anya Sharma', 'Dr. Ben Carter'],
      institution: 'University of Texas at Austin',
      publicationYear: 2024,
      abstract: 'Research into novel composite materials for enhanced radiation protection in spacecraft and habitats, evaluating their effectiveness against galactic cosmic rays and solar particle events.',
      tags: ['radiation protection', 'materials science', 'engineering', 'spacecraft design'],
      citationCount: 91,
      relevanceScore: 0.90,
      downloadUrl: 'https://example.com/papers/mock_paper_5.pdf',
      externalUrl: 'https://nasa.gov/papers/mock_paper_5',
    },
    {
      id: 'mock_paper_6',
      title: 'Behavioral Health and Performance in Isolated Environments',
      authors: ['Dr. Lena Kovacs', 'Dr. Mark Johnson'],
      institution: 'University of Pennsylvania',
      publicationYear: 2022,
      abstract: 'Psychological and cognitive performance studies in analogues for long-duration space missions, examining the impact of isolation, confinement, and stress on crew cohesion and mission success.',
      tags: ['psychology', 'behavioral health', 'analog missions', 'human factors'],
      citationCount: 55,
      relevanceScore: 0.80,
      downloadUrl: 'https://example.com/papers/mock_paper_6.pdf',
      externalUrl: 'https://nasa.gov/papers/mock_paper_6',
    },
    {
      id: 'mock_paper_7',
      title: 'Algae-Based Bioregenerative Life Support Systems',
      authors: ['Dr. Kai Wong', 'Dr. Susan Davis'],
      institution: 'Georgia Tech',
      publicationYear: 2024,
      abstract: 'Exploring the use of various microalgae species for oxygen production, CO2 scrubbing, and wastewater treatment in bioregenerative life support systems for space habitats.',
      tags: ['bioregenerative life support', 'algae', 'wastewater treatment', 'biology'],
      citationCount: 45,
      relevanceScore: 0.85,
      downloadUrl: 'https://example.com/papers/mock_paper_7.pdf',
      externalUrl: 'https://nasa.gov/papers/mock_paper_7',
    },
    {
      id: 'mock_paper_8',
      title: 'Robotic Assistance for Extravehicular Activities (EVAs)',
      authors: ['Dr. Hiroshi Sato', 'Dr. Mia Chang'],
      institution: 'Carnegie Mellon University',
      publicationYear: 2023,
      abstract: 'Design and validation of robotic systems to assist astronauts with complex tasks during EVAs, aiming to reduce astronaut workload and enhance safety in harsh space environments.',
      tags: ['robotics', 'EVA', 'space engineering', 'automation'],
      citationCount: 78,
      relevanceScore: 0.89,
      downloadUrl: 'https://example.com/papers/mock_paper_8.pdf',
      externalUrl: 'https://nasa.gov/papers/mock_paper_8',
    },
    {
      id: 'mock_paper_9',
      title: 'Impact of Space Dust on Optical Instruments',
      authors: ['Dr. John Smith', 'Dr. Lena Mueller'],
      institution: 'University of Colorado Boulder',
      publicationYear: 2024,
      abstract: 'Analysis of how lunar and Martian dust affects the performance and longevity of optical instruments, with strategies for mitigation and self-cleaning mechanisms.',
      tags: ['space dust', 'optics', 'instrumentation', 'lunar exploration'],
      citationCount: 30,
      relevanceScore: 0.78,
      downloadUrl: 'https://example.com/papers/mock_paper_9.pdf',
      externalUrl: 'https://nasa.gov/papers/mock_paper_9',
    },
    {
      id: 'mock_paper_10',
      title: 'Gut Microbiome Dynamics in Simulated Spaceflight',
      authors: ['Dr. Wei Li', 'Dr. Karen Evans'],
      institution: 'University of California, Davis',
      publicationYear: 2023,
      abstract: 'Investigating the changes in the human gut microbiome composition and function under simulated spaceflight conditions, and its implications for astronaut health and nutrition.',
      tags: ['microbiome', 'gastrointestinal', 'human health', 'nutrition'],
      citationCount: 60,
      relevanceScore: 0.84,
      downloadUrl: 'https://example.com/papers/mock_paper_10.pdf',
      externalUrl: 'https://nasa.gov/papers/mock_paper_10',
    },
  ];

  const mockRecommendations: PaperProps[] = [
    {
      id: 'rec_1',
      title: 'Breakthrough Discoveries in Space Radiation Protection',
      reason: 'Based on your interest in space medicine',
      relevanceScore: 0.85,
      type: 'recommended',
      abstract: 'Recent advances in radiation shielding technologies for long-duration space missions, including novel composite materials and active magnetic shielding systems. This paper also explores the biological impact of different radiation types.',
      authors: ['Dr. Alex Kim', 'Dr. Maria Santos'],
      institution: 'NASA Ames Research Center',
      publicationYear: 2024,
      tags: ['radiation protection', 'space medicine', 'shielding', 'materials science'],
      citationCount: 156,
      downloadUrl: 'https://example.com/papers/rec_1.pdf',
      externalUrl: 'https://nasa.gov/papers/rec_1',
    },
    {
      id: 'rec_2',
      title: 'AI Applications in Mission Control Systems',
      reason: 'Popular among researchers this month',
      relevanceScore: 0.82,
      type: 'recommended',
      abstract: 'Integration of artificial intelligence in autonomous mission control and decision-making systems for enhanced efficiency and safety. Covers topics such as predictive maintenance and intelligent anomaly detection.',
      authors: ['Dr. Robert Chen', 'Dr. Jennifer Lee'],
      institution: 'Stanford University',
      publicationYear: 2024,
      tags: ['artificial intelligence', 'mission control', 'automation', 'software engineering'],
      citationCount: 98,
      downloadUrl: 'https://example.com/papers/rec_2.pdf',
      externalUrl: 'https://nasa.gov/papers/rec_2',
    }
  ];

  // test connection
  const testServerConnection = async () => {
    try {
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-0a8c168d/health`;
      const response = await fetch(healthUrl, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        console.log('Server health check:', await response.json());
      }
    } catch (error) {
      console.error('Server connection error:', error);
    }
  };

  useEffect(() => {
    testServerConnection();
    loadRecentlyPublished();
    if (user?.id) {
      loadRecommendations();
    }
    loadTopicBasedPapers(); // Load initial topic papers
  }, [user]);

  const loadRecentlyPublished = async () => {
    setLoading(true);
    try {
      // Mock recently published data (e.g., last 3 papers from mockPapers)
      const recent = mockPapers.filter(p => p.publicationYear === 2024).slice(0, 3).map(p => ({...p, type: 'recentlyPublished'}));
      setRecentlyPublished(recent);

      // In a real scenario, you'd fetch this from your backend
      // const url = `https://${projectId}.supabase.co/functions/v1/make-server-0a8c168d/recently-published`;
      // const response = await fetch(url, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
      // if (response.ok) {
      //   const data = await response.json();
      //   setRecentlyPublished(data.papers);
      // }
    } catch (error) {
      console.error('Failed to load recently published papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      setRecommendations(mockRecommendations); // Use mock data
      if (!user?.id) return;

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-0a8c168d/recommendations/${user.id}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.recommendations?.length > 0) {
          setRecommendations(data.recommendations.map((p: PaperProps) => ({...p, type: 'recommended'})));
        }
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const loadTopicBasedPapers = async (filters = topicFilters) => {
    setLoading(true);
    try {
      // Filter mockPapers based on topicFilters
      const filtered = mockPapers.filter(paper => {
        const matchesCategory = filters.category ? paper.tags.some(tag => tag.toLowerCase().includes(filters.category.toLowerCase())) : true;
        const matchesExperimentType = filters.experimentType ? paper.tags.some(tag => tag.toLowerCase().includes(filters.experimentType.toLowerCase())) : true;
        const matchesDataFile = filters.dataFile ? paper.tags.some(tag => tag.toLowerCase().includes(filters.dataFile.toLowerCase())) : true;
        return matchesCategory && matchesExperimentType && matchesDataFile;
      }).map(p => ({...p, type: 'topicBased'}));

      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call delay
      setTopicBasedPapers(filtered);

      // In a real app, you'd fetch from your backend with filters
      // const url = `https://${projectId}.supabase.co/functions/v1/make-server-0a8c168d/topic-papers`;
      // const response = await fetch(url, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ filters, userId: user?.id })
      // });
      // if (response.ok) {
      //   const data = await response.json();
      //   setTopicBasedPapers(data.papers);
      // }
    } catch (error) {
      console.error('Failed to load topic-based papers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopicBasedPapers(); // Reload when topic filters change
  }, [topicFilters]);


  const searchPapers = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);

    try {
      // Filter mock papers based on search query and searchFilters
      const filteredSearchPapers = mockPapers.filter(paper => {
        const queryMatch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           paper.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const yearMatch = searchFilters.year ? paper.publicationYear === parseInt(searchFilters.year) : true;
        const institutionMatch = searchFilters.institution ? paper.institution.toLowerCase().includes(searchFilters.institution.toLowerCase()) : true;
        const topicMatch = searchFilters.topic ? paper.tags.some(tag => tag.toLowerCase().includes(searchFilters.topic.toLowerCase())) : true;
        const minCitationsMatch = searchFilters.minCitations ? paper.citationCount >= parseInt(searchFilters.minCitations) : true;

        return queryMatch && yearMatch && institutionMatch && topicMatch && minCitationsMatch;
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      setPapers(filteredSearchPapers.map(p => ({...p, type: 'search'})));

      // Real API call (if available)
      // const url = `https://${projectId}.supabase.co/functions/v1/make-server-0a8c168d/search-papers`;
      // const requestBody = { query: searchQuery, filters: searchFilters, userId: user?.id, limit: 20 };
      // const response = await fetch(url, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify(requestBody),
      // });
      // if (response.ok) {
      //   const data = await response.json();
      //   if (data.papers?.length > 0) setPapers(data.papers);
      //   setTimeout(loadRecommendations, 1000);
      // }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackInteraction = async (paperId: string, action: string, metadata = {}) => {
    try {
      // await fetch(
      //   `https://${projectId}.supabase.co/functions/v1/make-server-0a8c168d/track-interaction`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${publicAnonKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({ userId: user?.id, paperId, action, metadata }),
      //   }
      // );
      console.log(`Tracking interaction: ${action} for paper ${paperId}`);
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const handlePaperClick = (paper: PaperProps) => {
    setSelectedPaper(paper);
    trackInteraction(paper.id, 'view');
  };

  const handleDownload = (paper: PaperProps, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    trackInteraction(paper.id, 'download');
    console.log('Downloading paper:', paper.title);
    if (paper.downloadUrl) {
      window.open(paper.downloadUrl, '_blank');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchPapers();
    }
  };

  const clearSearchFilters = () => {
    setSearchFilters({ year: '', institution: '', topic: '', minCitations: '' });
  };

  const clearTopicFilters = () => {
    setTopicFilters({ category: '', experimentType: '', dataFile: '' });
  };

  const EmptyState = ({ type }: { type: 'search' | 'results' | 'recommendations' | 'recent' | 'topic' }) => {
    const messages = {
      search: {
        icon: Search,
        title: "Discover Research Papers",
        description: "Use semantic search to find relevant NASA research papers and space life sciences studies.",
        action: "Start by typing your research query above"
      },
      results: {
        icon: FileText,
        title: "No Results Found",
        description: "Try adjusting your search terms or filters to find relevant papers.",
        action: "Modify your search or explore recommendations"
      },
      recommendations: {
        icon: Sparkles,
        title: "No Recommendations Yet",
        description: "Your personalized recommendations will appear here based on your activity.",
        action: "Start searching and interacting with papers to get recommendations"
      },
      recent: {
        icon: Clock,
        title: "No Recently Published Papers",
        description: "Check back later for the latest research papers.",
        action: "Stay tuned for new publications"
      },
      topic: {
        icon: Tag,
        title: "No Papers for this Topic",
        description: "Adjust your topic filters or explore other categories.",
        action: "Try different filters or browse all topics"
      }
    };

    const message = messages[type];
    const Icon = message.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${theme.primary} mx-auto mb-6 flex items-center justify-center`}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl text-white mb-3">{message.title}</h3>
        <p className="text-gray-400 mb-4 max-w-md mx-auto">{message.description}</p>
        <p className="text-sm text-gray-500">{message.action}</p>
      </motion.div>
    );
  };

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-full bg-gradient-to-r ${theme.primary}`}>
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl text-white">Data Gallery</h1>
              <p className="text-gray-400">Search and explore NASA research papers and space life sciences data</p>
              {/* <p className="text-xs text-gray-500 mt-1">Debug: User ID = {user?.id || 'No user'}</p> */}
            </div>
          </div>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search research papers using semantic search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                <Button
                  onClick={searchPapers}
                  disabled={loading || !searchQuery.trim()}
                  className={`bg-gradient-to-r ${theme.primary} hover:opacity-90 px-8`}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              {/* Filters for Search */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={searchFilters.year} onValueChange={(value) => setSearchFilters({...searchFilters, year: value})}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Publication Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {/* Remove value="" from SelectItem, use undefined instead */}
                    <SelectItem value={undefined}>All Years</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2020">2020</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={searchFilters.institution} onValueChange={(value) => setSearchFilters({...searchFilters, institution: value})}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Institution" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value={undefined}>All Institutions</SelectItem>
                    <SelectItem value="nasa">NASA</SelectItem>
                    <SelectItem value="esa">ESA</SelectItem>
                    <SelectItem value="mit">MIT</SelectItem>
                    <SelectItem value="stanford">Stanford</SelectItem>
                    <SelectItem value="harvard">Harvard</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={searchFilters.topic} onValueChange={(value) => setSearchFilters({...searchFilters, topic: value})}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Research Topic" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value={undefined}>All Topics</SelectItem>
                    <SelectItem value="microgravity">Microgravity</SelectItem>
                    <SelectItem value="space-medicine">Space Medicine</SelectItem>
                    <SelectItem value="astrobiology">Astrobiology</SelectItem>
                    <SelectItem value="life-support">Life Support</SelectItem>
                    <SelectItem value="radiation">Radiation</SelectItem>
                    <SelectItem value="plants">Plants</SelectItem>
                    <SelectItem value="animals">Animals</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min Citations"
                    value={searchFilters.minCitations}
                    onChange={(e) => setSearchFilters({...searchFilters, minCitations: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                  <Button
                    variant="ghost"
                    onClick={clearSearchFilters}
                    className="text-gray-400 hover:text-white px-3"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recently Published Papers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-full bg-gradient-to-r ${theme.primary} text-white`}>
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-2xl text-white">Recently Published Papers</h2>
          </div>
          {loading && recentlyPublished.length === 0 ? (
            <div className="py-10">
              <LoadingAnimation userType={userType} theme={theme} />
            </div>
          ) : recentlyPublished.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {recentlyPublished.map((paper) => (
                  <DocBox
                    key={paper.id}
                    paper={paper}
                    theme={theme}
                    onPaperClick={handlePaperClick}
                    onDownload={handleDownload}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState type="recent" />
          )}
        </motion.div>

        {/* Research Papers by Topic Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-full bg-gradient-to-r ${theme.primary} text-white`}>
              <Tag className="w-5 h-5" />
            </div>
            <h2 className="text-2xl text-white">Research Papers by Topic</h2>
          </div>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={topicFilters.category} onValueChange={(value) => setTopicFilters({...topicFilters, category: value})}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value={undefined}>All Categories</SelectItem>
                    <SelectItem value="biology">Biological</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="medicine">Space Medicine</SelectItem>
                    <SelectItem value="astrobiology">Astrobiology</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={topicFilters.experimentType} onValueChange={(value) => setTopicFilters({...topicFilters, experimentType: value})}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Experiment Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value={undefined}>All Experiment Types</SelectItem>
                    <SelectItem value="plants">Plants Research</SelectItem>
                    <SelectItem value="animals">Animals Research</SelectItem>
                    <SelectItem value="human">Human Studies</SelectItem>
                    <SelectItem value="environmental">Environmental Experiments</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Select value={topicFilters.dataFile} onValueChange={(value) => setTopicFilters({...topicFilters, dataFile: value})}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Data Filter" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value={undefined}>All Data Files</SelectItem>
                      <SelectItem value="genomics">Genomics Data</SelectItem>
                      <SelectItem value="proteomics">Proteomics Data</SelectItem>
                      <SelectItem value="imaging">Imaging Data</SelectItem>
                      <SelectItem value="sensor">Sensor Data</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    onClick={clearTopicFilters}
                    className="text-gray-400 hover:text-white px-3"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && topicBasedPapers.length === 0 ? (
            <div className="py-10">
              <LoadingAnimation userType={userType} theme={theme} />
            </div>
          ) : topicBasedPapers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {topicBasedPapers.map((paper) => (
                  <DocBox
                    key={paper.id}
                    paper={paper}
                    theme={theme}
                    onPaperClick={handlePaperClick}
                    onDownload={handleDownload}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState type="topic" />
          )}
        </motion.div>


        {/* Tabs for Search Results and Recommendations */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-10">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
            <TabsTrigger value="search" className="data-[state=active]:bg-white/20">
              <Search className="w-4 h-4 mr-2" />
              Search Results
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-white/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-6">
            {loading && hasSearched && papers.length === 0 ? ( // Only show loading if actively searching
              <div className="py-16">
                <LoadingAnimation userType={userType} theme={theme} />
              </div>
            ) : hasSearched && papers.length === 0 ? (
              <EmptyState type="results" />
            ) : hasSearched ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {papers.map((paper) => (
                    <DocBox key={paper.id} paper={paper} theme={theme} onPaperClick={handlePaperClick} onDownload={handleDownload} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState type="search" />
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            {recommendations.length > 0 ? (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl text-white mb-2">Personalized for You</h3>
                  <p className="text-gray-400">Based on your search history and research interests</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {recommendations.map((paper) => (
                      <DocBox key={paper.id} paper={paper} theme={theme} onPaperClick={handlePaperClick} onDownload={handleDownload} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <EmptyState type="recommendations" />
            )}
          </TabsContent>
        </Tabs>

        {/* Paper Detail Modal */}
        <AnimatePresence>
          {selectedPaper && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedPaper(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-white/20 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl text-white pr-8">{selectedPaper.title}</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedPaper(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <div className="mb-6">
                      <h3 className="text-lg text-white mb-2">Abstract</h3>
                      <p className="text-gray-300">{selectedPaper.abstract}</p>
                    </div>

                    {/* Assuming Key Findings and NASA Datasets could be part of PaperProps or extended */}
                    {/* For now, just showing general info. If these are always present, add to PaperProps */}
                    {selectedPaper.id === 'mock_paper_1' && ( // Example conditional rendering
                      <div className="mb-6">
                        <h3 className="text-lg text-white mb-2">Key Findings</h3>
                        <ul className="space-y-2">
                          <li className="text-gray-300 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            Cardiac output decreased by 15% after 30 days in microgravity
                          </li>
                          <li className="text-gray-300 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            Blood pressure regulation mechanisms adapted within 60 days
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white mb-2">Authors</h4>
                        <p className="text-gray-300 text-sm">{selectedPaper.authors?.join(', ')}</p>
                      </div>

                      <div>
                        <h4 className="text-white mb-2">Publication Year</h4>
                        <p className="text-gray-300 text-sm">{selectedPaper.publicationYear}</p>
                      </div>

                      <div>
                        <h4 className="text-white mb-2">Institution</h4>
                        <p className="text-gray-300 text-sm">{selectedPaper.institution}</p>
                      </div>

                      <div>
                        <h4 className="text-white mb-2">Citations</h4>
                        <p className="text-gray-300 text-sm">{selectedPaper.citationCount}</p>
                      </div>

                      {selectedPaper.tags && (
                        <div>
                          <h4 className="text-white mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedPaper.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-white/20 text-gray-300">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 space-y-2">
                        {selectedPaper.downloadUrl && (
                          <Button
                            onClick={() => handleDownload(selectedPaper)}
                            className={`w-full bg-gradient-to-r ${theme.primary}`}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                        )}
                        {selectedPaper.externalUrl && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(selectedPaper.externalUrl, '_blank')}
                            className="w-full border-white/20 text-white"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Online
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}