import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  FileText, 
  Image as ImageIcon, 
  Brain,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Paragraph {
  text: string;
  images: string[];
  tables: string[];
}

interface ResponseData {
  paragraphs: Paragraph[];
  metadata: {
    total_paragraphs: number;
    total_images: string[];
    total_tables: string[];
    source_documents: number;
    user_type: string;
  };
  userType: string;
}

interface ResponseDisplayProps {
  response: ResponseData;
  theme: any;
}

export function ResponseDisplay({ response, theme }: ResponseDisplayProps) {
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [tableContents, setTableContents] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);

  // Load image mappings from images.json
  useEffect(() => {
    const loadImageMap = async () => {
      try {
        // Try to load from public folder
        const response = await fetch('/images.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load images.json: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('images.json is not being served as JSON');
        }
        
        const data = await response.json();
        setImageMap(data);
        console.log('Loaded image map:', Object.keys(data).length, 'images');
      } catch (error) {
        console.error('Error loading images.json:', error);
        console.warn('Make sure images.json exists in the public folder');
      } finally {
        setLoadingImages(false);
      }
    };
    loadImageMap();
  }, []);

  // Load table HTML files
  useEffect(() => {
    const loadTables = async () => {
      if (!response?.metadata?.total_tables || response.metadata.total_tables.length === 0) {
        setLoadingTables(false);
        return;
      }

      const tableData: Record<string, string> = {};
      
      for (const tableId of response.metadata.total_tables) {
        try {
          const tableResponse = await fetch(`/tables_data/${tableId}.html`);
          if (tableResponse.ok) {
            const contentType = tableResponse.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
              const html = await tableResponse.text();
              tableData[tableId] = html;
              console.log(`Loaded table: ${tableId}`);
            } else {
              console.warn(`Table ${tableId} is not HTML`);
            }
          } else {
            console.warn(`Table file not found: ${tableId}.html (status: ${tableResponse.status})`);
          }
        } catch (error) {
          console.error(`Error loading table ${tableId}:`, error);
        }
      }
      
      setTableContents(tableData);
      setLoadingTables(false);
    };

    loadTables();
  }, [response?.metadata?.total_tables]);

  if (!response || !response.paragraphs || response.paragraphs.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">No response data available</p>
        </CardContent>
      </Card>
    );
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'scientist':
        return <Brain className="w-5 h-5" />;
      case 'investor':
        return <Target className="w-5 h-5" />;
      case 'mission-architect':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'scientist':
        return 'Scientific Analysis';
      case 'investor':
        return 'Investment Analysis';
      case 'mission-architect':
        return 'Mission Architecture';
      default:
        return 'Analysis';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {getUserTypeIcon(response.userType)}
              {getUserTypeLabel(response.userType)}
              <Badge className={`ml-auto bg-gradient-to-r ${theme.primary}`}>
                {response.metadata?.source_documents || 0} Sources
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Paragraphs with images and tables */}
      {response.paragraphs.map((paragraph, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              {/* Paragraph text */}
              <div className="text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
                {paragraph.text}
              </div>

              {/* Images */}
              {paragraph.images && paragraph.images.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <ImageIcon className="w-4 h-4" />
                    Referenced Images ({paragraph.images.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paragraph.images.map((imageId, imgIndex) => {
                      const imageUrl = imageMap[imageId];
                      return (
                        <div key={imgIndex} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          {loadingImages ? (
                            <div className="flex items-center justify-center h-48">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                          ) : imageUrl ? (
                            <div>
                              <img 
                                src={imageUrl} 
                                alt={`Figure ${imageId}`}
                                className="w-full h-auto rounded-lg mb-2"
                                onError={(e) => {
                                  console.error(`Failed to load image: ${imageUrl}`);
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              <p className="text-xs text-gray-400 text-center">{imageId}</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                              <AlertCircle className="w-8 h-8 mb-2" />
                              <p className="text-sm">{imageId}</p>
                              <p className="text-xs text-gray-600">Image mapping not found</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tables */}
              {paragraph.tables && paragraph.tables.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <FileText className="w-4 h-4" />
                    Referenced Tables ({paragraph.tables.length})
                  </div>
                  <div className="space-y-4">
                    {paragraph.tables.map((tableId, tblIndex) => {
                      const tableHtml = tableContents[tableId];
                      return (
                        <div key={tblIndex} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <p className="text-sm text-gray-400 mb-3 font-mono">{tableId}</p>
                          {loadingTables ? (
                            <div className="flex items-center justify-center h-32">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                          ) : tableHtml ? (
                            <div 
                              className="overflow-x-auto text-gray-300 table-container"
                              dangerouslySetInnerHTML={{ __html: tableHtml }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                              <AlertCircle className="w-8 h-8 mb-2" />
                              <p className="text-sm">Table {tableId} not available</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Metadata summary */}
      {response.metadata && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-sm">Paragraphs</p>
                  <p className="text-white text-2xl font-bold">{response.metadata.total_paragraphs}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Images</p>
                  <p className="text-white text-2xl font-bold">{response.metadata.total_images?.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tables</p>
                  <p className="text-white text-2xl font-bold">{response.metadata.total_tables?.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Sources</p>
                  <p className="text-white text-2xl font-bold">{response.metadata.source_documents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}