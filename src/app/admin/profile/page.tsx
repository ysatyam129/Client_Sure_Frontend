"use client"

import { Suspense } from "react"
import AdminProfileContent from "../components/AdminProfileContent"

export default function AdminProfilePage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <div className="text-sm text-gray-500">Loading profile...</div>
        </div>
      </div>
    }>
      <AdminProfileContent />
    </Suspense>
  )
}