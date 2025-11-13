"use client"

import AdminSidebar from "../components/AdminSidebar"
import UsersContent from "../components/UsersContent"

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1">
        <UsersContent />
      </div>
    </div>
  )
}
