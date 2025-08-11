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
  Mail,
  Bell,
  User,
  Atom,
  LogOut,
  Users,
  BookOpen,
  Truck,
  MapPin,
  Wrench,
  Leaf,
  DollarSign
} from "lucide-react";

export default function ApplicationPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const applicationCategories = [
    {
      title: "Discovery",
      applications: [
        {
          id: 1,
          title: "Discover key information on Government Circular",
          icon: Building,
          description: "Identify and interpret key information from government Pekeliling with AI",
          link: "https://app1.demo.zygy.com/web?title=Government%20Circular&serviceAccount=demo",
          documentLink: "https://example.com/government-circular-docs" // Edit this URL
        },
        {
          id: 2,
          title: "Discover related hadiths with AI",
          icon: BookOpen,
          description: "Use AI to identify and retrieve related hadiths based on specific topics or keywords",
          link: "https://app1.demo.zygy.com/web?title=Hadiths&serviceAccount=demo",
          documentLink: "https://example.com/hadiths-docs" // Edit this URL
        },
        {
          id: 3,
          title: "Discover Key Information in Legal Act",
          icon: Scale,
          description: "Use AI to extract and summarize key information from legal acts",
          link: "https://app1.demo.zygy.com/web?title=Legal%20Act&serviceAccount=demo",
          documentLink: "https://example.com/legal-act-docs" // Edit this URL
        }
      ]
    },
    {
      title: "Operation",
      applications: [
        {
          id: 4,
          title: "Contract Operations with AI",
          icon: FileText,
          description: "Use AI to analyze and diagnose contract operation issues by cross-referencing contract details (PDF format) with transaction records (Excel format)",
          link: "https://app1.demo.zygy.com/web?title=Contract&serviceAccount=demo",
          documentLink: "https://example.com/contract-operations-docs" // Edit this URL
        },
        {
          id: 5,
          title: "Shipping Logistics with AI",
          icon: Truck,
          description: "Use AI to analyze and diagnose issues in shipping logistics by examining transaction data stored in the database",
          link: "https://app1.demo.zygy.com/web?title=Shipping&serviceAccount=demo",
          documentLink: "https://example.com/shipping-logistics-docs" // Edit this URL
        },
        {
          id: 6,
          title: "Geospatial (Map) Intelligence with AI",
          icon: MapPin,
          description: "Use AI to analyze and diagnose issues by integrating geospatial data with database records",
          link: "https://app1.demo.zygy.com/web?title=Geospatial&serviceAccount=demo",
          documentLink: "https://example.com/geospatial-docs" // Edit this URL
        },
        {
          id: 7,
          title: "Workshop Operations with AI",
          icon: Wrench,
          description: "Use AI to analyze and diagnose issues in workshop operation by examining transaction data stored in the database",
          link: "https://app1.demo.zygy.com/web?title=Workshop&serviceAccount=demo",
          documentLink: "https://example.com/workshop-operations-docs" // Edit this URL
        }
      ]
    },
    {
      title: "Planning & Solving",
      applications: [
        {
          id: 8,
          title: "ESG Assessment with AI",
          icon: Leaf,
          description: "Use AI to perform ESG assessments based on company sustainability reports and automatically populate the ESG sections of loan application forms",
          link: "https://app3.demo.zygy.com/web?title=ESG&serviceAccount=demo",
          documentLink: "https://example.com/esg-assessment-docs" // Edit this URL
        },
        {
          id: 9,
          title: "Loan Assessment with AI",
          icon: DollarSign,
          description: "Use AI to perform loan assessments in accordance with the Loan Onboarding Guidelines",
          link: "https://app3.demo.zygy.com/web?title=Loan&serviceAccount=demo",
          documentLink: "https://example.com/loan-assessment-docs" // Edit this URL
        }
      ]
    }
  ];

  // Flatten all applications for search and pagination
  const allApplications = applicationCategories.flatMap(category => category.applications);

  const filteredApplications = searchQuery
    ? allApplications.filter(app =>
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allApplications;

  const totalItems = filteredApplications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredApplications.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderApplicationCard = (app: any) => {
    const IconComponent = app.icon;
    return (
      <Card key={app.id} className="relative group shadow-md hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-sm border-slate-200/50 hover:border-blue-200">
        <CardContent className="p-6">
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
            <p className="text-xs text-slate-600 mb-3">
              {app.description}
            </p>
            <p className="text-xs text-slate-500 italic">
              Please study{" "}
              <a 
                href={app.documentLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                ingested documents
              </a>
            </p>
          </div>

          {/* Button */}
          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-red-600 hover:to-red-700 text-white font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 transform hover:scale-[1.02]"
            size="sm"
            onClick={() => window.location.href = app.link}
          >
            Access This Demo
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800/10 via-gray-700/10 to-cyan-900/10">
      {/* Header */}
      <header className="bg-gradient-to-br from-cyan-950 via-cyan-900 to-cyan-800 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <img src="zygy-logo-light.png" alt="Logo" width="125" height="40"></img>
                </div>
              </div>
              <nav className="ml-8">
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-slate-900">
                    Home
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Search */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Choose Application Demo via Case Study
            </h1>
            <p className="text-slate-600">
              Select from our available application demonstrations to explore different use cases
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="pl-10 w-80 bg-white/70 backdrop-blur-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
        </div>



        {/* Applications by Category or Search Results */}
        {searchQuery ? (
          // Show search results without categories
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-800">
                Search Results ({totalItems})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentItems.map(renderApplicationCard)}
            </div>
          </>
        ) : (
          // Show categorized applications
          <div className="space-y-12 mb-8">
            {applicationCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                {/* Category Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {category.title}
                  </h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                </div>

                {/* Category Applications */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.applications.map(renderApplicationCard)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {searchQuery && totalItems === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-2">No applications found</div>
            <div className="text-sm text-slate-500">
              Try adjusting your search terms
            </div>
          </div>
        )}

        {/* Pagination - only show when there are results and more than one page */}
        {totalItems > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span>Items per page</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
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
        )}
      </main>
    </div>
  );
}