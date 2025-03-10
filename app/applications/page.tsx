import { getAllApplications } from "@/lib/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, ExternalLink } from "lucide-react"

export default async function ApplicationsPage() {
  const applications = await getAllApplications()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Form
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="text-gray-600 mt-2">View all submitted job applications</p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
              <p className="mt-2 text-gray-600">Applications will appear here once submitted.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>{application.name}</CardTitle>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">{application.email}</p>
                  <Badge>{application.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">Submitted on {new Date(application.submittedAt).toLocaleDateString()}</p>
                <a
                  href={application.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:text-primary/80 transition-colors text-sm"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  <span className="mr-1">View CV</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

