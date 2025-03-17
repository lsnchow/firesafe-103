"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface SignUpFormProps {
  onSuccess: () => void
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      onSuccess()
    }, 1000)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" placeholder="Enter your full name" type="text" required className="bg-muted/50" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="Enter your email" type="email" required className="bg-muted/50" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" placeholder="Create a password" type="password" required className="bg-muted/50" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Select required>
            <SelectTrigger className="bg-muted/50">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="researcher">Researcher</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" required />
        <Label htmlFor="terms" className="text-sm">
          I agree to the{" "}
          <a href="#" className="text-primary hover:underline">
            terms and conditions
          </a>
        </Label>
      </div>
      <Button
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  )
}

