"use client";

import { useState } from "react";
import Image from "next/image";
import { CornerDownRight, User, Loader2, Pin, PinOff, ArrowUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "./ui/input-group";
import { Button } from "./ui/button";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";

type Props = { productId: string; isOwner?: boolean; ownerId?: string };

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderContent(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-500 underline break-all hover:text-orange-600"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function CommentSection({ productId, isOwner, ownerId }: Props) {
  const { requireAuth, user } = useRequireAuth();
  const utils = trpc.useUtils();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentTexts, setEditCommentTexts] = useState<Record<string, string>>({});
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editReplyTexts, setEditReplyTexts] = useState<Record<string, string>>({});

  const { data: comments, isLoading } = trpc.comments.listByProduct.useQuery({ productId });

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.comments.listByProduct.invalidate({ productId });
    },
  });

  const toggleCommentUpvote = trpc.comments.toggleUpvote.useMutation({
    onSuccess: () => utils.comments.listByProduct.invalidate({ productId }),
  });

  const createReply = trpc.comments.createReply.useMutation({
    onSuccess: (_, vars) => {
      setReplyTexts((prev) => ({ ...prev, [vars.commentId]: "" }));
      setReplyingTo(null);
      utils.comments.listByProduct.invalidate({ productId });
    },
  });

  const toggleReplyUpvote = trpc.comments.toggleReplyUpvote.useMutation({
    onSuccess: () => utils.comments.listByProduct.invalidate({ productId }),
  });

  const pinComment = trpc.comments.pinComment.useMutation({
    onSuccess: () => utils.comments.listByProduct.invalidate({ productId }),
  });

  const editComment = trpc.comments.editComment.useMutation({
    onSuccess: (_, vars) => {
      setEditingComment(null);
      setEditCommentTexts((prev) => ({ ...prev, [vars.commentId]: "" }));
      utils.comments.listByProduct.invalidate({ productId });
    },
  });

  const deleteComment = trpc.comments.deleteComment.useMutation({
    onSuccess: () => utils.comments.listByProduct.invalidate({ productId }),
  });

  const editReply = trpc.comments.editReply.useMutation({
    onSuccess: (_, vars) => {
      setEditingReply(null);
      setEditReplyTexts((prev) => ({ ...prev, [vars.replyId]: "" }));
      utils.comments.listByProduct.invalidate({ productId });
    },
  });

  const deleteReply = trpc.comments.deleteReply.useMutation({
    onSuccess: () => utils.comments.listByProduct.invalidate({ productId }),
  });

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    requireAuth(() => createComment.mutate({ productId, content: commentText.trim() }));
  };

  const handlePostReply = (commentId: string) => {
    const text = replyTexts[commentId]?.trim();
    if (!text) return;
    requireAuth(() => createReply.mutate({ commentId, content: text }));
  };

  const handleSaveEditComment = (commentId: string) => {
    const text = editCommentTexts[commentId]?.trim();
    if (!text) return;
    editComment.mutate({ commentId, content: text });
  };

  const handleSaveEditReply = (replyId: string) => {
    const text = editReplyTexts[replyId]?.trim();
    if (!text) return;
    editReply.mutate({ replyId, content: text });
  };

  return (
    <>
      {/* Comment input */}
      <div className="flex gap-3">
        {user?.image ? (
          <Image src={user.image} alt={user.name} width={30} height={30} className="rounded-full size-6 object-cover" />
        ) : (
          <User className="h-4 w-4 text-zinc-400" />
        )}
        <InputGroup>
          <InputGroupTextarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What do you think?"
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton variant="default" size="sm" className="ml-auto" onClick={handlePostComment}
              disabled={createComment.isPending}>
              Post
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center pb-16 pt-8">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {comments?.map((comment) => {
            const isCommentAuthor = user?.id === comment.user.id;
            const canManageComment = isCommentAuthor || isOwner;

            return (
              <div key={comment.id} className="relative">
                <div className="flex gap-3">
                  <Image src={comment.user.image!} alt={comment.user.name} width={30} height={30} className="rounded-full size-6 object-cover" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm space-y-1 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-semibold">{comment.user.name}</h2>
                          {ownerId && comment.user.id === ownerId && (
                            <Badge variant="secondary">
                              Author
                            </Badge>
                          )}
                        </div>
                        {editingComment === comment.id ? (
                          <InputGroup>
                            <InputGroupTextarea
                              value={editCommentTexts[comment.id] ?? comment.content}
                              onChange={(e) =>
                                setEditCommentTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                              }
                            />
                            <InputGroupAddon align="block-end">
                              <div className="ml-auto flex">
                                <InputGroupButton variant="ghost" size="sm" onClick={() => setEditingComment(null)}>
                                  Cancel
                                </InputGroupButton>
                                <InputGroupButton
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleSaveEditComment(comment.id)}
                                  disabled={editComment.isPending}
                                >
                                  Save
                                </InputGroupButton>
                              </div>
                            </InputGroupAddon>
                          </InputGroup>
                        ) : (
                          <p>{renderContent(comment.content)}</p>
                        )}
                      </div>

                      {canManageComment && (
                        <DropdownMenuRoot>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="shadow-none rounded-none">
                            {isOwner && (
                              <DropdownMenuItem
                                onClick={() => pinComment.mutate({ commentId: comment.id, productId })}
                                disabled={pinComment.isPending}
                              >
                                {comment.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                                {comment.isPinned ? "Unpin" : "Pin"}
                              </DropdownMenuItem>
                            )}
                            {isOwner && isCommentAuthor && <DropdownMenuSeparator />}
                            {isCommentAuthor && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditCommentTexts((prev) => ({ ...prev, [comment.id]: comment.content }));
                                    setEditingComment(comment.id);
                                  }}
                                >
                                  <Pencil className="size-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => deleteComment.mutate({ commentId: comment.id })}
                                  disabled={deleteComment.isPending}
                                >
                                  <Trash2 className="size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenuRoot>
                      )}
                    </div>

                    <div className="flex items-center">
                      <Button
                        onClick={() =>
                          requireAuth(() => toggleCommentUpvote.mutate({ commentId: comment.id }))
                        }
                        variant="ghost"
                        size="sm"
                      >
                        <ArrowUp />
                        {comment.upvoteCount}
                      </Button>
                      <Button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <CornerDownRight />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="mt-2 ml-10 space-y-3">
                    {comment.replies.map((reply) => {
                      const isReplyAuthor = user?.id === reply.user.id;

                      return (
                        <div key={reply.id} className="flex gap-3">
                          <Image src={reply.user.image!} alt={reply.user.name} width={30} height={30} className="rounded-full size-6 object-cover" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-sm space-y-1 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h2 className="font-semibold">{reply.user.name}</h2>
                                  {ownerId && reply.user.id === ownerId && (
                                    <Badge variant="secondary">
                                      Author
                                    </Badge>
                                  )}
                                </div>
                                {editingReply === reply.id ? (
                                  <InputGroup>
                                    <InputGroupTextarea
                                      value={editReplyTexts[reply.id] ?? reply.content}
                                      onChange={(e) =>
                                        setEditReplyTexts((prev) => ({ ...prev, [reply.id]: e.target.value }))
                                      }
                                    />
                                    <InputGroupAddon align="block-end">
                                      <div className="ml-auto flex">
                                        <InputGroupButton variant="ghost" size="sm" onClick={() => setEditingReply(null)}>
                                          Cancel
                                        </InputGroupButton>
                                        <InputGroupButton
                                          variant="default"
                                          size="sm"
                                          onClick={() => handleSaveEditReply(reply.id)}
                                          disabled={editReply.isPending}
                                        >
                                          Save
                                        </InputGroupButton>
                                      </div>
                                    </InputGroupAddon>
                                  </InputGroup>
                                ) : (
                                  <p>{renderContent(reply.content)}</p>
                                )}
                              </div>

                              {isReplyAuthor && (
                                <DropdownMenuRoot>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground">
                                      <MoreHorizontal />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditReplyTexts((prev) => ({ ...prev, [reply.id]: reply.content }));
                                        setEditingReply(reply.id);
                                      }}
                                    >
                                      <Pencil className="size-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => deleteReply.mutate({ replyId: reply.id })}
                                      disabled={deleteReply.isPending}
                                    >
                                      <Trash2 className="size-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenuRoot>
                              )}
                            </div>

                            <Button
                              onClick={() =>
                                requireAuth(() => toggleReplyUpvote.mutate({ replyId: reply.id }))
                              }
                              variant="ghost"
                              size="sm"
                            >
                              <ArrowUp />
                              {reply.upvoteCount}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply input */}
                {replyingTo === comment.id && (
                  <div className="mt-3 ml-11 flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200">
                      {user?.image ? (
                        <Image src={user.image} alt={user.name} width={28} height={28} className="rounded-full" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <InputGroup>
                        <InputGroupTextarea
                          value={replyTexts[comment.id] ?? ""}
                          onChange={(e) =>
                            setReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                          }
                          placeholder="What do you think?"
                        />
                        <InputGroupAddon align="block-end">
                          <div className="ml-auto flex">
                            <InputGroupButton variant="ghost" size="sm"
                              onClick={() => setReplyingTo(null)}>
                              Cancel
                            </InputGroupButton>
                            <InputGroupButton variant="default" size="sm"
                              onClick={() => handlePostReply(comment.id)}
                              disabled={createReply.isPending}>
                              Post
                            </InputGroupButton>
                          </div>
                        </InputGroupAddon>
                      </InputGroup>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
