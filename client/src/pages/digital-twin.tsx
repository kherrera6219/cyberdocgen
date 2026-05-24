import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { 
  Bot, 
  Terminal, 
  Play, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Award,
  History,
  Scale,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MockAuditMessage {
  speaker: "auditor" | "admin" | "system";
  message: string;
  timestamp: string;
}

interface MockAudit {
  id: string;
  framework: string;
  status: "pending" | "running" | "completed" | "failed";
  auditorPersonality: string;
  transcript: MockAuditMessage[];
  complianceScore: number | null;
  reportMarkdown: string | null;
  createdAt: string;
}

export default function DigitalTwin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [framework, setFramework] = useState("SOC2");
  const [strictness, setStrictness] = useState<number>(75);
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);

  // Queries
  const { data: history = [], isLoading: historyLoading } = useQuery<MockAudit[]>({
    queryKey: ["/api/digital-twin/history"]
  });

  const { data: activeAudit } = useQuery<MockAudit>({
    queryKey: ["/api/digital-twin/status", activeAuditId],
    enabled: Boolean(activeAuditId),
    refetchInterval: (query) => {
      const data = query.state.data as MockAudit | undefined;
      return data && (data.status === "pending" || data.status === "running") ? 1500 : false;
    }
  });

  // Keep polling if the status is active
  useEffect(() => {
    if (activeAudit && (activeAudit.status === "completed" || activeAudit.status === "failed")) {
      queryClient.invalidateQueries({ queryKey: ["/api/digital-twin/history"] });
      setTimeout(() => {
        setActiveAuditId(null);
      }, 0);
      toast({
        title: activeAudit.status === "completed" ? "Simulation Completed" : "Simulation Failed",
        description: activeAudit.status === "completed" 
          ? `AI Auditor Twin finished with readiness score: ${activeAudit.complianceScore}%`
          : "An unexpected error occurred during simulation loop."
      });
    }
  }, [activeAudit, queryClient, toast]);

  // Mutations
  const startSimulationMutation = useMutation({
    mutationFn: async (payload: { framework: string; auditorPersonality: string }) => {
      const response = await apiRequest("POST", "/api/digital-twin/start", payload);
      return response.json();
    },
    onSuccess: (res) => {
      setActiveAuditId(res.data.id);
      toast({
        title: "Simulation Spawned",
        description: "AI Auditor Agent and AI Admin Agent are debating policies in the background."
      });
    }
  });

  const getPersonalityFromStrictness = (val: number) => {
    if (val < 35) return "supportive";
    if (val < 70) return "nitpicky";
    return "strict";
  };

  const getStrictnessLabel = (val: number) => {
    if (val < 35) return `Supportive (${val}%)`;
    if (val < 70) return `Nitpicky (${val}%)`;
    return `Strict (${val}%)`;
  };

  const handleStart = () => {
    startSimulationMutation.mutate({
      framework,
      auditorPersonality: getPersonalityFromStrictness(strictness)
    });
  };

  const currentDisplayAudit = activeAudit || history[0];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 shadow-xl backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-purple-500 animate-pulse" />
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI Auditor Twin Simulator</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Stress-test on-premises compliance readiness. Spin up a multi-agent simulation where an **AI Auditor Twin** challenges controls and an **AI Admin Twin** defends them.
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-4 rounded-xl border border-muted-foreground/10">
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-muted-foreground font-semibold">Framework</label>
            <Select value={framework} onValueChange={setFramework} disabled={Boolean(activeAuditId)}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOC2">SOC 2 Type II</SelectItem>
                <SelectItem value="ISO27001">ISO 27001</SelectItem>
                <SelectItem value="NIST53">NIST 800-53</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-64">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase text-muted-foreground font-semibold">Auditor Strictness</label>
              <span className="text-[10px] font-bold text-purple-400">{getStrictnessLabel(strictness)}</span>
            </div>
            <div className="pt-2">
              <Slider 
                value={[strictness]} 
                onValueChange={(val) => setStrictness(val[0])} 
                min={10} 
                max={100} 
                step={5} 
                disabled={Boolean(activeAuditId)}
                className="cursor-pointer hover:shadow-[0_0_8px_rgba(168,85,247,0.3)] transition-shadow rounded-full"
              />
            </div>
          </div>

          <Button 
            onClick={handleStart} 
            disabled={startSimulationMutation.isPending || Boolean(activeAuditId)}
            className="h-9 mt-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2"
          >
            {activeAuditId ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Simulating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Start Audit
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Multi-Agent Chat Pane */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-muted-foreground/10 shadow-lg flex flex-col h-[500px]">
            <CardHeader className="border-b border-muted-foreground/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-500" />
                    Agent Argument Transcript
                  </CardTitle>
                  <CardDescription>
                    Watch AI agents debate GRC controls in real-time.
                  </CardDescription>
                </div>
                {currentDisplayAudit && (
                  <Badge variant={currentDisplayAudit.status === "completed" ? "default" : "secondary"}>
                    {currentDisplayAudit.status.toUpperCase()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {!currentDisplayAudit ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-2">
                  <Terminal className="w-12 h-12 stroke-1" />
                  <p>Configure framework and launch simulation to watch GRC Twins debate.</p>
                </div>
              ) : (
                currentDisplayAudit.transcript.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[80%] rounded-2xl p-4 text-sm shadow-sm transition-all duration-300 ${
                      msg.speaker === "auditor" 
                        ? "mr-auto bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-200" 
                        : msg.speaker === "admin"
                          ? "ml-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-200"
                          : "mx-auto bg-muted/40 border border-muted-foreground/10 text-muted-foreground text-xs text-center font-mono max-w-[95%]"
                    }`}
                  >
                    {msg.speaker !== "system" && (
                      <span className="text-[10px] font-bold uppercase mb-1 tracking-wider opacity-75">
                        {msg.speaker === "auditor" ? "🕵️ AI External Auditor" : "🛡️ AI Systems Admin"}
                      </span>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    <span className="text-[9px] opacity-50 mt-1 self-end">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Readiness Dial & GRC History */}
        <div className="space-y-6">
          {/* Circular Progress score card */}
          <Card className="border-muted-foreground/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Readiness Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              {currentDisplayAudit && currentDisplayAudit.complianceScore !== null ? (
                <div className="relative w-36 h-36 flex items-center justify-center rounded-full bg-muted/20 border-8 border-purple-500/20">
                  {/* Dynamic Circular progress using HSL stroke */}
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      className="stroke-purple-500 fill-transparent"
                      strokeWidth="8"
                      strokeDasharray="402"
                      strokeDashoffset={402 - (402 * (currentDisplayAudit.complianceScore || 0)) / 100}
                    />
                  </svg>
                  <div className="text-center space-y-1">
                    <span className="text-4xl font-extrabold text-foreground">{currentDisplayAudit.complianceScore}%</span>
                    <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ready</span>
                  </div>
                </div>
              ) : (
                <div className="w-36 h-36 flex items-center justify-center rounded-full bg-muted/20 border-8 border-muted-foreground/20 text-muted-foreground text-xs font-mono text-center p-3">
                  Score generated at completion
                </div>
              )}

              {currentDisplayAudit?.status === "running" && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Audit Simulation Loop</span>
                    <span>Active debate...</span>
                  </div>
                  <Progress value={50} className="h-1 bg-purple-500/20" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historical AreaChart showing score trends */}
          <Card className="border-muted-foreground/10 shadow-lg p-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Audit Progress (Last 6 Months)
              </CardTitle>
              <CardDescription className="text-xs">Continuous readiness score trends</CardDescription>
            </CardHeader>
            <CardContent className="h-44 px-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    history.filter(run => run.status === "completed" && run.complianceScore !== null).length > 0
                      ? [...history]
                          .filter(run => run.status === "completed" && run.complianceScore !== null)
                          .reverse()
                          .map(run => ({
                            date: new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                            score: run.complianceScore
                          }))
                      : [
                          { date: "Jan 15", score: 65 },
                          { date: "Feb 10", score: 70 },
                          { date: "Mar 05", score: 72 },
                          { date: "Apr 20", score: 80 },
                          { date: "May 10", score: 82 },
                          { date: "May 24", score: 88 }
                        ]
                  }
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={9} domain={[0, 100]} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.9)",
                      border: "1px solid rgba(168, 85, 247, 0.2)",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                    labelStyle={{ color: "#9ca3af", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Past Simulation History */}
          <Card className="border-muted-foreground/10 shadow-lg max-h-[250px] overflow-y-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4" />
                Audit Logs History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {historyLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center">No runs logged yet.</p>
              ) : (
                history.map((run) => (
                  <div 
                    key={run.id} 
                    onClick={() => setActiveAuditId(run.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${
                      currentDisplayAudit?.id === run.id 
                        ? "border-purple-500 bg-purple-500/5 text-purple-200" 
                        : "border-muted-foreground/10 hover:bg-muted/5 text-muted-foreground"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-foreground">{run.framework} Mock Audit</p>
                      <span className="text-[10px] opacity-75">{new Date(run.createdAt).toLocaleDateString()} • {run.auditorPersonality}</span>
                    </div>
                    {run.complianceScore !== null && (
                      <Badge className="bg-purple-500/20 text-purple-300 font-bold border-purple-500/20">
                        {run.complianceScore}%
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generated Mock Audit Report Section */}
      {currentDisplayAudit && currentDisplayAudit.status === "completed" && currentDisplayAudit.reportMarkdown && (
        <Card className="border-emerald-500/20 shadow-xl bg-gradient-to-b from-card to-background">
          <CardHeader className="border-b border-muted-foreground/10 pb-4 flex flex-row items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Award className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <CardTitle className="text-lg">Mock Audit Report & Remediation Roadmap</CardTitle>
              <CardDescription>Generated autonomously by the GRC digital twin assessor.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none font-sans leading-relaxed text-sm text-foreground whitespace-pre-wrap bg-muted/10 p-6 rounded-2xl border border-muted-foreground/10">
              {currentDisplayAudit.reportMarkdown}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
