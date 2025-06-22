"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Papa from "papaparse";
import { FaLinkedin, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { useApp } from "@/app/providers";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Leaderboard() {
  const { supabase, user } = useApp();
  const [leaderboardType, setLeaderboardType] = useState("teams");
  const [leaderboardScope, setLeaderboardScope] = useState("global");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [teamsData, setTeamsData] = useState<any[]>([]);
  const [individualsData, setIndividualsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userRankInfo, setUserRankInfo] = useState<any>(null);
  const [teamRankInfo, setTeamRankInfo] = useState<any>(null);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoading(true);
      try {
        const { data: teams, error: teamsError } = await supabase
          .from("team_leaderboard")
          .select("*")
          .order("rank", { ascending: true, nullsFirst: false });
        if (teamsError) throw teamsError;
        setTeamsData(teams || []);

        const { data: individuals, error: individualsError } = await supabase
          .from("user_leaderboard")
          .select("*")
          .order("rank", { ascending: true, nullsFirst: false });
        if (individualsError) throw individualsError;
        // Sort by total_points descending for individuals
        setIndividualsData((individuals || []).sort((a: { total_points: number }, b: { total_points: number }) => (b.total_points || 0) - (a.total_points || 0)));

      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboards();

    // Real-time subscription for team_members changes
    const teamMembersChannel = supabase
      .channel('leaderboard_team_members_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => fetchLeaderboards()
      )
      .subscribe();

    // Real-time subscription for profiles changes (team_id updates)
    const profilesChannel = supabase
      .channel('leaderboard_profiles_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchLeaderboards()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(teamMembersChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [supabase]);

  useEffect(() => {
    if (user && individualsData.length > 0) {
      const currentUserData = individualsData.find(p => p.id === user.id);
      setUserRankInfo(currentUserData);
    }
    if (user?.team_id && teamsData.length > 0) {
      const currentTeamData = teamsData.find(t => t.id === user.team_id);
      setTeamRankInfo(currentTeamData);
    }
  }, [user, individualsData, teamsData]);

  const leaderboardData = leaderboardType === "teams" ? teamsData : individualsData;

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const downloadAsImage = () => {
    if (!wrapperRef.current) return;
    html2canvas(wrapperRef.current, { scale: 2, useCORS: true }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "leaderboard.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  const downloadAsPDF = () => {
    if (!wrapperRef.current) return;
    html2canvas(wrapperRef.current, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("leaderboard.pdf");
    });
  };

  const downloadCSV = () => {
    const csvData = leaderboardData.map((item) => ({
      Rank: item.rank,
      Name: item.name,
      Points: item.total_points,
      ...(leaderboardType === "teams"
        ? { Members: item.member_count }
        : { Team: item.team_name }),
      City: item.city,
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "leaderboard.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/leaderboard?type=${leaderboardType}&scope=${leaderboardScope}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const shareToSocial = (platform: string) => {
    const url = `${window.location.origin}/leaderboard?type=${leaderboardType}&scope=${leaderboardScope}`;
    const encoded = encodeURIComponent(url);
    const text = encodeURIComponent("Check out our GreenGrid Leaderboard! 🌿");
    const map: Record<string, string> = {
      x: `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      whatsapp: `https://wa.me/?text=${text}%20${encoded}`,
    };
    window.open(map[platform], "_blank");
  };

  return (
    <div ref={wrapperRef} className="p-4 space-y-6">
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="space-y-6">
        {/* Header + Filters + Share */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-green-800">Leaderboard</h2>
            <p className="text-green-600">See how teams and individuals are making a difference</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={leaderboardType} onValueChange={setLeaderboardType}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="teams">Teams</SelectItem>
                <SelectItem value="individuals">Individuals</SelectItem>
              </SelectContent>
            </Select>
            <Select value={leaderboardScope} onValueChange={setLeaderboardScope}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="college">College</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-green-800 border-green-400 bg-green-200">🚀 Share or Export Leaderboard / Your Rank</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={downloadAsPDF}>📄 Download as PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsImage}>🖼️ Download as Image</DropdownMenuItem>
                <DropdownMenuItem onClick={downloadCSV}>📊 Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={copyShareLink}>🔗 Copy Share Link</DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareToSocial("x")}><FaXTwitter className="mr-2 h-4 w-4" /> Share on X</DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareToSocial("linkedin")}><FaLinkedin className="mr-2 h-4 w-4 text-blue-700" /> Share on LinkedIn</DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareToSocial("whatsapp")}><FaWhatsapp className="mr-2 h-4 w-4 text-green-600" /> Share on WhatsApp</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      </motion.div>

      <motion.div id="leaderboard-section" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="space-y-6">
        {/* Top 3 Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                    <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
                    <Skeleton className="h-8 w-1/3 mx-auto mb-1" />
                    <Skeleton className="h-4 w-1/4 mx-auto" />
                  </CardContent>
                </Card>
              ))
            ) : (
          <AnimatePresence mode="wait">
            {leaderboardData.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.id}
                variants={fadeInUp}
                initial="hidden"
                animate="show"
                exit="hidden"
              >
                <Card
                  className={`text-center ${
                    index === 0
                      ? "border-yellow-300 bg-gradient-to-b from-yellow-50 to-yellow-100"
                      : index === 1
                        ? "border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100"
                        : "border-orange-300 bg-gradient-to-b from-orange-50 to-orange-100"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold ${
                      index === 0
                        ? "bg-yellow-200 text-yellow-800"
                        : index === 1
                          ? "bg-gray-200 text-gray-800"
                          : "bg-orange-200 text-orange-800"
                    }`}>
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </div>
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.city}</p>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-600">{item.total_points.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">EcoPoints</div>
                      {leaderboardType === "teams" && <div className="text-sm text-gray-500">{item.member_count} members</div>}
                      {leaderboardType === "individuals" && <div className="text-sm text-gray-500">Team: {item.team_name}</div>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          )}
      </motion.div>
      </motion.div>

        {/* Full Leaderboard */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle>{leaderboardType === "teams" ? "Team Rankings" : "Individual Rankings"}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <motion.div className="space-y-3" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
                {leaderboardData.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="show"
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        item.rank <= 3 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"
                      }`}>
                        {item.rank && item.rank > 0 ? item.rank : (idx + 1)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          {item.city} • {leaderboardType === "teams" ? `${item.member_count} members` : item.team_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{item.total_points.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">EcoPoints</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              )}
            </CardContent>
          </Card>
      </motion.div>
      {/* Your Ranking */}
      <motion.div variants={fadeInUp}>
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">
              {leaderboardType === "teams" 
                ? `Your Team: ${teamRankInfo ? teamRankInfo.name : 'N/A'}`
                : "Your Ranking"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            { loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                leaderboardType === "teams" ? (
                    teamRankInfo ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">{teamRankInfo.rank || 'N/A'}</div>
                            <div className="text-sm text-green-600">Current Rank</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">{teamRankInfo.total_points?.toLocaleString() || 0}</div>
                            <div className="text-sm text-green-600">Total Points</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">{teamRankInfo.member_count || 0}</div>
                            <div className="text-sm text-green-600">Team Members</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">{teamRankInfo.total_challenges_completed || 0}</div>
                            <div className="text-sm text-green-600">Challenges Done</div>
                          </div>
                        </div>
                    ) : (
                        <div className="text-center text-green-700">You are not part of a team yet.</div>
                    )
                ) : (
                    userRankInfo ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">{userRankInfo.rank || 'N/A'}</div>
                            <div className="text-sm text-green-600">Current Rank</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">{userRankInfo.total_points?.toLocaleString() || 0}</div>
                            <div className="text-sm text-green-600">Total Points</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">{userRankInfo.team_name || 'No Team'}</div>
                            <div className="text-sm text-green-600">Team</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">{userRankInfo.completed_challenges || 0}</div>
                            <div className="text-sm text-green-600">Challenges Completed</div>
                          </div>
                        </div>
                    ) : (
                        <div className="text-center text-green-700">Your rank will appear here once you earn points.</div>
                    )
                )
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
