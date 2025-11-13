"use client"

import AdminSidebar from "../components/AdminSidebar"
import ResourcesContent from "../components/ResourcesContent"

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1">
        <ResourcesContent />
      </div>
    </div>
  )
}
