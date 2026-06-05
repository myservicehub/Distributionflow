'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Copy, Check, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function StaffPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sales_rep'
  })
  const [submitting, setSubmitting] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [userProfile, router])

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchStaff()
    }
  }, [userProfile])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Invitation sent - no password to display
        if (result.invitationSent) {
          alert(`✅ Staff member created successfully!\n\n📧 A secure invitation email has been sent to ${formData.email}\n\nThey will receive a link to:\n• Accept the invitation\n• Set their own password\n• Access the dashboard\n\nNo password needed - they create their own!`)
        }
        
        setShowAddDialog(false)
        setFormData({ name: '', email: '', role: 'sales_rep' })
        fetchStaff()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to create staff member'}`)
      }
    } catch (error) {
      console.error('Error adding staff:', error)
      alert('Failed to add staff member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditStaff = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowEditDialog(false)
        setSelectedStaff(null)
        setFormData({ name: '', email: '', role: 'sales_rep' })
        fetchStaff()
      } else {
        alert('Failed to update staff member')
      }
    } catch (error) {
      console.error('Error updating staff:', error)
      alert('Failed to update staff member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivateStaff = async (staffId) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) {
      return
    }

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchStaff()
      } else {
        alert('Failed to deactivate staff member')
      }
    } catch (error) {
      console.error('Error deactivating staff:', error)
      alert('Failed to deactivate staff member')
    }
  }

  const openEditDialog = (staffMember) => {
    setSelectedStaff(staffMember)
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      status: staffMember.status
    })
    setShowEditDialog(true)
  }

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      manager: 'bg-blue-100 text-blue-700 border-blue-200',
      sales_rep: 'bg-success-100 text-success-700 border-success-200',
      warehouse: 'bg-orange-100 text-orange-700 border-orange-200'
    }
    return colors[role] || 'bg-neutral-100 text-neutral-700 border-neutral-200'
  }

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? 'bg-success-100 text-success-700 border-success-200' 
      : 'bg-red-100 text-red-700 border-red-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="animate-slide-down">
          <h2 className="text-4xl font-bold text-neutral-900 tracking-tight">Staff Management</h2>
          <p className="text-neutral-600 mt-2">Manage your team members and their roles</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-primary hover:opacity-90 text-white shadow-glow-primary group h-12">
          <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Add Staff Member
        </Button>
      </div>

      <Card className="border-0 shadow-soft animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-neutral-900">Team Members ({staff.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                        <Plus className="h-8 w-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-600 text-lg font-medium">No staff members yet</p>
                      <p className="text-neutral-500 text-sm mt-1">Add your first team member to get started</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow key={member.id} className="hover:bg-neutral-50 transition-colors duration-150">
                      <TableCell className="font-medium text-neutral-900">{member.name}</TableCell>
                      <TableCell className="text-neutral-700">{member.email}</TableCell>
                      <TableCell>
                        <Badge className={`${getRoleBadge(member.role)} border font-medium`}>
                          {member.role?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(member.status)} border font-medium`}>
                          {member.status?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(member)}
                          className="hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {member.status === 'active' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeactivateStaff(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Create a new staff account. A temporary password will be generated.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStaff}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="sales_rep">Sales Representative</SelectItem>
                    <SelectItem value="warehouse">Warehouse Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Staff Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member details and role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditStaff}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-neutral-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="sales_rep">Sales Representative</SelectItem>
                    <SelectItem value="warehouse">Warehouse Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
