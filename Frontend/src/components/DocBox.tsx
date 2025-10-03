import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Download, ExternalLink, BookOpen, FlaskConical, Leaf, Microscope, Sun, Star } from 'lucide-react';

// Define a type for the paper props, extending the existing structure
export interface PaperProps {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  institution: string;
  publicationYear: number;
  tags: string[];
  citationCount: number;
  relevanceScore?: number;
  downloadUrl?: string;
  externalUrl?: string;
  type?: 'recentlyPublished' | 'topicBased' | 'recommended';
  reason?: string; // For recommendations
}

interface DocBoxProps {
  paper: PaperProps;
  theme: {
    primary: string;
    secondary: string;
  };
  onPaperClick: (paper: PaperProps) => void;
  onDownload: (paper: PaperProps, event?: React.MouseEvent) => void;
}

const getCategoryIcon = (tags: string[]) => {
  if (tags.some(tag => ['microgravity', 'radiation', 'space medicine'].includes(tag.toLowerCase()))) {
    return <Sun className="w-5 h-5 text-yellow-400" />; // Space/Astro related
  }
  if (tags.some(tag => ['biology', 'plants', 'animals', 'life sciences'].includes(tag.toLowerCase()))) {
    return <Leaf className="w-5 h-5 text-green-400" />; // Biological/Life Sciences
  }
  if (tags.some(tag => ['experiments', 'methodology', 'research'].includes(tag.toLowerCase()))) {
    return <FlaskConical className="w-5 h-5 text-blue-400" />; // Experimental
  }
  return <BookOpen className="w-5 h-5 text-gray-400" />; // Default document icon
};

export const DocBox: React.FC<DocBoxProps> = ({ paper, theme, onPaperClick, onDownload }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{
        scale: 1.03,
        boxShadow: `0 0 25px rgba(255, 255, 255, 0.2), 0 0 50px rgba(0, 123, 255, 0.1)`,
        transition: { duration: 0.2 }
      }}
      transition={{ duration: 0.3 }}
      className="h-full" // Ensure DocBox takes full height in grid
    >
      <Card
        className="cursor-pointer bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/40 transition-all h-full flex flex-col"
        onClick={() => onPaperClick(paper)}
      >
        <CardHeader className="pb-3 flex-grow">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              {getCategoryIcon(paper.tags)}
              <CardTitle className="text-white text-lg leading-tight line-clamp-2">
                {paper.title}
              </CardTitle>
            </div>
            {paper.type === 'recommended' && (
              <Badge className={`bg-gradient-to-r ${theme.primary} text-white shrink-0`}>
                <Sparkles className="w-3 h-3 mr-1" />
                Recommended
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {paper.tags?.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs border-white/20 text-gray-300">
                {tag}
              </Badge>
            ))}
          </div>

          <p className="text-gray-300 text-sm line-clamp-3 mb-2">
            {paper.abstract}
          </p>

          <div className="text-gray-400 text-xs mt-auto">
            <p>{paper.authors?.slice(0, 2).join(', ')}{paper.authors?.length > 2 ? ' et al.' : ''}</p>
            <p>{paper.institution}, {paper.publicationYear}</p>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {paper.reason && paper.type === 'recommended' && (
            <div className="mb-3 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400 italic">
                {paper.reason}
              </p>
            </div>
          )}
          <div className="flex justify-between items-center mt-auto">
            <div className="flex gap-2">
              {paper.downloadUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => onDownload(paper, e)}
                  className="text-gray-300 hover:text-white border-white/20"
                >
                  <Download className="w-4 h-4 mr-1" /> PDF
                </Button>
              )}
              {paper.externalUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); window.open(paper.externalUrl, '_blank'); }}
                  className="text-gray-300 hover:text-white border-white/20"
                >
                  <ExternalLink className="w-4 h-4 mr-1" /> View
                </Button>
              )}
            </div>
            {paper.relevanceScore && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{(paper.relevanceScore * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};