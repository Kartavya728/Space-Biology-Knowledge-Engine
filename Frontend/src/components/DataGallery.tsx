import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LoadingAnimation } from './LoadingAnimation';
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
  Database
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DataGallery({ userType, theme, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [filters, setFilters] = useState({
    year: '',
    institution: '',
    topic: '',
    minCitations: ''
  });

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
    if (user?.id) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    try {
      // mock data
      const mockRecommendations = [
        {
          id: 'rec_1',
          title: 'Breakthrough Discoveries in Space Radiation Protection',
          reason: 'Based on your interest in space medicine',
          relevanceScore: 0.85,
          type: 'trending',
          abstract: 'Recent advances in radiation shielding technologies for long-duration space missions.',
          authors: ['Dr. Alex Kim', 'Dr. Maria Santos'],
          institution: 'NASA Ames Research Center',
          publicationYear: 2024,
          tags: ['radiation protection', 'space medicine', 'shielding'],
          citationCount: 156
        },
        {
          id: 'rec_2',
          title: 'AI Applications in Mission Control Systems',
          reason: 'Popular among researchers this month',
          relevanceScore: 0.82,
          type: 'popular',
          abstract: 'Integration of artificial intelligence in autonomous mission control and decision-making systems.',
          authors: ['Dr. Robert Chen', 'Dr. Jennifer Lee'],
          institution: 'Stanford University',
          publicationYear: 2024,
          tags: ['artificial intelligence', 'mission control', 'automation'],
          citationCount: 98
        }
      ];
      setRecommendations(mockRecommendations);

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
          setRecommendations(data.recommendations);
        }
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const searchPapers = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);

    // mock data
    const mockPapers = [
      {
        id: 'mock_paper_1',
        title: 'Effects of Microgravity on Human Cardiovascular System',
        authors: ['Dr. Sarah Chen', 'Dr. Michael Rodriguez'],
        institution: 'NASA Johnson Space Center',
        journal: 'Space Medicine Journal',
        publicationYear: 2024,
        abstract: 'This study investigates the cardiovascular adaptations that occur in astronauts...',
        tags: ['cardiovascular', 'microgravity', 'space medicine'],
        citationCount: 127,
        relevanceScore: 0.95,
        downloadUrl: 'https://example.com/papers/mock_paper_1.pdf',
        nasaDatasets: ['OSDR-142: Cardiovascular Function Study'],
        fundingSource: 'NASA Space Biology Program',
        methodology: 'Longitudinal study with 45 subjects',
        keyFindings: [
          'Cardiac output decreased by 15% after 30 days in microgravity',
          'Blood pressure regulation mechanisms adapted within 60 days'
        ]
      }
    ];

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPapers(mockPapers);

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-0a8c168d/search-papers`;
      const requestBody = { query: searchQuery, filters, userId: user?.id, limit: 20 };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.papers?.length > 0) setPapers(data.papers);
        setTimeout(loadRecommendations, 1000);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackInteraction = async (paperId, action, metadata = {}) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a8c168d/track-interaction`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user?.id, paperId, action, metadata }),
        }
      );
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const handlePaperClick = (paper) => {
    setSelectedPaper(paper);
    trackInteraction(paper.id, 'view');
  };

  const handleDownload = (paper, event) => {
    if (event) event.stopPropagation();
    trackInteraction(paper.id, 'download');
    console.log('Downloading paper:', paper.title);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPapers();
    }
  };

  const clearFilters = () => {
    setFilters({ year: '', institution: '', topic: '', minCitations: '' });
  };

  const PaperCard = ({ paper, isRecommendation = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all"
        onClick={() => handlePaperClick(paper)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-white text-lg leading-tight line-clamp-2">
              {paper.title}
            </CardTitle>
            {isRecommendation && (
              <Badge className={`bg-gradient-to-r ${theme.primary} text-white shrink-0`}>
                <Sparkles className="w-3 h-3 mr-1" />
                Recommended
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Users className="w-4 h-4" />
            <span>{paper.authors?.slice(0, 2).join(', ')}{paper.authors?.length > 2 ? ' et al.' : ''}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{paper.publicationYear}</span>
            <span>•</span>
            <span>{paper.institution}</span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-gray-300 text-sm mb-4 line-clamp-3">
            {paper.abstract}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {paper.tags?.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs border-white/20 text-gray-300">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{paper.citationCount}</span>
              </div>
              {paper.relevanceScore && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{(paper.relevanceScore * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => handleDownload(paper, e)}
                className="text-gray-300 hover:text-white p-2"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-300 hover:text-white p-2"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {isRecommendation && paper.reason && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400 italic">
                {paper.reason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const EmptyState = ({ type }) => {
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
    <div className="h-full overflow-auto">
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
              <p className="text-xs text-gray-500 mt-1">Debug: User ID = {user?.id || 'No user'}</p>
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
                <Button
                  onClick={() => {
                    setSearchQuery('microgravity effects');
                    setTimeout(() => searchPapers(), 100);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-4"
                >
                  Test Search
                </Button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={filters.year} onValueChange={(value) => setFilters({...filters, year: value})}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Publication Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2020">2020</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.institution} onValueChange={(value) => setFilters({...filters, institution: value})}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Institution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nasa">NASA</SelectItem>
                    <SelectItem value="esa">ESA</SelectItem>
                    <SelectItem value="mit">MIT</SelectItem>
                    <SelectItem value="stanford">Stanford</SelectItem>
                    <SelectItem value="harvard">Harvard</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.topic} onValueChange={(value) => setFilters({...filters, topic: value})}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Research Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="microgravity">Microgravity</SelectItem>
                    <SelectItem value="space-medicine">Space Medicine</SelectItem>
                    <SelectItem value="astrobiology">Astrobiology</SelectItem>
                    <SelectItem value="life-support">Life Support</SelectItem>
                    <SelectItem value="radiation">Radiation</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min Citations"
                    value={filters.minCitations}
                    onChange={(e) => setFilters({...filters, minCitations: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-gray-400 hover:text-white px-3"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            {loading ? (
              <div className="py-16">
                <LoadingAnimation userType={userType} theme={theme} />
              </div>
            ) : hasSearched && papers.length === 0 ? (
              <EmptyState type="results" />
            ) : hasSearched ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
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
                  {recommendations.map((paper) => (
                    <PaperCard key={paper.id} paper={paper} isRecommendation={true} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState type="search" />
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
                className="bg-slate-900 border border-white/20 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
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

                    {selectedPaper.keyFindings && (
                      <div className="mb-6">
                        <h3 className="text-lg text-white mb-2">Key Findings</h3>
                        <ul className="space-y-2">
                          {selectedPaper.keyFindings.map((finding, index) => (
                            <li key={index} className="text-gray-300 flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              {finding}
                            </li>
                          ))}
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
                        <h4 className="text-white mb-2">Publication</h4>
                        <p className="text-gray-300 text-sm">{selectedPaper.journal}</p>
                        <p className="text-gray-400 text-sm">{selectedPaper.publicationYear}</p>
                      </div>

                      <div>
                        <h4 className="text-white mb-2">Institution</h4>
                        <p className="text-gray-300 text-sm">{selectedPaper.institution}</p>
                      </div>

                      <div>
                        <h4 className="text-white mb-2">Citations</h4>
                        <p className="text-gray-300 text-sm">{selectedPaper.citationCount}</p>
                      </div>

                      {selectedPaper.nasaDatasets && (
                        <div>
                          <h4 className="text-white mb-2">NASA Datasets</h4>
                          <ul className="space-y-1">
                            {selectedPaper.nasaDatasets.map((dataset, index) => (
                              <li key={index} className="text-gray-300 text-sm">{dataset}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pt-4 space-y-2">
                        <Button
                          onClick={() => handleDownload(selectedPaper)}
                          className={`w-full bg-gradient-to-r ${theme.primary}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-white/20 text-white"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on NASA
                        </Button>
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