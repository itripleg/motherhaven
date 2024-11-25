"use client";

import * as React from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/firebase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function RoadmapAdmin() {
  const [title, setTitle] = React.useState("");
  const [status, setStatus] = React.useState<string>("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !status) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(db, "roadmap"), {
        title,
        status,
        upvotes: 0,
        comments: 0,
        createdAt: new Date(),
      });
      setTitle("");
      setStatus("");
      toast({
        title: "Success",
        description: "New roadmap item added",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new item",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add New Roadmap Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter item title"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="considering">Considering</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Add Item
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
