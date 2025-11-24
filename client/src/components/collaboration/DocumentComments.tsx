// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Plus, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Reply,
  Check,
  AlertCircle,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  type: 'comment' | 'suggestion' | 'approval' | 'issue';
  status: 'open' | 'resolved' | 'rejected';
  section?: string;
  lineNumber?: number;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentCommentsProps {
  documentId: string;
  section?: string;
  lineNumber?: number;
  className?: string;
}

export function DocumentComments({ documentId, section, lineNumber, className }: DocumentCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<Comment['type']>('comment');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Fetch comments for this document
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/documents", documentId, "comments"],
    queryFn: () => {
      // Mock data - replace with actual API call
      return [
        {
          id: "comment-1",
          documentId,
          userId: "user-1",
          userName: "John Doe",
          userEmail: "john@company.com",
          content: "This section needs more detail about encryption standards. Consider adding specific cipher suites and key lengths.",
          type: "suggestion",
          status: "open",
          section: "Data Protection",
          lineNumber: 42,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
        },
        {
          id: "comment-2",
          documentId,
          userId: "user-2", 
          userName: "Sarah Smith",
          userEmail: "sarah@company.com",
          content: "Approved. This section meets all ISO 27001 requirements.",
          type: "approval",
          status: "resolved",
          section: "Access Control",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }
      ];
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      type: Comment['type'];
      section?: string;
      lineNumber?: number;
      parentId?: string;
    }) => {
      return apiRequest(`/api/documents/${documentId}/comments`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", documentId, "comments"] });
      setNewComment("");
      setIsAddingComment(false);
      setReplyingTo(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update comment status mutation
  const updateCommentMutation = useMutation({
    mutationFn: async (data: { commentId: string; status: Comment['status'] }) => {
      return apiRequest(`/api/comments/${data.commentId}`, "PATCH", { status: data.status });
    },
    onSuccess: () => {
      toast({
        title: "Comment Updated",
        description: "Comment status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", documentId, "comments"] });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    addCommentMutation.mutate({
      content: newComment,
      type: commentType,
      section,
      lineNumber,
      parentId: replyingTo || undefined
    });
  };

  const handleStatusChange = (commentId: string, status: Comment['status']) => {
    updateCommentMutation.mutate({ commentId, status });
  };

  const getCommentIcon = (type: Comment['type']) => {
    switch (type) {
      case 'suggestion':
        return <Edit3 className="h-4 w-4 text-blue-500" />;
      case 'approval':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'issue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: Comment['status']) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Open</Badge>;
    }
  };

  const filteredComments = comments.filter(comment => 
    !section || comment.section === section
  );

  const parentComments = filteredComments.filter(comment => !comment.parentId);
  const replyComments = filteredComments.filter(comment => comment.parentId);

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle className="text-lg">Comments & Reviews</CardTitle>
              <Badge variant="outline">{comments.length}</Badge>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddingComment(true)}
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Comment</span>
            </Button>
          </div>
          {section && (
            <CardDescription>
              Comments for section: {section}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add Comment Form */}
          {isAddingComment && (
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <select
                      value={commentType}
                      onChange={(e) => setCommentType(e.target.value as Comment['type'])}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="comment">Comment</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="approval">Approval</option>
                      <option value="issue">Issue</option>
                    </select>
                  </div>
                  <Textarea
                    placeholder="Add your comment or feedback..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingComment(false);
                        setNewComment("");
                        setReplyingTo(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                    >
                      {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Loading comments...</p>
            </div>
          ) : parentComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No comments yet</p>
              <p className="text-sm text-gray-400">Be the first to add feedback</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parentComments.map((comment) => (
                <Card key={comment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{comment.userName}</span>
                            {getCommentIcon(comment.type)}
                            {getStatusBadge(comment.status)}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                            </span>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReplyingTo(comment.id)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              {comment.status === 'open' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(comment.id, 'resolved')}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Mark Resolved
                                  </DropdownMenuItem>
                                </>
                              )}
                              {comment.userId === (user?.id || user?.claims?.sub) && (
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                        
                        {comment.section && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>Section: {comment.section}</span>
                            {comment.lineNumber && <span>Line: {comment.lineNumber}</span>}
                          </div>
                        )}

                        {/* Replies */}
                        {replyComments
                          .filter(reply => reply.parentId === comment.id)
                          .map(reply => (
                            <Card key={reply.id} className="ml-4 mt-3 bg-gray-50 dark:bg-gray-800/50">
                              <CardContent className="pt-3">
                                <div className="flex items-start space-x-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {reply.userName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-xs">{reply.userName}</span>
                                      <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {reply.content}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                          <Card className="ml-4 mt-3 border-dashed">
                            <CardContent className="pt-3">
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Write a reply..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="min-h-[60px] text-sm"
                                />
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setNewComment("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                  >
                                    Reply
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}