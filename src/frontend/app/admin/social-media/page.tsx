"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, RefreshCw, ArrowLeft } from "lucide-react"

export default function AdminSocialMedia() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState<string>("pending")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin")
      return
    }
    fetchPosts(token, filter)
  }, [router, filter])

  const fetchPosts = async (token: string, status: string) => {
    setLoading(true)
    try {
      const url =
        status === "all"
          ? `${API_URL}/api/social-media/all`
          : `${API_URL}/api/social-media/all?status=${status}`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    const token = localStorage.getItem("adminToken")
    if (!token) return

    setSyncing(true)
    try {
      const response = await fetch(`${API_URL}/api/social-media/sync-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      alert(`Synchronisation terminée !\n${JSON.stringify(data.results, null, 2)}`)
      fetchPosts(token, filter)
    } catch (error) {
      console.error("Error syncing:", error)
      alert("Erreur lors de la synchronisation")
    } finally {
      setSyncing(false)
    }
  }

  const handleValidate = async (postId: string, status: "approved" | "rejected") => {
    const token = localStorage.getItem("adminToken")
    if (!token) return

    try {
      await fetch(`${API_URL}/api/social-media/${postId}/validate`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      fetchPosts(token, filter)
    } catch (error) {
      console.error("Error validating post:", error)
    }
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      youtube: "bg-red-100 text-red-800",
      facebook: "bg-blue-100 text-blue-800",
      instagram: "bg-pink-100 text-pink-800",
      tiktok: "bg-black text-white",
    }
    return colors[platform] || "bg-gray-100 text-gray-800"
  }

  if (loading && !syncing) return <div className="p-8">Chargement...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Réseaux Sociaux</h1>
          </div>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Synchronisation..." : "Synchroniser"}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="approved">Approuvés</TabsTrigger>
            <TabsTrigger value="rejected">Rejetés</TabsTrigger>
            <TabsTrigger value="all">Tous</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge className={getPlatformColor(post.platform)}>{post.platform}</Badge>
                  <Badge variant={post.status === "pending" ? "outline" : "default"}>
                    {post.status}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-medium">{post.author}</CardTitle>
                <p className="text-xs text-gray-500">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                {post.thumbnailUrl && (
                  <img
                    src={post.thumbnailUrl}
                    alt="Post thumbnail"
                    className="w-full h-40 object-cover rounded-md mb-3"
                  />
                )}
                <p className="text-sm mb-4 line-clamp-3">{post.content}</p>
                {post.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => handleValidate(post.id, "approved")}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleValidate(post.id, "rejected")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun post à afficher</p>
          </div>
        )}
      </main>
    </div>
  )
}
