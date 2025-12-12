"use client"

import AdminSidebar from "../components/AdminSidebar"
import EmailsContent from "../components/EmailsContent"

export default function EmailsPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex ">
      <AdminSidebar />
      <div className="flex-1">
        <EmailsContent />
      </div>
    </div>
  )
}
