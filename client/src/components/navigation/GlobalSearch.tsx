import { useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  Search, 
  FileText, 
  Building, 
  User, 
  Settings, 
  History,
  ArrowRight,
  Clock,
  Star
} from "lucide-react";
import type { Document, CompanyProfile } from "@shared/schema";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'profile' | 'page' | 'action';
  url: string;
  icon: ReactNode;
  tags?: string[];
  lastAccessed?: Date;
}

interface GlobalSearchProps {
  trigger?: ReactNode;
}

export function GlobalSearch({ trigger }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Fetch data for search
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: profiles = [] } = useQuery<CompanyProfile[]>({
    queryKey: ["/api/company-profiles"],
  });

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search to recent searches
  const saveSearch = (query: string) => {
    if (query.trim() && !recentSearches.includes(query)) {
      const updated = [query, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Build search results
  const buildSearchResults = (query: string): SearchResult[] => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search documents
    documents.forEach(doc => {
      if (
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.description?.toLowerCase().includes(lowerQuery) ||
        doc.framework.toLowerCase().includes(lowerQuery) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      ) {
        results.push({
          id: `doc-${doc.id}`,
          title: doc.title,
          description: doc.description || `${doc.framework} document`,
          type: 'document',
          url: `/workspace?doc=${doc.id}`,
          icon: <FileText className="h-4 w-4" />,
          tags: [doc.framework, doc.status, ...(doc.tags || [])],
          lastAccessed: doc.updatedAt
        });
      }
    });

    // Search company profiles
    profiles.forEach(profile => {
      if (
        profile.companyName.toLowerCase().includes(lowerQuery) ||
        profile.industry.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: `profile-${profile.id}`,
          title: profile.companyName,
          description: `${profile.industry} company profile`,
          type: 'profile',
          url: '/enhanced-profile',
          icon: <Building className="h-4 w-4" />,
          tags: [profile.industry, profile.companySize]
        });
      }
    });

    // Add page/navigation results
    const pages = [
      { 
        name: 'Dashboard', 
        url: '/dashboard', 
        description: 'Compliance overview and analytics',
        keywords: ['dashboard', 'overview', 'analytics', 'compliance', 'metrics']
      },
      { 
        name: 'Document Workspace', 
        url: '/workspace', 
        description: 'Manage and collaborate on documents',
        keywords: ['workspace', 'documents', 'collaborate', 'manage', 'edit']
      },
      { 
        name: 'Company Profile', 
        url: '/enhanced-profile', 
        description: 'Organization settings and configuration',
        keywords: ['profile', 'company', 'settings', 'configuration', 'organization']
      },
      { 
        name: 'Audit Trail', 
        url: '/audit-trail', 
        description: 'Activity logs and compliance tracking',
        keywords: ['audit', 'logs', 'activity', 'tracking', 'history']
      }
    ];

    pages.forEach(page => {
      if (
        page.name.toLowerCase().includes(lowerQuery) ||
        page.description.toLowerCase().includes(lowerQuery) ||
        page.keywords.some(keyword => keyword.includes(lowerQuery))
      ) {
        results.push({
          id: `page-${page.url}`,
          title: page.name,
          description: page.description,
          type: 'page',
          url: page.url,
          icon: <ArrowRight className="h-4 w-4" />
        });
      }
    });

    // Sort results by relevance
    return results.sort((a, b) => {
      const aExactMatch = a.title.toLowerCase().includes(lowerQuery);
      const bExactMatch = b.title.toLowerCase().includes(lowerQuery);
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      return 0;
    }).slice(0, 10);
  };

  const searchResults = buildSearchResults(searchQuery);

  const handleResultClick = (result: SearchResult) => {
    saveSearch(searchQuery);
    setIsOpen(false);
    setSearchQuery("");
    window.location.href = result.url;
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const defaultTrigger = (
    <Button variant="outline" className="relative w-full sm:w-auto justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64">
      <Search className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden md:inline-flex">Search...</span>
      <span className="inline-flex md:hidden">Search</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 sm:top-2 hidden h-5 sm:h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl p-0 m-2 sm:m-0">
        <DialogHeader className="p-3 sm:p-4 pb-0">
          <DialogTitle className="sr-only">Global Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search for documents, profiles, and navigate to different pages
          </DialogDescription>
        </DialogHeader>

        <Command className="rounded-lg border-none shadow-none">
          <CommandInput
            placeholder="Search documents, profiles, pages..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="border-none focus:ring-0 text-sm sm:text-base"
          />
          <CommandList className="max-h-80 sm:max-h-96">
            {!searchQuery && recentSearches.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((search, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => handleRecentSearchClick(search)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{search}</span>
                    </div>
                  </CommandItem>
                ))}
                <CommandItem onSelect={clearRecentSearches} className="text-sm text-gray-500">
                  Clear recent searches
                </CommandItem>
              </CommandGroup>
            )}

            {searchQuery && searchResults.length === 0 && (
              <CommandEmpty>No results found for "{searchQuery}"</CommandEmpty>
            )}

            {searchQuery && searchResults.length > 0 && (
              <>
                <CommandGroup heading="Documents">
                  {searchResults
                    .filter(result => result.type === 'document')
                    .map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleResultClick(result)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          {result.icon}
                          <div>
                            <div className="font-medium">{result.title}</div>
                            <div className="text-sm text-gray-500">{result.description}</div>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {result.tags?.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>

                {searchResults.some(result => result.type === 'profile') && (
                  <CommandGroup heading="Profiles">
                    {searchResults
                      .filter(result => result.type === 'profile')
                      .map(result => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-center space-x-3"
                        >
                          {result.icon}
                          <div>
                            <div className="font-medium">{result.title}</div>
                            <div className="text-sm text-gray-500">{result.description}</div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {searchResults.some(result => result.type === 'page') && (
                  <CommandGroup heading="Pages">
                    {searchResults
                      .filter(result => result.type === 'page')
                      .map(result => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-center space-x-3"
                        >
                          {result.icon}
                          <div>
                            <div className="font-medium">{result.title}</div>
                            <div className="text-sm text-gray-500">{result.description}</div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}