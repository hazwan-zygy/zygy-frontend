import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Settings, 
  Target, 
  Scale, 
  CheckCircle, 
  FileText, 
  Lightbulb, 
  Building, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Info,
  Mail,
  Bell,
  User,
  Atom,
  LogOut
} from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

export default function ApplicationPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { logout } = useAuth0();

  const applications = [
    {
      id: 1,
      title: "Operation and maintenance contract management",
      icon: Settings,
      description: "Manage operational contracts and maintenance schedules",
      link: "https://app1.demo.zygy.com"
    },
    {
      id: 2,
      title: "Centralized intelligence and incident tracking",
      icon: Target,
      description: "Track incidents and analyze intelligence data centrally",
      link: "https://app1.demo.zygy.com"
    },
    {
      id: 3,
      title: "Legal document classification and reporting",
      icon: Scale,
      description: "Classify legal documents and generate reports",
      link: "https://app1.demo.zygy.com"
    },
    {
      id: 4,
      title: "Task generation and identity verification in credit applications",
      icon: CheckCircle,
      description: "Generate tasks and verify identity for credit processing",
      link: "https://app1.demo.zygy.com"
    },
    {
      id: 5,
      title: "Document processing, schedule tracking, and certificate submission",
      icon: FileText,
      description: "Process documents, track and manage certificates",
      link: "https://app1.demo.zygy.com"
    },
    {
      id: 6,
      title: "Knowledge management",
      icon: Lightbulb,
      description: "Organize and manage organizational knowledge base",
      link: "https://app1.demo.zygy.com"
    },
    {
      id: 7,
      title: "Government data crawling and policy tracking",
      icon: Building,
      description: "Crawl government data and track policy changes",
      link: "https://app3.demo.zygy.com"
    }
  ];

  const filteredApplications = applications.filter(app =>
    app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredApplications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredApplications.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-800/10 via-cyan-700/10 to-cyan-900/10">
      {/* Header */}
      <header className="bg-gradient-to-br from-cyan-950 via-cyan-900 to-cyan-800 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Atom className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xl font-bold text-white">Zygy</span>
              </div>
              <nav className="ml-8">
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-slate-900">
                    Home
                  </Button>
                </div>
              </nav>
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-slate-900">
                <Mail className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-slate-900">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-slate-900">
                <User className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
                aria-label="Log out"
                className="group relative h-11 px-4 border-slate-200 hover:border-red-200 bg-white/70 backdrop-blur-sm hover:bg-red-50 text-slate-700 hover:text-red-700 font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] shadow-lg shadow-slate-200/50 hover:shadow-red-200/50"
              >
                <span className="mr-2">Sign Out</span>
                <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Choose Application Demo via Case Study
          </h1>
          <p className="text-slate-600">
            Select from our available application demonstrations to explore different use cases
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 backdrop-blur-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentItems.map((app) => {
            const IconComponent = app.icon;
            return (
              <Card key={app.id} className="relative group shadow-md hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-sm border-slate-200/50 hover:border-blue-200">
                <CardContent className="p-6">
                  {/* Info icon */}
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Info className="w-3 h-3 text-slate-500 group-hover:text-blue-600" />
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                      <IconComponent className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2 leading-tight">
                      {app.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {app.description}
                    </p>
                  </div>

                  {/* Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-red-600 hover:to-red-700 text-white font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 transform hover:scale-[1.02]"
                    size="sm"
                    onClick={() => window.location.href = app.link}
                  >
                    ASK ME
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <span>Items per page</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 border border-slate-200 rounded bg-white text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">
              {startIndex + 1}-{endIndex} of {totalItems}
            </span>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="w-8 h-8 p-0"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 p-0"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}