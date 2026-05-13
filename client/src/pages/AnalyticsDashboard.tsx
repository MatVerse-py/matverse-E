import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExportButton } from "@/components/ExportButton";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const COLORS = {
  PASS: "#10b981",
  HOLD: "#f59e0b",
  REVIEW: "#3b82f6",
  BLOCK: "#ef4444",
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  CRITICAL: "#7c2d12",
};

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");

  // Fetch all artifacts for analysis
  const { data: artifacts, isLoading: artifactsLoading } = trpc.artifacts.getAll.useQuery({ limit: 10000, offset: 0 });
  const { data: analyticsData, isLoading: analyticsLoading } = trpc.organism.getStatus.useQuery();

  // Memoize processed data
  const processedData = useMemo(() => {
    if (!artifacts || artifacts.length === 0) return null;

    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const periodArtifacts = artifacts.filter((a: any) => {
      const date = new Date(a.createdAt);
      return date >= startDate && date <= endDate;
    });

    // Calculate decision distribution
    const decisions = {
      PASS: periodArtifacts.filter((a: any) => a.omegaGateDecision === "PASS").length,
      HOLD: periodArtifacts.filter((a: any) => a.omegaGateDecision === "HOLD").length,
      REVIEW: periodArtifacts.filter((a: any) => a.omegaGateDecision === "REVIEW").length,
      BLOCK: periodArtifacts.filter((a: any) => a.omegaGateDecision === "BLOCK").length,
    };

    // Calculate risk distribution
    const risks = {
      LOW: periodArtifacts.filter((a: any) => a.semanticRiskLevel === "LOW").length,
      MEDIUM: periodArtifacts.filter((a: any) => a.semanticRiskLevel === "MEDIUM").length,
      HIGH: periodArtifacts.filter((a: any) => a.semanticRiskLevel === "HIGH").length,
      CRITICAL: periodArtifacts.filter((a: any) => a.semanticRiskLevel === "CRITICAL").length,
    };

    // Calculate daily trend data
    const dailyData = new Map<string, { pass: number; hold: number; review: number; block: number }>();

    periodArtifacts.forEach((artifact: any) => {
      const date = new Date(artifact.createdAt).toLocaleDateString();
      if (!dailyData.has(date)) {
        dailyData.set(date, { pass: 0, hold: 0, review: 0, block: 0 });
      }

      const day = dailyData.get(date)!;
      const decision = artifact.omegaGateDecision?.toLowerCase() || "unknown";
      if (decision === "pass") day.pass++;
      else if (decision === "hold") day.hold++;
      else if (decision === "review") day.review++;
      else if (decision === "block") day.block++;
    });

    const trendData = Array.from(dailyData.entries())
      .sort(([dateA]: [string, any], [dateB]: [string, any]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, data]) => ({
        date,
        ...data,
        total: data.pass + data.hold + data.review + data.block,
      }));

    // Calculate average scores
    const semanticScores = periodArtifacts.filter((a: any) => a.semanticScore !== undefined).map((a: any) => a.semanticScore);
    const biasScores = periodArtifacts.filter((a: any) => a.biasScore !== undefined).map((a: any) => a.biasScore);
    const temporalScores = periodArtifacts.filter((a: any) => a.temporalCoherence !== undefined).map((a: any) => a.temporalCoherence);

    const avgSemantic = semanticScores.length > 0 ? (semanticScores.reduce((a: number, b: number) => a + b, 0) / semanticScores.length * 100).toFixed(1) : "N/A";
    const avgBias = biasScores.length > 0 ? (biasScores.reduce((a: number, b: number) => a + b, 0) / biasScores.length * 100).toFixed(1) : "N/A";
    const avgTemporal = temporalScores.length > 0 ? (temporalScores.reduce((a: number, b: number) => a + b, 0) / temporalScores.length * 100).toFixed(1) : "N/A";

    // Detect misinformation patterns
    const patterns = [];
    if (risks.CRITICAL > 0) {
      patterns.push({
        name: "Critical Risk Detected",
        count: risks.CRITICAL,
        severity: "critical",
      });
    }
    if (decisions.BLOCK > 0) {
      patterns.push({
        name: "Blocked Artifacts",
        count: decisions.BLOCK,
        severity: "critical",
      });
    }
    const highBias = periodArtifacts.filter((a: any) => a.biasScore && a.biasScore > 0.8).length;
    if (highBias > 0) {
      patterns.push({
        name: "High Bias Detected",
        count: highBias,
        severity: "high",
      });
    }

    return {
      periodArtifacts,
      decisions,
      risks,
      trendData,
      avgSemantic,
      avgBias,
      avgTemporal,
      patterns,
      decisionChartData: Object.entries(decisions).map(([name, value]) => ({
        name,
        value,
        fill: COLORS[name as keyof typeof COLORS],
      })),
      riskChartData: Object.entries(risks).map(([name, value]) => ({
        name,
        value,
        fill: COLORS[name as keyof typeof COLORS],
      })),
    };
  }, [artifacts, timeRange]);

  const isLoading = artifactsLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <p className="text-gray-600">No data available for analysis</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Visualize trends and patterns in artifact analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as "7" | "30" | "90")}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
          <ExportButton type="csv" reportType="analytics" data={processedData} label="Export Data" />
          <ExportButton type="pdf" reportType="analytics" data={processedData} label="Export Report" />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Artifacts</p>
              <p className="text-3xl font-bold text-blue-900">{processedData.periodArtifacts.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Semantic Score</p>
              <p className="text-3xl font-bold text-green-900">{processedData.avgSemantic}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Bias Score</p>
              <p className="text-3xl font-bold text-yellow-900">{processedData.avgBias}%</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Temporal Coherence</p>
              <p className="text-3xl font-bold text-purple-900">{processedData.avgTemporal}%</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Trend */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Ω-Gate Decision Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={processedData.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="pass" stackId="1" stroke={COLORS.PASS} fill={COLORS.PASS} name="Pass" />
              <Area type="monotone" dataKey="hold" stackId="1" stroke={COLORS.HOLD} fill={COLORS.HOLD} name="Hold" />
              <Area type="monotone" dataKey="review" stackId="1" stroke={COLORS.REVIEW} fill={COLORS.REVIEW} name="Review" />
              <Area type="monotone" dataKey="block" stackId="1" stroke={COLORS.BLOCK} fill={COLORS.BLOCK} name="Block" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Total Artifacts Trend */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Daily Submission Volume</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total Submissions" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Decision Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={processedData.decisionChartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {processedData.decisionChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Risk Level Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.riskChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {processedData.riskChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Misinformation Patterns */}
      {processedData.patterns.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Detected Misinformation Patterns</h2>
          <div className="space-y-3">
            {processedData.patterns.map((pattern, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-5 w-5 ${pattern.severity === "critical" ? "text-red-600" : "text-yellow-600"}`} />
                  <div>
                    <p className="font-semibold text-gray-900">{pattern.name}</p>
                    <p className="text-sm text-gray-600">Detected in {pattern.count} artifacts</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${pattern.severity === "critical" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{pattern.severity.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Summary Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Pass</p>
            <p className="text-2xl font-bold text-green-600">{processedData.decisions.PASS}</p>
            <p className="text-xs text-gray-500 mt-1">{((processedData.decisions.PASS / processedData.periodArtifacts.length) * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Hold</p>
            <p className="text-2xl font-bold text-yellow-600">{processedData.decisions.HOLD}</p>
            <p className="text-xs text-gray-500 mt-1">{((processedData.decisions.HOLD / processedData.periodArtifacts.length) * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Review</p>
            <p className="text-2xl font-bold text-blue-600">{processedData.decisions.REVIEW}</p>
            <p className="text-xs text-gray-500 mt-1">{((processedData.decisions.REVIEW / processedData.periodArtifacts.length) * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Block</p>
            <p className="text-2xl font-bold text-red-600">{processedData.decisions.BLOCK}</p>
            <p className="text-xs text-gray-500 mt-1">{((processedData.decisions.BLOCK / processedData.periodArtifacts.length) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
