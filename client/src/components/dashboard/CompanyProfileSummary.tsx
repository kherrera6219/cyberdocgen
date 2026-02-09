import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface CompanyProfileSummaryProps {
  profile: any; // Using any for now matching dashboard usage, but should be typed properly
  onEdit: () => void;
}

export function CompanyProfileSummary({ profile, onEdit }: CompanyProfileSummaryProps) {
  if (!profile) return null;

  return (
    <Card className="mb-6 sm:mb-8">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">Company Profile</CardTitle>
          <Button size="sm" className="self-start sm:self-auto" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Basic Information</h2>
            <div className="space-y-2">
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Company:</span> {profile.companyName}</p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Industry:</span> {profile.industry}</p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Size:</span> {profile.companySize}</p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Location:</span> {profile.headquarters}</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Technical Environment</h2>
            <div className="space-y-2">
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Cloud:</span> {profile.cloudInfrastructure?.join(', ') ?? 'Not specified'}</p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Data Classification:</span> {profile.dataClassification ?? 'Not specified'}</p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Applications:</span> {profile.businessApplications ?? 'Not specified'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
