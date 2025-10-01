import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  FileText, 
  BarChart3, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertTriangle,
  Info,
  TrendingUp,
  Brain,
  Target
} from 'lucide-react';

export function ResponseDisplay({ response, theme }) {
  // Mock response data structure - in real implementation, this would come from your AI backend
  const mockResponse = {
    summary: "Based on the analysis of the provided NASA research, here are the key findings and insights tailored for your perspective as a " + (response?.userType || 'researcher') + ".",
    analysis: {
      keyFindings: [
        "Microgravity effects on plant growth show 23% increased root development",
        "Novel propulsion system demonstrates 15% fuel efficiency improvement", 
        "Radiation shielding materials show 40% better protection than current standards"
      ],
      methodology: "The research employed controlled experiments with statistical significance testing (p < 0.05) across multiple variables.",
      implications: "These findings could significantly impact future Mars mission planning and life support systems.",
      confidence: 0.87
    },
    visualizations: [
      {
        type: 'chart',
        title: 'Research Impact Analysis',
        data: [
          { category: 'Technical Innovation', score: 85 },
          { category: 'Commercial Viability', score: 72 },
          { category: 'Mission Readiness', score: 68 },
          { category: 'Safety Factor', score: 91 }
        ]
      }
    ],
    tables: [
      {
        title: 'Key Metrics Comparison',
        headers: ['Parameter', 'Current Standard', 'Research Result', 'Improvement'],
        rows: [
          ['Fuel Efficiency', '2.3 km/s ΔV', '2.65 km/s ΔV', '+15%'],
          ['Radiation Protection', '65% blocked', '91% blocked', '+40%'],
          ['Life Support Duration', '180 days', '267 days', '+48%']
        ]
      }
    ],
    recommendations: [
      {
        type: 'high',
        title: 'Immediate Implementation',
        description: 'Integrate radiation shielding findings into current mission designs'
      },
      {
        type: 'medium', 
        title: 'Further Research',
        description: 'Conduct long-term studies on propulsion efficiency gains'
      },
      {
        type: 'low',
        title: 'Future Consideration',
        description: 'Explore commercial applications for life support technologies'
      }
    ]
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'high':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'high':
        return 'border-green-500/30 bg-green-500/10';
      case 'medium':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500/30 bg-blue-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Analysis Summary
              <Badge className={`ml-auto bg-gradient-to-r ${theme.primary}`}>
                {Math.round(mockResponse.analysis.confidence * 100)}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">
              {mockResponse.summary}
            </p>
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white">
                <strong>Methodology:</strong> {mockResponse.analysis.methodology}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Findings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Key Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockResponse.analysis.keyFindings.map((finding, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{finding}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Visualizations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Data Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockResponse.visualizations.map((viz, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-white font-medium mb-4">{viz.title}</h4>
                  <div className="space-y-3">
                    {viz.data.map((item, i) => {
                      const percentage = item.score;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">{item.category}</span>
                            <span className="text-white">{percentage}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: i * 0.2 }}
                              className={`h-2 bg-gradient-to-r ${theme.primary} rounded-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Tables */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detailed Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockResponse.tables.map((table, index) => (
              <div key={index} className="mb-6 last:mb-0">
                <h4 className="text-white font-medium mb-3">{table.title}</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        {table.headers.map((header, i) => (
                          <TableHead key={i} className="text-gray-300 font-medium">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.rows.map((row, i) => (
                        <TableRow key={i} className="border-white/10 hover:bg-white/5">
                          {row.map((cell, j) => (
                            <TableCell key={j} className="text-gray-300">
                              {j === row.length - 1 && cell.startsWith('+') ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  {cell}
                                </Badge>
                              ) : (
                                cell
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recommendations & Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockResponse.recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${getRecommendationColor(rec.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getRecommendationIcon(rec.type)}
                    <div>
                      <h4 className="text-white font-medium mb-1">{rec.title}</h4>
                      <p className="text-gray-300 text-sm">{rec.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Implications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-6">
            <div className={`p-4 bg-gradient-to-r ${theme.primary} bg-opacity-20 rounded-lg border border-white/20`}>
              <h4 className="text-white font-medium mb-2">Research Implications</h4>
              <p className="text-gray-300">{mockResponse.analysis.implications}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}